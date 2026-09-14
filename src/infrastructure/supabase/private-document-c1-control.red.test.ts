import { describe, expect, it, vi } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import { PrivateDocumentService } from "@application/documents/private-document-service";
import {
  isSafePrivateDocumentBoundedText,
  isSafePrivateDocumentFilename,
} from "@domain/documents/venue-private-document";
import { parseActivePrivateDocumentRow } from "./parse-private-document-read-row";
import { parsePrivateDocumentReceipt } from "./parse-private-document-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const sha256 = "a".repeat(64);

function documentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: documentId,
    project_id: projectId,
    document_type: "venue_contract",
    title: "Venue contract",
    storage_path: path,
    original_filename: "contract.pdf",
    mime_type: "application/pdf",
    size_bytes: bytes.byteLength,
    sha256,
    classification: "private",
    upload_status: "pending",
    source_id: null,
    deleted_at: null,
    revision: 1,
    ...overrides,
  };
}

function document(uploadStatus: "pending" | "ready") {
  return {
    id: documentId,
    projectId,
    documentType: "venue_contract",
    title: "Venue contract",
    storagePath: path,
    originalFilename: "contract.pdf",
    mimeType: "application/pdf" as const,
    sizeBytes: bytes.byteLength,
    sha256,
    classification: "private" as const,
    uploadStatus,
    sourceId: null,
    deletedAt: null,
    revision: uploadStatus === "pending" ? 1 : 2,
  };
}

function servicePorts() {
  const lifecycle = {
    reserveUpload: vi.fn().mockResolvedValue({
      replayed: false,
      document: document("pending"),
    }),
    finalizeUpload: vi.fn().mockResolvedValue({
      replayed: false,
      document: document("ready"),
    }),
    abandonUpload: vi.fn(),
    linkVenue: vi.fn(),
    unlinkVenue: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
  };
  const storage = {
    inspectReservedObject: vi.fn().mockResolvedValue({
      bucket: "project-private" as const,
      path,
      present: false,
    }),
    uploadReservedObject: vi.fn().mockResolvedValue({
      bucket: "project-private" as const,
      path,
    }),
    deleteReservedObject: vi.fn(),
  };
  return {
    lifecycle,
    storage,
    sha256: { hash: vi.fn().mockResolvedValue(sha256) },
  };
}

function uploadRequest(title: string) {
  return {
    operationId,
    projectId,
    documentId,
    documentType: "venue_contract",
    title,
    originalFilename: "contract.pdf",
    declaredMimeType: "application/pdf",
    bytes,
    sourceId: null,
  };
}

function expectProviderInvalid(run: () => unknown): void {
  expect(run).toThrowError(DocumentPersistenceError);
}

describe("WP-2.9C AR-004 canonical C1 control RED", () => {
  it.each([
    ["U+0080", "\u0080"],
    ["U+0085", "\u0085"],
    ["U+009F", "\u009f"],
  ])("rejects %s in bounded text and filenames", (_label, control) => {
    expect(
      isSafePrivateDocumentBoundedText(`venue${control}contract`, 120),
    ).toBe(false);
    expect(isSafePrivateDocumentFilename(`contract${control}.pdf`)).toBe(false);
  });
});

describe("WP-2.9C AR-004 service boundary RED", () => {
  it("rejects C1 metadata before persistence", async () => {
    const ports = servicePorts();
    const service = new PrivateDocumentService(ports);

    await expect(
      service.upload(uploadRequest("Venue\u0085 contract")),
    ).resolves.toEqual({ ok: false, error: "invalid_metadata" });
    expect(ports.lifecycle.reserveUpload).not.toHaveBeenCalled();
  });
});

describe("WP-2.9C AR-004 provider boundary RED", () => {
  it("rejects C1 metadata in lifecycle receipts", () => {
    const input = uploadRequest("Venue\u0085 contract");
    const receipt = {
      action: "reserve_upload",
      replayed: false,
      document: documentRow({ title: input.title }),
    };

    expectProviderInvalid(() =>
      parsePrivateDocumentReceipt(receipt, "reserve_upload", {
        operationId,
        projectId,
        documentId,
        documentType: input.documentType,
        title: input.title,
        originalFilename: input.originalFilename,
        mimeType: "application/pdf",
        sizeBytes: bytes.byteLength,
        sha256,
        sourceId: null,
      }),
    );
  });

  it("rejects C1 metadata in active read rows", () => {
    expectProviderInvalid(() =>
      parseActivePrivateDocumentRow(
        documentRow({ upload_status: "ready", title: "Venue\u009f contract" }),
        projectId,
      ),
    );
  });
});

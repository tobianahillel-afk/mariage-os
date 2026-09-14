import { describe, expect, it, vi } from "vitest";
import { PrivateDocumentService } from "@application/documents/private-document-service";
import { parseActivePrivateDocumentRow } from "./parse-private-document-read-row";
import { parsePrivateDocumentReceipt } from "./parse-private-document-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const sha256 = "a".repeat(64);

function row(overrides: Record<string, unknown> = {}) {
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

function reserveInput(overrides: Record<string, unknown> = {}) {
  return {
    operationId,
    projectId,
    documentId,
    documentType: "venue_contract",
    title: "Venue contract",
    originalFilename: "contract.pdf",
    mimeType: "application/pdf" as const,
    sizeBytes: bytes.byteLength,
    sha256,
    sourceId: null,
    ...overrides,
  };
}

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    action: "reserve_upload",
    replayed: false,
    document: row(overrides),
  };
}

function state(
  uploadStatus: "pending" | "ready",
  documentType: string,
  title: string,
) {
  return {
    id: documentId,
    projectId,
    documentType,
    title,
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

describe("WP-2.9A AR-003 lifecycle receipt Unicode scalar parity RED", () => {
  it("accepts a reserve receipt filename containing exactly 512 Unicode scalar values", () => {
    const originalFilename = `${"😀".repeat(508)}.pdf`;
    const input = reserveInput({ originalFilename });

    expect(
      parsePrivateDocumentReceipt(
        receipt({ original_filename: originalFilename }),
        "reserve_upload",
        input,
      ).document.originalFilename,
    ).toBe(originalFilename);
  });

  it("accepts reserve receipt bounded metadata at PostgreSQL scalar limits", () => {
    const documentType = "😀".repeat(120);
    const title = "😀".repeat(500);
    const input = reserveInput({ documentType, title });

    expect(
      parsePrivateDocumentReceipt(
        receipt({ document_type: documentType, title }),
        "reserve_upload",
        input,
      ).document,
    ).toMatchObject({ documentType, title });
  });
});

describe("WP-2.9A AR-003 read Unicode scalar parity RED", () => {
  it("accepts active read metadata at PostgreSQL scalar limits", () => {
    const documentType = "😀".repeat(120);
    const title = "😀".repeat(500);

    expect(
      parseActivePrivateDocumentRow(
        row({
          document_type: documentType,
          title,
          upload_status: "ready",
          revision: 2,
        }),
        projectId,
        documentId,
      ),
    ).toMatchObject({ documentType, title });
  });
});

describe("WP-2.9A AR-003 service Unicode scalar parity RED", () => {
  it("allows the service to persist metadata valid under PostgreSQL char_length", async () => {
    const documentType = "😀".repeat(120);
    const title = "😀".repeat(500);
    const lifecycle = {
      reserveUpload: vi.fn().mockResolvedValue({
        replayed: false,
        document: state("pending", documentType, title),
      }),
      finalizeUpload: vi.fn().mockResolvedValue({
        replayed: false,
        document: state("ready", documentType, title),
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
      deleteReservedObject: vi.fn(),
    };
    const ingest = { ingest: vi.fn().mockResolvedValue(undefined) };
    const service = new PrivateDocumentService({
      lifecycle,
      storage,
      ingest,
      sha256: { hash: vi.fn().mockResolvedValue(sha256) },
    });

    await expect(
      service.upload({
        operationId,
        projectId,
        documentId,
        documentType,
        title,
        originalFilename: "contract.pdf",
        declaredMimeType: "application/pdf",
        bytes,
        sourceId: null,
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(lifecycle.reserveUpload).toHaveBeenCalledWith(
      expect.objectContaining({ documentType, title }),
    );
    expect(ingest.ingest).toHaveBeenCalledOnce();
  });
});

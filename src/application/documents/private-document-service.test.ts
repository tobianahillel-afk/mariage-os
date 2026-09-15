import { describe, expect, it, vi } from "vitest";
import { DocumentPersistenceError } from "./document-persistence-error";
import { PrivateDocumentService } from "./private-document-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const sha256 = "a".repeat(64);

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

function request() {
  return {
    operationId,
    projectId,
    documentId,
    documentType: "venue_contract",
    title: "Venue contract",
    originalFilename: "contract.pdf",
    declaredMimeType: "application/pdf",
    bytes,
    sourceId: null,
  };
}

function ports(present: boolean) {
  const lifecycle = {
    reserveUpload: vi.fn().mockResolvedValue({
      replayed: false,
      document: document("pending"),
    }),
    finalizeUpload: vi.fn().mockResolvedValue({
      replayed: false,
      document: document("ready"),
    }),
    abandonUpload: vi.fn().mockResolvedValue({
      replayed: false,
      projectId,
      documentId,
      absent: true as const,
    }),
    linkVenue: vi.fn(),
    unlinkVenue: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
  };
  const storage = {
    inspectReservedObject: vi.fn().mockResolvedValue({
      bucket: "project-private" as const,
      path,
      present,
    }),
    deleteReservedObject: vi.fn().mockResolvedValue({
      bucket: "project-private" as const,
      path,
      absent: true as const,
    }),
  };
  const ingest = {
    ingest: vi.fn().mockResolvedValue(undefined),
    abandon: vi.fn().mockResolvedValue(undefined),
  };
  const sha256Port = { hash: vi.fn().mockResolvedValue(sha256) };
  return { lifecycle, storage, ingest, sha256: sha256Port };
}

describe("PrivateDocumentService upload persistence", () => {
  it("hashes and sends the exact validated bytes through trusted ingest before finalization", async () => {
    const fake = ports(false);
    const service = new PrivateDocumentService(fake);

    await expect(service.upload(request())).resolves.toMatchObject({
      ok: true,
      value: { document: { uploadStatus: "ready", storagePath: path } },
    });
    expect(fake.sha256.hash).toHaveBeenCalledWith(bytes);
    expect(fake.lifecycle.reserveUpload).toHaveBeenCalledWith(
      expect.objectContaining({ sha256, sizeBytes: bytes.byteLength }),
    );
    expect(fake.ingest.ingest).toHaveBeenCalledWith({
      projectId,
      documentId,
      bytes,
      mimeType: "application/pdf",
    });
    expect(fake.lifecycle.finalizeUpload).toHaveBeenCalledWith({
      operationId,
      projectId,
      documentId,
    });
  });

  it("delegates interrupted-object recovery to trusted ingest instead of trusting client inspection", async () => {
    const fake = ports(true);
    const service = new PrivateDocumentService(fake);

    await expect(service.upload(request())).resolves.toMatchObject({
      ok: true,
    });
    expect(fake.storage.inspectReservedObject).not.toHaveBeenCalled();
    expect(fake.ingest.ingest).toHaveBeenCalledOnce();
    expect(fake.lifecycle.finalizeUpload).toHaveBeenCalledOnce();
  });

  it("does not finalize when trusted ingest fails", async () => {
    const fake = ports(false);
    fake.ingest.ingest.mockRejectedValue(
      new DocumentPersistenceError(
        "storage_retryable",
        "Trusted private document ingestion failed.",
      ),
    );
    const service = new PrivateDocumentService(fake);

    await expect(service.upload(request())).resolves.toEqual({
      ok: false,
      error: "storage_retryable",
    });
    expect(fake.lifecycle.finalizeUpload).not.toHaveBeenCalled();
  });
});

describe("PrivateDocumentService validation and cleanup", () => {
  it("fails before persistence when MIME/signature validation fails", async () => {
    const fake = ports(false);
    const service = new PrivateDocumentService(fake);
    const invalid = {
      ...request(),
      declaredMimeType: "application/octet-stream",
    };

    await expect(service.upload(invalid)).resolves.toEqual({
      ok: false,
      error: "unsupported_type",
    });
    expect(fake.sha256.hash).not.toHaveBeenCalled();
    expect(fake.lifecycle.reserveUpload).not.toHaveBeenCalled();
  });

  it("fails closed when the SHA provider returns malformed output", async () => {
    const fake = ports(false);
    fake.sha256.hash.mockResolvedValue("A".repeat(64));
    const service = new PrivateDocumentService(fake);

    await expect(service.upload(request())).resolves.toEqual({
      ok: false,
      error: "hash_failed",
    });
    expect(fake.lifecycle.reserveUpload).not.toHaveBeenCalled();
  });

  it("delegates interrupted cleanup and lifecycle abandon to the trusted boundary", async () => {
    const fake = ports(true);
    const service = new PrivateDocumentService(fake);

    await expect(
      service.abandon(operationId, projectId, documentId),
    ).resolves.toEqual({
      ok: true,
      value: { absent: true },
    });
    expect(fake.ingest.abandon).toHaveBeenCalledWith({
      operationId,
      projectId,
      documentId,
    });
    expect(fake.storage.inspectReservedObject).not.toHaveBeenCalled();
    expect(fake.storage.deleteReservedObject).not.toHaveBeenCalled();
    expect(fake.lifecycle.abandonUpload).not.toHaveBeenCalled();
  });

  it("fails closed when trusted abandon cannot prove cleanup", async () => {
    const fake = ports(false);
    fake.ingest.abandon.mockRejectedValue(
      new DocumentPersistenceError(
        "storage_retryable",
        "Trusted private document abandon failed.",
      ),
    );
    const service = new PrivateDocumentService(fake);

    await expect(
      service.abandon(operationId, projectId, documentId),
    ).resolves.toEqual({ ok: false, error: "storage_retryable" });
    expect(fake.lifecycle.abandonUpload).not.toHaveBeenCalled();
    expect(fake.storage.deleteReservedObject).not.toHaveBeenCalled();
  });
});

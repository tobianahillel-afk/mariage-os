import { describe, expect, it, vi } from "vitest";
import {
  DocumentPersistenceError,
  documentPersistenceErrorCode,
} from "./document-persistence-error";
import { PrivateDocumentService } from "./private-document-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const sourceId = "44444444-4444-4444-8444-444444444444";
const venueId = "55555555-5555-4555-8555-555555555555";
const linkId = "66666666-6666-4666-8666-666666666666";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const sha256 = "a".repeat(64);

function row(storagePath = path) {
  return {
    id: documentId,
    projectId,
    documentType: "venue_contract",
    title: "Venue contract",
    storagePath,
    originalFilename: "contract.pdf",
    mimeType: "application/pdf" as const,
    sizeBytes: bytes.byteLength,
    sha256,
    classification: "private" as const,
    uploadStatus: "pending" as const,
    sourceId: null,
    deletedAt: null,
    revision: 1,
  };
}

function request(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  };
}

function ports() {
  const lifecycle = {
    reserveUpload: vi
      .fn()
      .mockResolvedValue({ replayed: false, document: row() }),
    finalizeUpload: vi
      .fn()
      .mockResolvedValue({ replayed: false, document: row() }),
    abandonUpload: vi.fn().mockResolvedValue({
      replayed: false,
      projectId,
      documentId,
      absent: true as const,
    }),
    linkVenue: vi.fn().mockResolvedValue({ linked: true }),
    unlinkVenue: vi.fn().mockResolvedValue({ unlinked: true }),
    softDelete: vi.fn().mockResolvedValue({ deleted: true }),
    restore: vi.fn().mockResolvedValue({ restored: true }),
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
    deleteReservedObject: vi.fn().mockResolvedValue({
      bucket: "project-private" as const,
      path,
      absent: true as const,
    }),
  };
  return {
    lifecycle,
    storage,
    sha256: { hash: vi.fn().mockResolvedValue(sha256) },
  };
}

describe("DocumentPersistenceError coverage", () => {
  it("returns the code only for the dedicated persistence error", () => {
    const error = new DocumentPersistenceError("conflict", "conflict");
    expect(error.name).toBe("DocumentPersistenceError");
    expect(documentPersistenceErrorCode(error)).toBe("conflict");
    expect(documentPersistenceErrorCode(new Error("other"))).toBeNull();
  });
});

describe("PrivateDocumentService identity validation coverage", () => {
  it.each([
    { operationId: 42 },
    { operationId: "not-a-uuid" },
    { projectId: "not-a-uuid" },
    { documentId: "not-a-uuid" },
    { sourceId: "not-a-uuid" },
  ])("rejects invalid identity input %#", async (overrides) => {
    const fake = ports();
    const service = new PrivateDocumentService(fake);
    await expect(service.upload(request(overrides))).resolves.toEqual({
      ok: false,
      error: "invalid_identity",
    });
    expect(fake.lifecycle.reserveUpload).not.toHaveBeenCalled();
  });

  it("accepts a valid non-null source identity", async () => {
    const fake = ports();
    const service = new PrivateDocumentService(fake);
    await expect(service.upload(request({ sourceId }))).resolves.toMatchObject({
      ok: true,
    });
    expect(fake.lifecycle.reserveUpload).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId }),
    );
  });
});

describe("PrivateDocumentService metadata validation coverage", () => {
  it.each([
    { documentType: 42 },
    { documentType: " venue_contract" },
    { documentType: "" },
    { documentType: "x".repeat(121) },
    { documentType: "bad\u0000type" },
    { title: 42 },
    { title: "Venue contract " },
    { title: "" },
    { title: "x".repeat(501) },
    { title: "bad\u007ftitle" },
  ])("rejects malformed bounded metadata %#", async (overrides) => {
    const fake = ports();
    const service = new PrivateDocumentService(fake);
    await expect(service.upload(request(overrides))).resolves.toEqual({
      ok: false,
      error: "invalid_metadata",
    });
  });

  it.each([{ bytes: "not-bytes" }, { originalFilename: 42 }])(
    "rejects non-binary/type inputs %#",
    async (overrides) => {
      const service = new PrivateDocumentService(ports());
      await expect(service.upload(request(overrides))).resolves.toEqual({
        ok: false,
        error: "unsupported_type",
      });
    },
  );
});

describe("PrivateDocumentService hash and provider coverage", () => {
  it("maps a thrown hash implementation to hash_failed", async () => {
    const fake = ports();
    fake.sha256.hash.mockRejectedValue(new Error("hash failed"));
    const service = new PrivateDocumentService(fake);
    await expect(service.upload(request())).resolves.toEqual({
      ok: false,
      error: "hash_failed",
    });
  });

  it("rejects a substituted reservation path before Storage access", async () => {
    const fake = ports();
    fake.lifecycle.reserveUpload.mockResolvedValue({
      replayed: false,
      document: row(`${projectId}/documents/${documentId}/evil`),
    });
    const service = new PrivateDocumentService(fake);
    await expect(service.upload(request())).resolves.toEqual({
      ok: false,
      error: "provider_response_invalid",
    });
    expect(fake.storage.inspectReservedObject).not.toHaveBeenCalled();
  });

  it.each([
    ["conflict", "replay_conflict"],
    ["provider_response_invalid", "provider_response_invalid"],
    ["storage_retryable", "storage_retryable"],
    ["persistence_failed", "persistence_failed"],
  ] as const)("maps %s persistence errors", async (code, expected) => {
    const fake = ports();
    fake.lifecycle.reserveUpload.mockRejectedValue(
      new DocumentPersistenceError(code, "provider failure"),
    );
    const service = new PrivateDocumentService(fake);
    await expect(service.upload(request())).resolves.toEqual({
      ok: false,
      error: expected,
    });
  });

  it("maps unknown failures to persistence_failed", async () => {
    const fake = ports();
    fake.storage.inspectReservedObject.mockRejectedValue(new Error("network"));
    const service = new PrivateDocumentService(fake);
    await expect(service.upload(request())).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });
});

describe("PrivateDocumentService abandon coverage", () => {
  it.each([
    ["bad", projectId, documentId],
    [operationId, "bad", documentId],
    [operationId, projectId, "bad"],
  ])("rejects invalid abandon identities", async (op, project, document) => {
    const service = new PrivateDocumentService(ports());
    await expect(service.abandon(op, project, document)).resolves.toEqual({
      ok: false,
      error: "invalid_identity",
    });
  });

  it("skips delete when the reserved object is already absent", async () => {
    const fake = ports();
    const service = new PrivateDocumentService(fake);
    await expect(
      service.abandon(operationId, projectId, documentId),
    ).resolves.toEqual({
      ok: true,
      value: { absent: true },
    });
    expect(fake.storage.deleteReservedObject).not.toHaveBeenCalled();
  });

  it("returns storage_retryable when cleanup leaves the object present", async () => {
    const fake = ports();
    fake.storage.inspectReservedObject.mockResolvedValue({
      bucket: "project-private",
      path,
      present: true,
    });
    const service = new PrivateDocumentService(fake);
    await expect(
      service.abandon(operationId, projectId, documentId),
    ).resolves.toEqual({
      ok: false,
      error: "storage_retryable",
    });
    expect(fake.lifecycle.abandonUpload).not.toHaveBeenCalled();
  });

  it("maps abandon lifecycle failure through persistence errors", async () => {
    const fake = ports();
    fake.lifecycle.abandonUpload.mockRejectedValue(
      new DocumentPersistenceError("conflict", "conflict"),
    );
    const service = new PrivateDocumentService(fake);
    await expect(
      service.abandon(operationId, projectId, documentId),
    ).resolves.toEqual({
      ok: false,
      error: "replay_conflict",
    });
  });
});

describe("PrivateDocumentService lifecycle delegation coverage", () => {
  it("delegates link, unlink, delete and restore unchanged", async () => {
    const fake = ports();
    const service = new PrivateDocumentService(fake);
    const linkInput = {
      operationId,
      projectId,
      documentId,
      venueId,
      linkId,
      expectedRevision: 2,
    };
    const transition = {
      operationId,
      projectId,
      documentId,
      expectedRevision: 3,
    };
    await expect(service.linkVenue(linkInput)).resolves.toEqual({
      linked: true,
    });
    await expect(service.unlinkVenue(linkInput)).resolves.toEqual({
      unlinked: true,
    });
    await expect(service.softDelete(transition)).resolves.toEqual({
      deleted: true,
    });
    await expect(service.restore(transition)).resolves.toEqual({
      restored: true,
    });
    expect(fake.lifecycle.linkVenue).toHaveBeenCalledWith(linkInput);
    expect(fake.lifecycle.unlinkVenue).toHaveBeenCalledWith(linkInput);
    expect(fake.lifecycle.softDelete).toHaveBeenCalledWith(transition);
    expect(fake.lifecycle.restore).toHaveBeenCalledWith(transition);
  });
});

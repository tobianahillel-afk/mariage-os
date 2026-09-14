import { describe, expect, it, vi } from "vitest";
import type { PrivateDocumentState } from "./private-document-lifecycle-port";
import type {
  PrivateDocumentDownloadPort,
  PrivateDocumentQueryPort,
} from "./private-document-read-port";
import { PrivateDocumentReadService } from "./private-document-read-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const venueId = "55555555-5555-4555-8555-555555555555";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

function document(
  overrides: Partial<PrivateDocumentState> = {},
): PrivateDocumentState {
  return {
    id: documentId,
    projectId,
    documentType: "venue_contract",
    title: "Venue contract",
    storagePath: path,
    originalFilename: "contract.pdf",
    mimeType: "application/pdf",
    sizeBytes: bytes.byteLength,
    sha256: "a".repeat(64),
    classification: "private",
    uploadStatus: "ready",
    sourceId: null,
    deletedAt: null,
    revision: 2,
    ...overrides,
  };
}

function serviceWith(
  queryOverrides: Partial<PrivateDocumentQueryPort> = {},
  downloadOverrides: Partial<PrivateDocumentDownloadPort> = {},
) {
  const query: PrivateDocumentQueryPort = {
    listVenueDocuments: vi.fn().mockResolvedValue([document()]),
    getActiveDocument: vi.fn().mockResolvedValue(document()),
    ...queryOverrides,
  };
  const download: PrivateDocumentDownloadPort = {
    download: vi.fn().mockResolvedValue(bytes),
    ...downloadOverrides,
  };
  return {
    service: new PrivateDocumentReadService({ query, download }),
    query,
    download,
  };
}

describe("PrivateDocumentReadService coverage guards", () => {
  it("maps an untyped query exception to persistence_failed", async () => {
    const fake = serviceWith({
      getActiveDocument: vi
        .fn()
        .mockRejectedValue(new Error("provider detail")),
    });

    await expect(
      fake.service.getActiveDocument(projectId, documentId),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });

  it("returns null without Storage access when download lookup is not visible", async () => {
    const fake = serviceWith({
      getActiveDocument: vi.fn().mockResolvedValue(null),
    });

    await expect(
      fake.service.downloadActiveDocument(projectId, documentId),
    ).resolves.toEqual({ ok: true, value: null });
    expect(fake.download.download).not.toHaveBeenCalled();
  });

  it("rejects valid PDF bytes whose exact size no longer matches retained metadata", async () => {
    const fake = serviceWith({
      getActiveDocument: vi
        .fn()
        .mockResolvedValue(document({ sizeBytes: bytes.byteLength + 1 })),
    });

    await expect(
      fake.service.downloadActiveDocument(projectId, documentId),
    ).resolves.toEqual({ ok: false, error: "provider_response_invalid" });
  });

  it.each([
    ["get", () => serviceWith().service.getActiveDocument("bad", documentId)],
    [
      "download",
      () => serviceWith().service.downloadActiveDocument(projectId, "bad"),
    ],
    [
      "list venue",
      () => serviceWith().service.listVenueDocuments(projectId, "bad"),
    ],
  ])("rejects invalid identity for %s", async (_name, run) => {
    await expect(run()).resolves.toEqual({
      ok: false,
      error: "invalid_identity",
    });
  });

  it("accepts an empty active Venue document list", async () => {
    const fake = serviceWith({
      listVenueDocuments: vi.fn().mockResolvedValue([]),
    });
    await expect(
      fake.service.listVenueDocuments(projectId, venueId),
    ).resolves.toEqual({ ok: true, value: [] });
  });
});

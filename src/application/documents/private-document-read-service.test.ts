import { describe, expect, it, vi } from "vitest";
import { DocumentPersistenceError } from "./document-persistence-error";
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

function ports() {
  const query: PrivateDocumentQueryPort = {
    listVenueDocuments: vi.fn().mockResolvedValue([document()]),
    getActiveDocument: vi.fn().mockResolvedValue(document()),
  };
  const download: PrivateDocumentDownloadPort = {
    download: vi.fn().mockResolvedValue(bytes),
  };
  return { query, download };
}

describe("PrivateDocumentReadService", () => {
  it("rejects invalid list identities before provider access", async () => {
    const fake = ports();
    const service = new PrivateDocumentReadService(fake);

    await expect(service.listVenueDocuments("bad", venueId)).resolves.toEqual({
      ok: false,
      error: "invalid_identity",
    });
    expect(fake.query.listVenueDocuments).not.toHaveBeenCalled();
  });

  it("lists only provider rows that preserve active ready project identity", async () => {
    const fake = ports();
    const service = new PrivateDocumentReadService(fake);

    await expect(
      service.listVenueDocuments(projectId, venueId),
    ).resolves.toEqual({
      ok: true,
      value: [document()],
    });

    vi.mocked(fake.query.listVenueDocuments).mockResolvedValue([
      document({ projectId: "77777777-7777-4777-8777-777777777777" }),
    ]);
    await expect(
      service.listVenueDocuments(projectId, venueId),
    ).resolves.toEqual({
      ok: false,
      error: "provider_response_invalid",
    });
  });

  it("returns null for a non-disclosing active-document miss", async () => {
    const fake = ports();
    vi.mocked(fake.query.getActiveDocument).mockResolvedValue(null);
    const service = new PrivateDocumentReadService(fake);

    await expect(
      service.getActiveDocument(projectId, documentId),
    ).resolves.toEqual({
      ok: true,
      value: null,
    });
  });

  it("downloads only the path bound to the validated active document", async () => {
    const fake = ports();
    const service = new PrivateDocumentReadService(fake);

    await expect(
      service.downloadActiveDocument(projectId, documentId),
    ).resolves.toEqual({
      ok: true,
      value: {
        document: document(),
        bytes,
        disposition: "attachment",
        filename: "contract.pdf",
        mimeType: "application/pdf",
      },
    });
    expect(fake.download.download).toHaveBeenCalledWith(path);
  });

  it.each([
    document({ uploadStatus: "pending" }),
    document({ deletedAt: "2026-09-14T00:00:00.000Z" }),
    document({ id: "77777777-7777-4777-8777-777777777777" }),
    document({ storagePath: `${projectId}/documents/${documentId}/wrong` }),
  ])(
    "fails closed before download for substituted or non-active metadata %#",
    async (row) => {
      const fake = ports();
      vi.mocked(fake.query.getActiveDocument).mockResolvedValue(row);
      const service = new PrivateDocumentReadService(fake);

      await expect(
        service.downloadActiveDocument(projectId, documentId),
      ).resolves.toEqual({
        ok: false,
        error: "provider_response_invalid",
      });
      expect(fake.download.download).not.toHaveBeenCalled();
    },
  );

  it("fails closed when downloaded bytes no longer match the PDF metadata", async () => {
    const fake = ports();
    vi.mocked(fake.download.download).mockResolvedValue(
      new Uint8Array([1, 2, 3]),
    );
    const service = new PrivateDocumentReadService(fake);

    await expect(
      service.downloadActiveDocument(projectId, documentId),
    ).resolves.toEqual({
      ok: false,
      error: "provider_response_invalid",
    });
  });

  it("maps provider failures without exposing provider details", async () => {
    const fake = ports();
    vi.mocked(fake.download.download).mockRejectedValue(
      new DocumentPersistenceError("storage_retryable", "provider detail"),
    );
    const service = new PrivateDocumentReadService(fake);

    await expect(
      service.downloadActiveDocument(projectId, documentId),
    ).resolves.toEqual({
      ok: false,
      error: "storage_retryable",
    });
  });
});

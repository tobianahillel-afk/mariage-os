import { describe, expect, it } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import {
  parseActivePrivateDocumentRow,
  parseVenuePrivateDocumentLinkIds,
} from "./parse-private-document-read-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const venueId = "55555555-5555-4555-8555-555555555555";
const otherId = "77777777-7777-4777-8777-777777777777";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: documentId,
    project_id: projectId,
    document_type: "venue_contract",
    title: "Venue contract",
    storage_path: `${projectId}/documents/${documentId}/original`,
    original_filename: "contract.pdf",
    mime_type: "application/pdf",
    size_bytes: 6,
    sha256: "a".repeat(64),
    classification: "private",
    upload_status: "ready",
    source_id: null,
    deleted_at: null,
    revision: 2,
    ...overrides,
  };
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    project_id: projectId,
    document_id: documentId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: null,
    ...overrides,
  };
}

function expectInvalid(run: () => unknown): void {
  expect(run).toThrowError(DocumentPersistenceError);
  try {
    run();
  } catch (error) {
    expect(error).toMatchObject({ code: "provider_response_invalid" });
  }
}

describe("parseActivePrivateDocumentRow", () => {
  it("parses an active ready row with exact project and document identity", () => {
    expect(parseActivePrivateDocumentRow(row(), projectId, documentId)).toMatchObject({
      id: documentId,
      projectId,
      storagePath: `${projectId}/documents/${documentId}/original`,
      uploadStatus: "ready",
      deletedAt: null,
    });
  });

  it.each([
    ["project_id", otherId],
    ["id", otherId],
    ["document_type", ""],
    ["title", "Venue contract "],
    ["storage_path", `${projectId}/documents/${documentId}/wrong`],
    ["original_filename", "../contract.pdf"],
    ["mime_type", "text/plain"],
    ["size_bytes", 0],
    ["sha256", "A".repeat(64)],
    ["classification", "public"],
    ["upload_status", "pending"],
    ["source_id", "bad"],
    ["deleted_at", "2026-09-14T00:00:00.000Z"],
    ["revision", 0],
  ])("rejects malformed or substituted %s", (field, value) => {
    const expectedDocumentId = field === "id" ? documentId : undefined;
    expectInvalid(() =>
      parseActivePrivateDocumentRow(row({ [field]: value }), projectId, expectedDocumentId),
    );
  });

  it("rejects non-record rows", () => {
    expectInvalid(() => parseActivePrivateDocumentRow(null, projectId));
  });
});

describe("parseVenuePrivateDocumentLinkIds", () => {
  it("returns stable unique linked document ids", () => {
    expect(parseVenuePrivateDocumentLinkIds([link(), link()], projectId, venueId)).toEqual([
      documentId,
    ]);
  });

  it.each([
    ["project_id", otherId],
    ["document_id", "bad"],
    ["target_type", "vendor"],
    ["target_id", otherId],
    ["relationship_type", "attachment"],
  ])("rejects malformed or substituted link %s", (field, value) => {
    expectInvalid(() =>
      parseVenuePrivateDocumentLinkIds([link({ [field]: value })], projectId, venueId),
    );
  });

  it("rejects a non-array link response", () => {
    expectInvalid(() => parseVenuePrivateDocumentLinkIds(null, projectId, venueId));
  });
});

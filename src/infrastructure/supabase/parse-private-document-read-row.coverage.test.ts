import { describe, expect, it } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import { parseActivePrivateDocumentRow } from "./parse-private-document-read-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const sourceId = "33333333-3333-4333-8333-333333333333";

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

function expectInvalid(overrides: Record<string, unknown>): void {
  expect(() => parseActivePrivateDocumentRow(row(overrides), projectId)).toThrowError(
    DocumentPersistenceError,
  );
}

describe("parseActivePrivateDocumentRow coverage guards", () => {
  it.each([
    ["document_type non-text", { document_type: 42 }],
    ["document_type too long", { document_type: "x".repeat(121) }],
    ["document_type control", { document_type: "venue\u0001contract" }],
    ["filename non-text", { original_filename: 42 }],
    ["filename empty", { original_filename: "" }],
    ["filename too long", { original_filename: `${"x".repeat(509)}.pdf` }],
    ["filename control", { original_filename: "bad\u0001.pdf" }],
    ["filename backslash", { original_filename: "bad\\contract.pdf" }],
    ["filename extension", { original_filename: "contract.txt" }],
    ["size non-number", { size_bytes: "6" }],
    ["size non-integer", { size_bytes: 1.5 }],
    ["size too large", { size_bytes: 25_000_001 }],
    ["sha non-text", { sha256: 42 }],
    ["storage path non-text", { storage_path: 42 }],
  ])("rejects %s", (_name, overrides) => {
    expectInvalid(overrides);
  });

  it("accepts a valid same-project source UUID", () => {
    expect(
      parseActivePrivateDocumentRow(row({ source_id: sourceId }), projectId),
    ).toMatchObject({ sourceId });
  });

  it("rejects an array where a provider row record is required", () => {
    expect(() => parseActivePrivateDocumentRow([], projectId)).toThrowError(
      DocumentPersistenceError,
    );
  });
});

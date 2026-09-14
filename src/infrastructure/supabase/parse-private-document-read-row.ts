import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import type { PrivateDocumentState } from "@application/documents/private-document-lifecycle-port";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidResponse(): never {
  throw new DocumentPersistenceError(
    "provider_response_invalid",
    "Invalid private document read provider response.",
  );
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidResponse();
  }
  return value as Record<string, unknown>;
}

function uuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) invalidResponse();
  return value;
}

function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    invalidResponse();
  }
  return value;
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function boundedText(value: unknown, max: number): string {
  if (typeof value !== "string") invalidResponse();
  if (value.length < 1 || value.length > max) invalidResponse();
  if (value.trim() !== value || hasControlCharacter(value)) invalidResponse();
  return value;
}

function filename(value: unknown): string {
  if (typeof value !== "string") invalidResponse();
  if (value.length < 1 || value.length > 512) invalidResponse();
  if (hasControlCharacter(value)) invalidResponse();
  if (value.includes("/") || value.includes("\\")) invalidResponse();
  if (!value.toLowerCase().endsWith(".pdf")) invalidResponse();
  return value;
}

function sizeBytes(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > 25_000_000
  ) {
    invalidResponse();
  }
  return value;
}

function sha256(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    invalidResponse();
  }
  return value;
}

function nullableUuid(value: unknown): string | null {
  if (value === null) return null;
  return uuid(value);
}

function canonicalPath(
  value: unknown,
  projectId: string,
  documentId: string,
): string {
  if (typeof value !== "string") invalidResponse();
  const expected = `${projectId}/documents/${documentId}/original`;
  if (value !== expected) invalidResponse();
  return value;
}

export function parseActivePrivateDocumentRow(
  value: unknown,
  expectedProjectId: string,
  expectedDocumentId?: string,
): PrivateDocumentState {
  const row = record(value);
  const projectId = uuid(row.project_id);
  const id = uuid(row.id);
  if (projectId !== expectedProjectId) invalidResponse();
  if (expectedDocumentId !== undefined && id !== expectedDocumentId) {
    invalidResponse();
  }
  if (row.mime_type !== "application/pdf") invalidResponse();
  if (row.classification !== "private") invalidResponse();
  if (row.upload_status !== "ready") invalidResponse();
  if (row.deleted_at !== null) invalidResponse();

  return {
    id,
    projectId,
    documentType: boundedText(row.document_type, 120),
    title: boundedText(row.title, 500),
    storagePath: canonicalPath(row.storage_path, projectId, id),
    originalFilename: filename(row.original_filename),
    mimeType: "application/pdf",
    sizeBytes: sizeBytes(row.size_bytes),
    sha256: sha256(row.sha256),
    classification: "private",
    uploadStatus: "ready",
    sourceId: nullableUuid(row.source_id),
    deletedAt: null,
    revision: integer(row.revision),
  };
}

export function parseVenuePrivateDocumentLinkIds(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
): readonly string[] {
  if (!Array.isArray(value)) invalidResponse();

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const row = record(item);
    if (uuid(row.project_id) !== expectedProjectId) invalidResponse();
    const documentId = uuid(row.document_id);
    if (row.target_type !== "venue") invalidResponse();
    if (uuid(row.target_id) !== expectedVenueId) invalidResponse();
    if (row.relationship_type !== null) invalidResponse();
    if (!seen.has(documentId)) {
      seen.add(documentId);
      ids.push(documentId);
    }
  }
  return ids;
}

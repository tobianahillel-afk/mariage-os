import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import type {
  LinkPrivateDocumentVenueInput,
  PrivateDocumentAbandonReceipt,
  PrivateDocumentIdentityInput,
  PrivateDocumentLinkReceipt,
  PrivateDocumentReceipt,
  PrivateDocumentState,
  PrivateDocumentUnlinkReceipt,
  ReservePrivateDocumentInput,
  TransitionPrivateDocumentInput,
} from "@application/documents/private-document-lifecycle-port";
import {
  isSafePrivateDocumentBoundedText,
  isSafePrivateDocumentFilename,
} from "@domain/documents/venue-private-document";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("invalid record");
  }
  return value as Record<string, unknown>;
}

function uuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error("invalid uuid");
  }
  return value;
}

function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error("invalid integer");
  }
  return value;
}

function boundedText(value: unknown, max: number): string {
  if (!isSafePrivateDocumentBoundedText(value, max)) {
    throw new Error("invalid text");
  }
  return value;
}

function nullableUuid(value: unknown): string | null {
  if (value === null) return null;
  return uuid(value);
}

function nullableTimestamp(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error("invalid timestamp");
  return value;
}

function privateDocumentSize(value: unknown): number {
  if (typeof value !== "number") throw new Error("invalid size");
  if (!Number.isSafeInteger(value)) throw new Error("invalid size");
  if (value < 1 || value > 25_000_000) throw new Error("invalid size");
  return value;
}

function privateDocumentSha(value: unknown): string {
  if (typeof value !== "string") throw new Error("invalid sha");
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error("invalid sha");
  return value;
}

function privateDocumentStatus(value: unknown): "pending" | "ready" {
  if (value === "pending") return value;
  if (value === "ready") return value;
  throw new Error("invalid upload status");
}

function privateDocumentFilename(value: unknown): string {
  if (!isSafePrivateDocumentFilename(value)) {
    throw new Error("invalid filename");
  }
  if (!value.toLowerCase().endsWith(".pdf")) {
    throw new Error("invalid filename");
  }
  return value;
}

function privateStoragePath(
  value: unknown,
  projectId: string,
  documentId: string,
): string {
  if (typeof value !== "string") throw new Error("invalid storage path");
  const expected = `${projectId}/documents/${documentId}/original`;
  if (value !== expected) throw new Error("invalid storage path");
  return value;
}

function exactPdfMime(value: unknown): "application/pdf" {
  if (value !== "application/pdf") throw new Error("invalid mime");
  return value;
}

function exactPrivateClassification(value: unknown): "private" {
  if (value !== "private") throw new Error("invalid classification");
  return value;
}

function parseDocument(value: unknown): PrivateDocumentState {
  const row = record(value);
  const projectId = uuid(row.project_id);
  const id = uuid(row.id);
  return {
    id,
    projectId,
    documentType: boundedText(row.document_type, 120),
    title: boundedText(row.title, 500),
    storagePath: privateStoragePath(row.storage_path, projectId, id),
    originalFilename: privateDocumentFilename(row.original_filename),
    mimeType: exactPdfMime(row.mime_type),
    sizeBytes: privateDocumentSize(row.size_bytes),
    sha256: privateDocumentSha(row.sha256),
    classification: exactPrivateClassification(row.classification),
    uploadStatus: privateDocumentStatus(row.upload_status),
    sourceId: nullableUuid(row.source_id),
    deletedAt: nullableTimestamp(row.deleted_at),
    revision: integer(row.revision),
  };
}

function replayed(receipt: Record<string, unknown>): boolean {
  if (typeof receipt.replayed !== "boolean") throw new Error("invalid replay");
  return receipt.replayed;
}

function expectedDocument(
  receipt: Record<string, unknown>,
  projectId: string,
  documentId: string,
): PrivateDocumentState {
  const document = parseDocument(receipt.document);
  if (document.projectId !== projectId) throw new Error("substituted project");
  if (document.id !== documentId) throw new Error("substituted document");
  return document;
}

function assertReserveMetadata(
  document: PrivateDocumentState,
  input: ReservePrivateDocumentInput,
): void {
  if (document.uploadStatus !== "pending")
    throw new Error("wrong reserve state");
  if (document.documentType !== input.documentType)
    throw new Error("wrong reserve state");
  if (document.title !== input.title) throw new Error("wrong reserve state");
  if (document.sourceId !== input.sourceId)
    throw new Error("wrong reserve state");
  if (document.deletedAt !== null) throw new Error("wrong reserve state");
}

function assertReserveBinary(
  document: PrivateDocumentState,
  input: ReservePrivateDocumentInput,
): void {
  if (document.originalFilename !== input.originalFilename) {
    throw new Error("wrong reserve state");
  }
  if (document.mimeType !== input.mimeType)
    throw new Error("wrong reserve state");
  if (document.sizeBytes !== input.sizeBytes)
    throw new Error("wrong reserve state");
  if (document.sha256 !== input.sha256) throw new Error("wrong reserve state");
}

function assertReceiptState(
  action: "reserve_upload" | "finalize_upload" | "soft_delete" | "restore",
  document: PrivateDocumentState,
  input:
    | ReservePrivateDocumentInput
    | PrivateDocumentIdentityInput
    | TransitionPrivateDocumentInput,
): void {
  switch (action) {
    case "reserve_upload":
      assertReserveMetadata(document, input as ReservePrivateDocumentInput);
      assertReserveBinary(document, input as ReservePrivateDocumentInput);
      return;
    case "finalize_upload":
      if (document.uploadStatus !== "ready")
        throw new Error("wrong finalize state");
      return;
    case "soft_delete":
      if (document.deletedAt === null) throw new Error("wrong delete state");
      return;
    case "restore":
      if (document.deletedAt !== null) throw new Error("wrong restore state");
  }
}

function parseLink(
  value: unknown,
  input: LinkPrivateDocumentVenueInput,
): PrivateDocumentLinkReceipt["link"] {
  const link = record(value);
  if (uuid(link.id) !== input.linkId) throw new Error("substituted link");
  if (uuid(link.project_id) !== input.projectId)
    throw new Error("substituted link");
  if (uuid(link.document_id) !== input.documentId)
    throw new Error("substituted link");
  if (link.target_type !== "venue") throw new Error("substituted link");
  if (uuid(link.target_id) !== input.venueId)
    throw new Error("substituted link");
  if (link.relationship_type !== null) throw new Error("substituted link");
  return {
    id: input.linkId,
    projectId: input.projectId,
    documentId: input.documentId,
    venueId: input.venueId,
  };
}

function invalidResponse(): never {
  throw new DocumentPersistenceError(
    "provider_response_invalid",
    "Invalid private document provider response.",
  );
}

export function parsePrivateDocumentReceipt(
  value: unknown,
  action: "reserve_upload" | "finalize_upload" | "soft_delete" | "restore",
  input:
    | ReservePrivateDocumentInput
    | PrivateDocumentIdentityInput
    | TransitionPrivateDocumentInput,
): PrivateDocumentReceipt {
  try {
    const receipt = record(value);
    if (receipt.action !== action) throw new Error("wrong action");
    const document = expectedDocument(
      receipt,
      input.projectId,
      input.documentId,
    );
    assertReceiptState(action, document, input);
    return { replayed: replayed(receipt), document };
  } catch {
    return invalidResponse();
  }
}

export function parsePrivateDocumentLinkReceipt(
  value: unknown,
  input: LinkPrivateDocumentVenueInput,
): PrivateDocumentLinkReceipt {
  try {
    const receipt = record(value);
    if (receipt.action !== "link_venue") throw new Error("wrong action");
    const document = expectedDocument(
      receipt,
      input.projectId,
      input.documentId,
    );
    return {
      replayed: replayed(receipt),
      document,
      link: parseLink(receipt.link, input),
    };
  } catch {
    return invalidResponse();
  }
}

export function parsePrivateDocumentUnlinkReceipt(
  value: unknown,
  input: LinkPrivateDocumentVenueInput,
): PrivateDocumentUnlinkReceipt {
  try {
    const receipt = record(value);
    if (receipt.action !== "unlink_venue") throw new Error("invalid unlink");
    if (receipt.linkId !== input.linkId) throw new Error("invalid unlink");
    if (receipt.absent !== true) throw new Error("invalid unlink");
    return {
      replayed: replayed(receipt),
      document: expectedDocument(receipt, input.projectId, input.documentId),
      linkId: input.linkId,
      absent: true,
    };
  } catch {
    return invalidResponse();
  }
}

export function parsePrivateDocumentAbandonReceipt(
  value: unknown,
  input: PrivateDocumentIdentityInput,
): PrivateDocumentAbandonReceipt {
  try {
    const receipt = record(value);
    if (receipt.action !== "abandon_upload") throw new Error("invalid abandon");
    if (receipt.projectId !== input.projectId)
      throw new Error("invalid abandon");
    if (receipt.documentId !== input.documentId)
      throw new Error("invalid abandon");
    if (receipt.absent !== true) throw new Error("invalid abandon");
    return {
      replayed: replayed(receipt),
      projectId: input.projectId,
      documentId: input.documentId,
      absent: true,
    };
  } catch {
    return invalidResponse();
  }
}

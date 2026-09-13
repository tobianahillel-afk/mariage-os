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
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > max ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new Error("invalid text");
  }
  return value;
}

function parseDocument(value: unknown): PrivateDocumentState {
  const row = record(value);
  const sourceId = row.source_id === null ? null : uuid(row.source_id);
  const deletedAt = row.deleted_at === null ? null : row.deleted_at;
  if (
    typeof row.storage_path !== "string" ||
    typeof row.original_filename !== "string" ||
    row.mime_type !== "application/pdf" ||
    typeof row.size_bytes !== "number" ||
    !Number.isSafeInteger(row.size_bytes) ||
    row.size_bytes < 1 ||
    row.size_bytes > 25_000_000 ||
    typeof row.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(row.sha256) ||
    row.classification !== "private" ||
    (row.upload_status !== "pending" && row.upload_status !== "ready") ||
    (deletedAt !== null && typeof deletedAt !== "string")
  ) {
    throw new Error("invalid document row");
  }

  const projectId = uuid(row.project_id);
  const id = uuid(row.id);
  if (
    row.storage_path !== `${projectId}/documents/${id}/original` ||
    row.original_filename.length < 1 ||
    row.original_filename.length > 512 ||
    /[\u0000-\u001f\u007f/\\]/u.test(row.original_filename) ||
    !row.original_filename.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("invalid private document shape");
  }

  return {
    id,
    projectId,
    documentType: boundedText(row.document_type, 120),
    title: boundedText(row.title, 500),
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: "application/pdf",
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    classification: "private",
    uploadStatus: row.upload_status,
    sourceId,
    deletedAt,
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
  if (document.projectId !== projectId || document.id !== documentId) {
    throw new Error("substituted document");
  }
  return document;
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
    const document = expectedDocument(receipt, input.projectId, input.documentId);
    if (action === "reserve_upload") {
      const reserve = input as ReservePrivateDocumentInput;
      if (
        document.uploadStatus !== "pending" ||
        document.documentType !== reserve.documentType ||
        document.title !== reserve.title ||
        document.originalFilename !== reserve.originalFilename ||
        document.mimeType !== reserve.mimeType ||
        document.sizeBytes !== reserve.sizeBytes ||
        document.sha256 !== reserve.sha256 ||
        document.sourceId !== reserve.sourceId ||
        document.deletedAt !== null
      ) {
        throw new Error("wrong reserve state");
      }
    }
    if (action === "finalize_upload" && document.uploadStatus !== "ready") {
      throw new Error("wrong finalize state");
    }
    if (action === "soft_delete" && document.deletedAt === null) {
      throw new Error("wrong delete state");
    }
    if (action === "restore" && document.deletedAt !== null) {
      throw new Error("wrong restore state");
    }
    return { replayed: replayed(receipt), document };
  } catch (error) {
    if (error instanceof DocumentPersistenceError) throw error;
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
    const document = expectedDocument(receipt, input.projectId, input.documentId);
    const link = record(receipt.link);
    if (
      uuid(link.id) !== input.linkId ||
      uuid(link.project_id) !== input.projectId ||
      uuid(link.document_id) !== input.documentId ||
      link.target_type !== "venue" ||
      uuid(link.target_id) !== input.venueId ||
      link.relationship_type !== null
    ) {
      throw new Error("substituted link");
    }
    return {
      replayed: replayed(receipt),
      document,
      link: {
        id: input.linkId,
        projectId: input.projectId,
        documentId: input.documentId,
        venueId: input.venueId,
      },
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
    if (
      receipt.action !== "unlink_venue" ||
      receipt.linkId !== input.linkId ||
      receipt.absent !== true
    ) {
      throw new Error("invalid unlink");
    }
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
    if (
      receipt.action !== "abandon_upload" ||
      receipt.projectId !== input.projectId ||
      receipt.documentId !== input.documentId ||
      receipt.absent !== true
    ) {
      throw new Error("invalid abandon");
    }
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

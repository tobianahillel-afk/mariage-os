import {
  isPrivateDocumentSha256,
  isSafePrivateDocumentBoundedText,
  validateVenuePrivatePdf,
  type ValidatedVenuePrivatePdf,
  type VenuePrivatePdfValidationError,
} from "@domain/documents/venue-private-document";
import { documentPersistenceErrorCode } from "./document-persistence-error";
import type { TrustedPrivateDocumentIngestPort } from "./private-document-ingest-port";
import type {
  LinkPrivateDocumentVenueInput,
  PrivateDocumentLifecyclePort,
  PrivateDocumentReceipt,
  PrivateDocumentSha256Port,
  TransitionPrivateDocumentInput,
} from "./private-document-lifecycle-port";
import type { PrivateDocumentStoragePort } from "./private-document-storage-port";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UploadPrivateVenueDocumentRequest {
  readonly operationId: unknown;
  readonly projectId: unknown;
  readonly documentId: unknown;
  readonly documentType: unknown;
  readonly title: unknown;
  readonly originalFilename: unknown;
  readonly declaredMimeType: unknown;
  readonly bytes: unknown;
  readonly sourceId: unknown;
}

export interface PrivateDocumentServicePorts {
  readonly lifecycle: PrivateDocumentLifecyclePort;
  readonly storage: PrivateDocumentStoragePort;
  readonly ingest: TrustedPrivateDocumentIngestPort;
  readonly sha256: PrivateDocumentSha256Port;
}

type PrivateDocumentServiceError =
  | "invalid_identity"
  | "invalid_metadata"
  | "hash_failed"
  | VenuePrivatePdfValidationError
  | "replay_conflict"
  | "provider_response_invalid"
  | "storage_retryable"
  | "persistence_failed";

export type PrivateDocumentResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: PrivateDocumentServiceError };

interface UploadIdentities {
  readonly operationId: string;
  readonly projectId: string;
  readonly documentId: string;
  readonly sourceId: string | null;
}

interface UploadContent {
  readonly documentType: string;
  readonly title: string;
  readonly bytes: Uint8Array;
  readonly pdf: ValidatedVenuePrivatePdf;
}

type NormalizedUploadRequest = UploadIdentities & UploadContent;

function persistenceFailure(error: unknown): PrivateDocumentServiceError {
  const code = documentPersistenceErrorCode(error);
  if (code === "conflict") return "replay_conflict";
  if (code === "provider_response_invalid") return code;
  if (code === "storage_retryable") return code;
  return "persistence_failed";
}

function identity(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function optionalIdentity(value: unknown): value is string | null {
  return value === null || identity(value);
}

function boundedText(value: unknown, max: number): value is string {
  return isSafePrivateDocumentBoundedText(value, max);
}

function storagePath(projectId: string, documentId: string): string {
  return `${projectId}/documents/${documentId}/original`;
}

function normalizeIdentities(
  input: UploadPrivateVenueDocumentRequest,
): PrivateDocumentResult<UploadIdentities> {
  if (!identity(input.operationId))
    return { ok: false, error: "invalid_identity" };
  if (!identity(input.projectId))
    return { ok: false, error: "invalid_identity" };
  if (!identity(input.documentId))
    return { ok: false, error: "invalid_identity" };
  if (!optionalIdentity(input.sourceId)) {
    return { ok: false, error: "invalid_identity" };
  }
  return {
    ok: true,
    value: {
      operationId: input.operationId,
      projectId: input.projectId,
      documentId: input.documentId,
      sourceId: input.sourceId,
    },
  };
}

function normalizeContent(
  input: UploadPrivateVenueDocumentRequest,
): PrivateDocumentResult<UploadContent> {
  if (!boundedText(input.documentType, 120)) {
    return { ok: false, error: "invalid_metadata" };
  }
  if (!boundedText(input.title, 500)) {
    return { ok: false, error: "invalid_metadata" };
  }
  if (!(input.bytes instanceof Uint8Array)) {
    return { ok: false, error: "unsupported_type" };
  }
  if (typeof input.originalFilename !== "string") {
    return { ok: false, error: "unsupported_type" };
  }
  const pdf = validateVenuePrivatePdf({
    originalFilename: input.originalFilename,
    declaredMimeType: input.declaredMimeType,
    bytes: input.bytes,
  });
  if (!pdf.ok) return pdf;
  return {
    ok: true,
    value: {
      documentType: input.documentType,
      title: input.title,
      bytes: input.bytes,
      pdf: pdf.value,
    },
  };
}

function normalizeUploadRequest(
  input: UploadPrivateVenueDocumentRequest,
): PrivateDocumentResult<NormalizedUploadRequest> {
  const identities = normalizeIdentities(input);
  if (!identities.ok) return identities;
  const content = normalizeContent(input);
  if (!content.ok) return content;
  return { ok: true, value: { ...identities.value, ...content.value } };
}

async function hashUpload(
  port: PrivateDocumentSha256Port,
  bytes: Uint8Array,
): Promise<PrivateDocumentResult<string>> {
  try {
    const sha256 = await port.hash(bytes);
    if (!isPrivateDocumentSha256(sha256)) {
      return { ok: false, error: "hash_failed" };
    }
    return { ok: true, value: sha256 };
  } catch {
    return { ok: false, error: "hash_failed" };
  }
}

async function persistUpload(
  ports: PrivateDocumentServicePorts,
  input: NormalizedUploadRequest,
  sha256: string,
): Promise<PrivateDocumentResult<PrivateDocumentReceipt>> {
  try {
    const reservation = await ports.lifecycle.reserveUpload({
      operationId: input.operationId,
      projectId: input.projectId,
      documentId: input.documentId,
      documentType: input.documentType,
      title: input.title,
      originalFilename: input.pdf.originalFilename,
      mimeType: input.pdf.mimeType,
      sizeBytes: input.pdf.sizeBytes,
      sha256,
      sourceId: input.sourceId,
    });
    const exactPath = storagePath(input.projectId, input.documentId);
    if (reservation.document.storagePath !== exactPath) {
      return { ok: false, error: "provider_response_invalid" };
    }

    await ports.ingest.ingest({
      projectId: input.projectId,
      documentId: input.documentId,
      bytes: input.bytes,
      mimeType: input.pdf.mimeType,
    });

    const finalized = await ports.lifecycle.finalizeUpload({
      operationId: input.operationId,
      projectId: input.projectId,
      documentId: input.documentId,
    });
    return { ok: true, value: finalized };
  } catch (error) {
    return { ok: false, error: persistenceFailure(error) };
  }
}

export class PrivateDocumentService {
  constructor(private readonly ports: PrivateDocumentServicePorts) {}

  async upload(
    input: UploadPrivateVenueDocumentRequest,
  ): Promise<PrivateDocumentResult<PrivateDocumentReceipt>> {
    const normalized = normalizeUploadRequest(input);
    if (!normalized.ok) return normalized;
    const sha256 = await hashUpload(this.ports.sha256, normalized.value.bytes);
    if (!sha256.ok) return sha256;
    return persistUpload(this.ports, normalized.value, sha256.value);
  }

  async abandon(
    operationId: string,
    projectId: string,
    documentId: string,
  ): Promise<PrivateDocumentResult<{ readonly absent: true }>> {
    if (
      !identity(operationId) ||
      !identity(projectId) ||
      !identity(documentId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      await this.ports.ingest.abandon({ operationId, projectId, documentId });
      return { ok: true, value: { absent: true } };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  linkVenue(input: LinkPrivateDocumentVenueInput) {
    return this.ports.lifecycle.linkVenue(input);
  }

  unlinkVenue(input: LinkPrivateDocumentVenueInput) {
    return this.ports.lifecycle.unlinkVenue(input);
  }

  softDelete(input: TransitionPrivateDocumentInput) {
    return this.ports.lifecycle.softDelete(input);
  }

  restore(input: TransitionPrivateDocumentInput) {
    return this.ports.lifecycle.restore(input);
  }
}

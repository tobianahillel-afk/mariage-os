import {
  isPrivateDocumentSha256,
  validateVenuePrivatePdf,
  type VenuePrivatePdfValidationError,
} from "@domain/documents/venue-private-document";
import { documentPersistenceErrorCode } from "./document-persistence-error";
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
  return (
    typeof value === "string" &&
    value.trim() === value &&
    value.length >= 1 &&
    value.length <= max &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function storagePath(projectId: string, documentId: string): string {
  return `${projectId}/documents/${documentId}/original`;
}

export class PrivateDocumentService {
  constructor(private readonly ports: PrivateDocumentServicePorts) {}

  async upload(
    input: UploadPrivateVenueDocumentRequest,
  ): Promise<PrivateDocumentResult<PrivateDocumentReceipt>> {
    const { operationId, projectId, documentId, sourceId } = input;
    if (
      !identity(operationId) ||
      !identity(projectId) ||
      !identity(documentId) ||
      !optionalIdentity(sourceId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }
    if (!boundedText(input.documentType, 120) || !boundedText(input.title, 500)) {
      return { ok: false, error: "invalid_metadata" };
    }
    if (!(input.bytes instanceof Uint8Array) || typeof input.originalFilename !== "string") {
      return { ok: false, error: "unsupported_type" };
    }

    const validated = validateVenuePrivatePdf({
      originalFilename: input.originalFilename,
      declaredMimeType: input.declaredMimeType,
      bytes: input.bytes,
    });
    if (!validated.ok) return validated;

    let sha256: string;
    try {
      sha256 = await this.ports.sha256.hash(input.bytes);
    } catch {
      return { ok: false, error: "hash_failed" };
    }
    if (!isPrivateDocumentSha256(sha256)) {
      return { ok: false, error: "hash_failed" };
    }

    try {
      const reservation = await this.ports.lifecycle.reserveUpload({
        operationId,
        projectId,
        documentId,
        documentType: input.documentType,
        title: input.title,
        originalFilename: validated.value.originalFilename,
        mimeType: validated.value.mimeType,
        sizeBytes: validated.value.sizeBytes,
        sha256,
        sourceId,
      });
      const exactPath = storagePath(projectId, documentId);
      if (reservation.document.storagePath !== exactPath) {
        return { ok: false, error: "provider_response_invalid" };
      }
      const inspection = await this.ports.storage.inspectReservedObject(exactPath);
      if (!inspection.present) {
        await this.ports.storage.uploadReservedObject({
          path: exactPath,
          bytes: input.bytes,
          mimeType: validated.value.mimeType,
        });
      }
      const finalized = await this.ports.lifecycle.finalizeUpload({
        operationId,
        projectId,
        documentId,
      });
      return { ok: true, value: finalized };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  async abandon(
    operationId: string,
    projectId: string,
    documentId: string,
  ): Promise<PrivateDocumentResult<{ readonly absent: true }>> {
    if (!identity(operationId) || !identity(projectId) || !identity(documentId)) {
      return { ok: false, error: "invalid_identity" };
    }
    const exactPath = storagePath(projectId, documentId);
    try {
      const before = await this.ports.storage.inspectReservedObject(exactPath);
      if (before.present) await this.ports.storage.deleteReservedObject(exactPath);
      const after = await this.ports.storage.inspectReservedObject(exactPath);
      if (after.present) return { ok: false, error: "storage_retryable" };
      await this.ports.lifecycle.abandonUpload({ operationId, projectId, documentId });
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

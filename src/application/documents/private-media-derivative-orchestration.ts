import {
  validateVenuePrivateGeneratedImage,
  validateVenuePrivateGeneratedImageFile,
  type ValidatedVenuePrivateGeneratedImageFile,
  type VenuePrivateImageValidationError,
} from "@domain/documents/venue-private-image";
import { isMediaUuid } from "@domain/documents/venue-remote-media";
import { mediaPersistenceErrorCode } from "./media-persistence-error";
import {
  PrivateMediaImageInspectionError,
  type PrivateMediaImageInspectorPort,
} from "./private-media-image-inspector-port";
import type {
  PrivateMediaDerivativeLifecyclePort,
  PrivateMediaLifecyclePort,
  VenuePrivateDerivativeAbandonment,
  VenuePrivateDerivativeFinalization,
} from "./private-media-lifecycle-port";
import {
  PrivateMediaSha256Error,
  type PrivateMediaSha256Port,
} from "./private-media-sha256-port";
import {
  isConfirmedPrivateObjectAbsence,
  isExactStorageInspection,
} from "./private-media-storage-receipt";
import type { PrivateMediaStoragePort } from "./private-media-storage-port";

export interface CreateVenuePrivateDerivativeRequest {
  readonly operationId: unknown;
  readonly projectId: unknown;
  readonly mediaId: unknown;
  readonly parentMediaId: unknown;
  readonly derivativeKind: unknown;
  readonly derivativeVersion: unknown;
  readonly mimeType: unknown;
  readonly bytes: unknown;
}

export interface AbandonVenuePrivateDerivativeRequest {
  readonly operationId: unknown;
  readonly projectId: unknown;
  readonly mediaId: unknown;
  readonly derivativeKind: unknown;
  readonly derivativeVersion: unknown;
}

type VenuePrivateDerivativeKind = "thumbnail" | "preview";

type DerivativeServiceError =
  | "invalid_identity"
  | "invalid_derivative"
  | VenuePrivateImageValidationError
  | "decode_failed"
  | "hash_failed"
  | "replay_conflict"
  | "provider_response_invalid"
  | "storage_retryable"
  | "persistence_failed";

type DerivativeResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: DerivativeServiceError };

interface PrivateDerivativePortCandidate {
  readonly lifecycle: PrivateMediaLifecyclePort;
  readonly storage: PrivateMediaStoragePort;
  readonly imageInspector?: PrivateMediaImageInspectorPort;
  readonly sha256?: PrivateMediaSha256Port;
}

interface PrivateDerivativeLifecyclePorts {
  readonly lifecycle: PrivateMediaDerivativeLifecyclePort;
  readonly storage: PrivateMediaStoragePort;
}

interface PrivateDerivativeCreationPorts extends PrivateDerivativeLifecyclePorts {
  readonly imageInspector: PrivateMediaImageInspectorPort;
  readonly sha256: PrivateMediaSha256Port;
}

interface NormalizedVenuePrivateDerivative extends ValidatedVenuePrivateGeneratedImageFile {
  readonly operationId: string;
  readonly projectId: string;
  readonly mediaId: string;
  readonly parentMediaId: string;
  readonly derivativeKind: VenuePrivateDerivativeKind;
  readonly derivativeVersion: number;
  readonly bytes: Uint8Array;
}

interface PreparedVenuePrivateDerivative extends NormalizedVenuePrivateDerivative {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly sha256: string;
}

type ValidDerivativeIdentity = CreateVenuePrivateDerivativeRequest & {
  readonly operationId: string;
  readonly projectId: string;
  readonly mediaId: string;
  readonly parentMediaId: string;
};

function persistenceFailure(error: unknown): DerivativeServiceError {
  const code = mediaPersistenceErrorCode(error);
  if (code === "conflict") return "replay_conflict";
  if (code === "provider_response_invalid") return code;
  if (code === "storage_retryable") return code;
  return "persistence_failed";
}

function privateMediaFailure(error: unknown): DerivativeServiceError {
  if (error instanceof PrivateMediaImageInspectionError) return error.code;
  if (error instanceof PrivateMediaSha256Error) return error.code;
  return persistenceFailure(error);
}

function isDerivativeKind(value: unknown): value is VenuePrivateDerivativeKind {
  return value === "thumbnail" || value === "preview";
}

function isDerivativeVersion(value: unknown): value is number {
  return (
    Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 32_767
  );
}

function hasDerivativeIdentity(
  input: CreateVenuePrivateDerivativeRequest,
): input is ValidDerivativeIdentity {
  return (
    isMediaUuid(input.operationId) &&
    isMediaUuid(input.projectId) &&
    isMediaUuid(input.mediaId) &&
    isMediaUuid(input.parentMediaId) &&
    input.mediaId !== input.parentMediaId
  );
}

function derivativeStoragePath(
  projectId: string,
  mediaId: string,
  derivativeKind: VenuePrivateDerivativeKind,
  derivativeVersion: number,
): string {
  return `${projectId}/media/${mediaId}/${derivativeKind}-v${derivativeVersion}`;
}

function isDerivativeLifecycle(
  value: PrivateMediaLifecyclePort,
): value is PrivateMediaDerivativeLifecyclePort {
  const candidate = value as Partial<PrivateMediaDerivativeLifecyclePort>;
  return (
    typeof candidate.reserveDerivative === "function" &&
    typeof candidate.finalizeDerivative === "function" &&
    typeof candidate.abandonDerivative === "function"
  );
}

function derivativeLifecyclePorts(
  value: PrivateDerivativePortCandidate | null,
): PrivateDerivativeLifecyclePorts | null {
  if (value === null || !isDerivativeLifecycle(value.lifecycle)) return null;
  return { lifecycle: value.lifecycle, storage: value.storage };
}

function derivativeCreationPorts(
  value: PrivateDerivativePortCandidate | null,
): PrivateDerivativeCreationPorts | null {
  const lifecycle = derivativeLifecyclePorts(value);
  if (
    lifecycle === null ||
    value?.imageInspector === undefined ||
    value.sha256 === undefined
  ) {
    return null;
  }
  return {
    ...lifecycle,
    imageInspector: value.imageInspector,
    sha256: value.sha256,
  };
}

function normalizeDerivativeRequest(
  input: CreateVenuePrivateDerivativeRequest,
): DerivativeResult<NormalizedVenuePrivateDerivative> {
  if (!hasDerivativeIdentity(input)) {
    return { ok: false, error: "invalid_identity" };
  }
  if (
    !isDerivativeKind(input.derivativeKind) ||
    !isDerivativeVersion(input.derivativeVersion)
  ) {
    return { ok: false, error: "invalid_derivative" };
  }
  if (!(input.bytes instanceof Uint8Array)) {
    return { ok: false, error: "invalid_size" };
  }
  const file = validateVenuePrivateGeneratedImageFile({
    mimeType: input.mimeType,
    bytes: input.bytes,
  });
  if (!file.ok) return file;
  return {
    ok: true,
    value: {
      operationId: input.operationId,
      projectId: input.projectId,
      mediaId: input.mediaId,
      parentMediaId: input.parentMediaId,
      derivativeKind: input.derivativeKind,
      derivativeVersion: input.derivativeVersion,
      bytes: input.bytes,
      ...file.value,
    },
  };
}

async function prepareDerivative(
  draft: NormalizedVenuePrivateDerivative,
  ports: PrivateDerivativeCreationPorts,
): Promise<DerivativeResult<PreparedVenuePrivateDerivative>> {
  let dimensions: { readonly widthPx: number; readonly heightPx: number };
  try {
    dimensions = await ports.imageInspector.inspect(draft.bytes);
  } catch (error) {
    return { ok: false, error: privateMediaFailure(error) };
  }
  const validated = validateVenuePrivateGeneratedImage({
    mimeType: draft.mimeType,
    bytes: draft.bytes,
    ...dimensions,
  });
  if (!validated.ok) return validated;

  try {
    const sha256 = await ports.sha256.hashExactBytes(draft.bytes);
    return { ok: true, value: { ...draft, ...dimensions, sha256 } };
  } catch (error) {
    return { ok: false, error: privateMediaFailure(error) };
  }
}

async function derivativeUploadRequired(
  replayed: boolean,
  expectedPath: string,
  storage: PrivateMediaStoragePort,
): Promise<DerivativeResult<boolean>> {
  if (!replayed) return { ok: true, value: true };
  const inspection = await storage.inspectReservedObject(expectedPath);
  if (!isExactStorageInspection(inspection, expectedPath)) {
    return { ok: false, error: "provider_response_invalid" };
  }
  return { ok: true, value: !inspection.present };
}

async function uploadDerivative(
  media: PreparedVenuePrivateDerivative,
  expectedPath: string,
  storage: PrivateMediaStoragePort,
  required: boolean,
): Promise<DerivativeResult<null>> {
  if (!required) return { ok: true, value: null };
  const upload = await storage.uploadReservedObject({
    path: expectedPath,
    bytes: media.bytes,
    mimeType: media.mimeType,
  });
  if (upload.bucket !== "project-private" || upload.path !== expectedPath) {
    return { ok: false, error: "provider_response_invalid" };
  }
  return { ok: true, value: null };
}

async function persistDerivative(
  media: PreparedVenuePrivateDerivative,
  ports: PrivateDerivativeCreationPorts,
): Promise<DerivativeResult<VenuePrivateDerivativeFinalization>> {
  const expectedPath = derivativeStoragePath(
    media.projectId,
    media.mediaId,
    media.derivativeKind,
    media.derivativeVersion,
  );
  try {
    const reservation = await ports.lifecycle.reserveDerivative({
      operationId: media.operationId,
      projectId: media.projectId,
      mediaId: media.mediaId,
      parentMediaId: media.parentMediaId,
      derivativeKind: media.derivativeKind,
      derivativeVersion: media.derivativeVersion,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      sha256: media.sha256,
      widthPx: media.widthPx,
      heightPx: media.heightPx,
    });
    if (reservation.storagePath !== expectedPath) {
      return { ok: false, error: "provider_response_invalid" };
    }

    const uploadRequired = await derivativeUploadRequired(
      reservation.replayed,
      expectedPath,
      ports.storage,
    );
    if (!uploadRequired.ok) return uploadRequired;

    const upload = await uploadDerivative(
      media,
      expectedPath,
      ports.storage,
      uploadRequired.value,
    );
    if (!upload.ok) return upload;

    const finalization = await ports.lifecycle.finalizeDerivative({
      operationId: media.operationId,
      projectId: media.projectId,
      mediaId: media.mediaId,
      parentMediaId: media.parentMediaId,
      derivativeKind: media.derivativeKind,
      derivativeVersion: media.derivativeVersion,
    });
    if (finalization.storagePath !== expectedPath) {
      return { ok: false, error: "provider_response_invalid" };
    }
    return { ok: true, value: finalization };
  } catch (error) {
    return { ok: false, error: persistenceFailure(error) };
  }
}

function isAbandonRequestValid(
  input: AbandonVenuePrivateDerivativeRequest,
): input is AbandonVenuePrivateDerivativeRequest & {
  readonly operationId: string;
  readonly projectId: string;
  readonly mediaId: string;
  readonly derivativeKind: VenuePrivateDerivativeKind;
  readonly derivativeVersion: number;
} {
  return (
    isMediaUuid(input.operationId) &&
    isMediaUuid(input.projectId) &&
    isMediaUuid(input.mediaId) &&
    isDerivativeKind(input.derivativeKind) &&
    isDerivativeVersion(input.derivativeVersion)
  );
}

export async function orchestratePrivateDerivativeCreate(
  input: CreateVenuePrivateDerivativeRequest,
  candidate: PrivateDerivativePortCandidate | null,
): Promise<DerivativeResult<VenuePrivateDerivativeFinalization>> {
  const normalized = normalizeDerivativeRequest(input);
  if (!normalized.ok) return normalized;

  const ports = derivativeCreationPorts(candidate);
  if (ports === null) return { ok: false, error: "persistence_failed" };

  const prepared = await prepareDerivative(normalized.value, ports);
  if (!prepared.ok) return prepared;
  return persistDerivative(prepared.value, ports);
}

export async function orchestratePrivateDerivativeAbandon(
  input: AbandonVenuePrivateDerivativeRequest,
  candidate: PrivateDerivativePortCandidate | null,
): Promise<DerivativeResult<VenuePrivateDerivativeAbandonment>> {
  if (!isAbandonRequestValid(input)) {
    return { ok: false, error: "invalid_identity" };
  }
  const ports = derivativeLifecyclePorts(candidate);
  if (ports === null) return { ok: false, error: "persistence_failed" };

  const expectedPath = derivativeStoragePath(
    input.projectId,
    input.mediaId,
    input.derivativeKind,
    input.derivativeVersion,
  );
  try {
    const deletion = await ports.storage.deleteReservedObject(expectedPath);
    if (!isConfirmedPrivateObjectAbsence(deletion, expectedPath)) {
      return { ok: false, error: "provider_response_invalid" };
    }
    const value = await ports.lifecycle.abandonDerivative({
      operationId: input.operationId,
      projectId: input.projectId,
      mediaId: input.mediaId,
    });
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: persistenceFailure(error) };
  }
}

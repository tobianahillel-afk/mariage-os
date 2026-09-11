import {
  validateVenuePrivateImage,
  validateVenuePrivateImageFile,
  type ValidatedVenuePrivateImageFile,
  type VenuePrivateImageValidationError,
} from "@domain/documents/venue-private-image";
import {
  isMediaUuid,
  normalizeVenueMediaPresentationDraft,
  normalizeVenueRemoteMediaDraft,
  type NormalizedVenueRemoteMediaDraft,
  type VenueMediaCategory,
  type VenueRemoteMediaBundle,
  type VenueRemoteMediaValidationError,
} from "@domain/documents/venue-remote-media";
import type {
  VenueRemoteMediaLifecycleAction,
  VenueRemoteMediaLifecycleReceipt,
} from "@domain/documents/venue-remote-media-lifecycle";
import { mediaPersistenceErrorCode } from "./media-persistence-error";
import {
  orchestratePrivateDerivativeAbandon,
  orchestratePrivateDerivativeCreate,
  type AbandonVenuePrivateDerivativeRequest,
  type CreateVenuePrivateDerivativeRequest,
} from "./private-media-derivative-orchestration";
import {
  PrivateMediaImageInspectionError,
  type PrivateMediaImageInspectorPort,
} from "./private-media-image-inspector-port";
import { hasPrivateOriginalIdentity } from "./private-media-original-identity";
import { privateOriginalStoragePath } from "./private-media-path";
import type {
  PrivateMediaLifecyclePort,
  VenuePrivateDerivativeAbandonment,
  VenuePrivateDerivativeFinalization,
  VenuePrivateOriginalAbandonment,
  VenuePrivateOriginalFinalization,
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

export interface CreateVenueRemoteMediaInput {
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly mediaId: unknown;
  readonly linkId: unknown;
  readonly category: unknown;
  readonly remoteUrl: unknown;
  readonly sourcePageUrl: unknown;
  readonly caption: unknown;
}

export interface TransitionVenueRemoteMediaLifecycleRequest {
  readonly projectId: unknown;
  readonly mediaId: unknown;
  readonly action: unknown;
  readonly expectedRevision: unknown;
}

export interface CreateVenuePrivateOriginalRequest {
  readonly operationId: unknown;
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly mediaId: unknown;
  readonly linkId: unknown;
  readonly category: unknown;
  readonly caption: unknown;
  readonly originalFilename: unknown;
  readonly bytes: unknown;
}

export interface AbandonVenuePrivateOriginalRequest {
  readonly operationId: unknown;
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly mediaId: unknown;
  readonly linkId: unknown;
}

export interface NormalizedCreateVenueRemoteMediaInput extends NormalizedVenueRemoteMediaDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly mediaId: string;
  readonly linkId: string;
}

export interface NormalizedTransitionVenueRemoteMediaLifecycleRequest {
  readonly projectId: string;
  readonly mediaId: string;
  readonly action: VenueRemoteMediaLifecycleAction;
  readonly expectedRevision: number;
}

interface NormalizedVenuePrivateOriginalDraft extends ValidatedVenuePrivateImageFile {
  readonly operationId: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly mediaId: string;
  readonly linkId: string;
  readonly category: VenueMediaCategory | null;
  readonly caption: string | null;
  readonly bytes: Uint8Array;
}

interface PreparedVenuePrivateOriginal extends NormalizedVenuePrivateOriginalDraft {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly sha256: string;
}

export interface MediaPort {
  createVenueRemoteMedia(
    input: NormalizedCreateVenueRemoteMediaInput,
  ): Promise<VenueRemoteMediaBundle>;
  listVenueRemoteMedia(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueRemoteMediaBundle[]>;
  transitionVenueRemoteMediaLifecycle?(
    input: NormalizedTransitionVenueRemoteMediaLifecycleRequest,
  ): Promise<VenueRemoteMediaLifecycleReceipt>;
}

export interface PrivateMediaServicePorts {
  readonly lifecycle: PrivateMediaLifecyclePort;
  readonly storage: PrivateMediaStoragePort;
  readonly imageInspector?: PrivateMediaImageInspectorPort;
  readonly sha256?: PrivateMediaSha256Port;
}

interface PrivateMediaCreationPorts extends PrivateMediaServicePorts {
  readonly imageInspector: PrivateMediaImageInspectorPort;
  readonly sha256: PrivateMediaSha256Port;
}

type MediaServiceError =
  | "invalid_identity"
  | "invalid_action"
  | "invalid_revision"
  | "invalid_derivative"
  | VenueRemoteMediaValidationError
  | VenuePrivateImageValidationError
  | "decode_failed"
  | "hash_failed"
  | "replay_conflict"
  | "provider_response_invalid"
  | "storage_retryable"
  | "persistence_failed";

export type MediaResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: MediaServiceError };

function persistenceFailure(error: unknown): MediaServiceError {
  const code = mediaPersistenceErrorCode(error);
  if (code === "conflict") return "replay_conflict";
  if (code === "provider_response_invalid") return code;
  if (code === "storage_retryable") return code;
  return "persistence_failed";
}

function privateMediaFailure(error: unknown): MediaServiceError {
  if (error instanceof PrivateMediaImageInspectionError) return error.code;
  if (error instanceof PrivateMediaSha256Error) return error.code;
  return persistenceFailure(error);
}

function isVenueRemoteMediaLifecycleAction(
  value: unknown,
): value is VenueRemoteMediaLifecycleAction {
  return value === "soft_delete" || value === "restore";
}

function isPositiveSafeRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function privateCreationPorts(
  value: PrivateMediaServicePorts | null,
): PrivateMediaCreationPorts | null {
  if (
    value === null ||
    value.imageInspector === undefined ||
    value.sha256 === undefined
  ) {
    return null;
  }
  return {
    lifecycle: value.lifecycle,
    storage: value.storage,
    imageInspector: value.imageInspector,
    sha256: value.sha256,
  };
}

function normalizePrivateOriginalRequest(
  input: CreateVenuePrivateOriginalRequest,
): MediaResult<NormalizedVenuePrivateOriginalDraft> {
  if (!hasPrivateOriginalIdentity(input)) {
    return { ok: false, error: "invalid_identity" };
  }
  const presentation = normalizeVenueMediaPresentationDraft(input);
  if (!presentation.ok) return presentation;
  if (typeof input.originalFilename !== "string") {
    return { ok: false, error: "invalid_filename" };
  }
  if (!(input.bytes instanceof Uint8Array)) {
    return { ok: false, error: "invalid_size" };
  }
  const file = validateVenuePrivateImageFile({
    originalFilename: input.originalFilename,
    bytes: input.bytes,
  });
  if (!file.ok) return file;
  return {
    ok: true,
    value: {
      operationId: input.operationId,
      projectId: input.projectId,
      venueId: input.venueId,
      mediaId: input.mediaId,
      linkId: input.linkId,
      category: presentation.value.category,
      caption: presentation.value.caption,
      bytes: input.bytes,
      ...file.value,
    },
  };
}

async function preparePrivateOriginal(
  draft: NormalizedVenuePrivateOriginalDraft,
  ports: PrivateMediaCreationPorts,
): Promise<MediaResult<PreparedVenuePrivateOriginal>> {
  let dimensions: { readonly widthPx: number; readonly heightPx: number };
  try {
    dimensions = await ports.imageInspector.inspect(draft.bytes);
  } catch (error) {
    return { ok: false, error: privateMediaFailure(error) };
  }
  const validated = validateVenuePrivateImage({
    originalFilename: draft.originalFilename,
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

async function privateOriginalUploadRequired(
  replayed: boolean,
  expectedPath: string,
  storage: PrivateMediaStoragePort,
): Promise<MediaResult<boolean>> {
  if (!replayed) return { ok: true, value: true };

  const inspection = await storage.inspectReservedObject(expectedPath);
  if (!isExactStorageInspection(inspection, expectedPath)) {
    return { ok: false, error: "provider_response_invalid" };
  }
  return { ok: true, value: !inspection.present };
}

async function uploadPrivateOriginal(
  media: PreparedVenuePrivateOriginal,
  expectedPath: string,
  storage: PrivateMediaStoragePort,
  required: boolean,
): Promise<MediaResult<null>> {
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

async function persistPrivateOriginal(
  media: PreparedVenuePrivateOriginal,
  ports: PrivateMediaCreationPorts,
): Promise<MediaResult<VenuePrivateOriginalFinalization>> {
  const expectedPath = privateOriginalStoragePath(
    media.projectId,
    media.mediaId,
  );
  try {
    const reservation = await ports.lifecycle.reserveOriginal({
      operationId: media.operationId,
      projectId: media.projectId,
      venueId: media.venueId,
      mediaId: media.mediaId,
      linkId: media.linkId,
      category: media.category,
      caption: media.caption,
      originalFilename: media.originalFilename,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      sha256: media.sha256,
      widthPx: media.widthPx,
      heightPx: media.heightPx,
    });
    if (reservation.storagePath !== expectedPath) {
      return { ok: false, error: "provider_response_invalid" };
    }

    const uploadRequired = await privateOriginalUploadRequired(
      reservation.replayed,
      expectedPath,
      ports.storage,
    );
    if (!uploadRequired.ok) return uploadRequired;

    const upload = await uploadPrivateOriginal(
      media,
      expectedPath,
      ports.storage,
      uploadRequired.value,
    );
    if (!upload.ok) return upload;

    const finalization = await ports.lifecycle.finalizeOriginal({
      operationId: media.operationId,
      projectId: media.projectId,
      mediaId: media.mediaId,
    });
    if (finalization.storagePath !== expectedPath) {
      return { ok: false, error: "provider_response_invalid" };
    }
    return { ok: true, value: finalization };
  } catch (error) {
    return { ok: false, error: persistenceFailure(error) };
  }
}

export class MediaService {
  constructor(
    private readonly port: MediaPort,
    private readonly privateMedia: PrivateMediaServicePorts | null = null,
  ) {}

  async createVenueRemoteMedia(
    input: CreateVenueRemoteMediaInput,
  ): Promise<MediaResult<VenueRemoteMediaBundle>> {
    if (
      !isMediaUuid(input.projectId) ||
      !isMediaUuid(input.venueId) ||
      !isMediaUuid(input.mediaId) ||
      !isMediaUuid(input.linkId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }

    const normalized = normalizeVenueRemoteMediaDraft(input);
    if (!normalized.ok) return normalized;

    try {
      const value = await this.port.createVenueRemoteMedia({
        projectId: input.projectId,
        venueId: input.venueId,
        mediaId: input.mediaId,
        linkId: input.linkId,
        ...normalized.value,
      });
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  async transitionVenueRemoteMediaLifecycle(
    input: TransitionVenueRemoteMediaLifecycleRequest,
  ): Promise<MediaResult<VenueRemoteMediaLifecycleReceipt>> {
    if (!isMediaUuid(input.projectId) || !isMediaUuid(input.mediaId)) {
      return { ok: false, error: "invalid_identity" };
    }
    if (!isVenueRemoteMediaLifecycleAction(input.action)) {
      return { ok: false, error: "invalid_action" };
    }
    if (!isPositiveSafeRevision(input.expectedRevision)) {
      return { ok: false, error: "invalid_revision" };
    }
    const transition = this.port.transitionVenueRemoteMediaLifecycle;
    if (transition === undefined) {
      return { ok: false, error: "persistence_failed" };
    }
    try {
      const value = await transition.call(this.port, {
        projectId: input.projectId,
        mediaId: input.mediaId,
        action: input.action,
        expectedRevision: input.expectedRevision,
      });
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  async createVenuePrivateOriginal(
    input: CreateVenuePrivateOriginalRequest,
  ): Promise<MediaResult<VenuePrivateOriginalFinalization>> {
    const normalized = normalizePrivateOriginalRequest(input);
    if (!normalized.ok) return normalized;

    const ports = privateCreationPorts(this.privateMedia);
    if (ports === null) return { ok: false, error: "persistence_failed" };

    const prepared = await preparePrivateOriginal(normalized.value, ports);
    if (!prepared.ok) return prepared;
    return persistPrivateOriginal(prepared.value, ports);
  }

  async createVenuePrivateDerivative(
    input: CreateVenuePrivateDerivativeRequest,
  ): Promise<MediaResult<VenuePrivateDerivativeFinalization>> {
    return orchestratePrivateDerivativeCreate(input, this.privateMedia);
  }

  async listVenueRemoteMedia(
    projectId: unknown,
    venueId: unknown,
  ): Promise<MediaResult<readonly VenueRemoteMediaBundle[]>> {
    if (!isMediaUuid(projectId) || !isMediaUuid(venueId)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      return {
        ok: true,
        value: await this.port.listVenueRemoteMedia(projectId, venueId),
      };
    } catch {
      return { ok: false, error: "persistence_failed" };
    }
  }

  async abandonVenuePrivateOriginal(
    input: AbandonVenuePrivateOriginalRequest,
  ): Promise<MediaResult<VenuePrivateOriginalAbandonment>> {
    if (!hasPrivateOriginalIdentity(input)) {
      return { ok: false, error: "invalid_identity" };
    }
    if (this.privateMedia === null) {
      return { ok: false, error: "persistence_failed" };
    }

    const storagePath = privateOriginalStoragePath(
      input.projectId,
      input.mediaId,
    );

    try {
      const deletion =
        await this.privateMedia.storage.deleteReservedObject(storagePath);
      if (!isConfirmedPrivateObjectAbsence(deletion, storagePath)) {
        return { ok: false, error: "provider_response_invalid" };
      }
      const value = await this.privateMedia.lifecycle.abandonOriginal(input);
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  async abandonVenuePrivateDerivative(
    input: AbandonVenuePrivateDerivativeRequest,
  ): Promise<MediaResult<VenuePrivateDerivativeAbandonment>> {
    return orchestratePrivateDerivativeAbandon(input, this.privateMedia);
  }
}

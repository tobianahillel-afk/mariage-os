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
import { mediaPersistenceErrorCode } from "./media-persistence-error";
import {
  PrivateMediaImageInspectionError,
  type PrivateMediaImageInspectorPort,
} from "./private-media-image-inspector-port";
import type {
  AbandonVenuePrivateOriginalInput,
  PrivateMediaLifecyclePort,
  VenuePrivateOriginalAbandonment,
  VenuePrivateOriginalFinalization,
} from "./private-media-lifecycle-port";
import {
  PrivateMediaSha256Error,
  type PrivateMediaSha256Port,
} from "./private-media-sha256-port";
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

function privateOriginalStoragePath(
  projectId: string,
  mediaId: string,
): string {
  return `${projectId}/media/${mediaId}/original`;
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

function hasPrivateIdentity(input: CreateVenuePrivateOriginalRequest): boolean {
  return (
    isMediaUuid(input.operationId) &&
    isMediaUuid(input.projectId) &&
    isMediaUuid(input.venueId) &&
    isMediaUuid(input.mediaId) &&
    isMediaUuid(input.linkId)
  );
}

function normalizePrivateOriginalRequest(
  input: CreateVenuePrivateOriginalRequest,
): MediaResult<NormalizedVenuePrivateOriginalDraft> {
  if (!hasPrivateIdentity(input)) {
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
      operationId: input.operationId as string,
      projectId: input.projectId as string,
      venueId: input.venueId as string,
      mediaId: input.mediaId as string,
      linkId: input.linkId as string,
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

    let uploadRequired = true;
    if (reservation.replayed) {
      const inspection = await ports.storage.inspectReservedObject(expectedPath);
      if (
        inspection.bucket !== "project-private" ||
        inspection.path !== expectedPath ||
        typeof inspection.present !== "boolean"
      ) {
        return { ok: false, error: "provider_response_invalid" };
      }
      uploadRequired = !inspection.present;
    }

    if (uploadRequired) {
      const upload = await ports.storage.uploadReservedObject({
        path: expectedPath,
        bytes: media.bytes,
        mimeType: media.mimeType,
      });
      if (upload.bucket !== "project-private" || upload.path !== expectedPath) {
        return { ok: false, error: "provider_response_invalid" };
      }
    }

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

function isAbandonRequestValid(
  input: AbandonVenuePrivateOriginalRequest,
): input is AbandonVenuePrivateOriginalInput {
  return (
    isMediaUuid(input.operationId) &&
    isMediaUuid(input.projectId) &&
    isMediaUuid(input.venueId) &&
    isMediaUuid(input.mediaId) &&
    isMediaUuid(input.linkId)
  );
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
    if (!isAbandonRequestValid(input)) {
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
      await this.privateMedia.storage.deleteReservedObject(storagePath);
      const value = await this.privateMedia.lifecycle.abandonOriginal(input);
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }
}

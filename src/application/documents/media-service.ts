import {
  isMediaUuid,
  normalizeVenueRemoteMediaDraft,
  type NormalizedVenueRemoteMediaDraft,
  type VenueRemoteMediaBundle,
  type VenueRemoteMediaValidationError,
} from "@domain/documents/venue-remote-media";
import { mediaPersistenceErrorCode } from "./media-persistence-error";
import type {
  AbandonVenuePrivateOriginalInput,
  PrivateMediaLifecyclePort,
  VenuePrivateOriginalAbandonment,
} from "./private-media-lifecycle-port";
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
}

type MediaServiceError =
  | "invalid_identity"
  | VenueRemoteMediaValidationError
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

function privateOriginalStoragePath(
  projectId: string,
  mediaId: string,
): string {
  return `${projectId}/media/${mediaId}/original`;
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

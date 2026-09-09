import {
  isMediaUuid,
  normalizeVenueRemoteMediaDraft,
  type NormalizedVenueRemoteMediaDraft,
  type VenueRemoteMediaBundle,
  type VenueRemoteMediaValidationError,
} from "@domain/documents/venue-remote-media";
import { mediaPersistenceErrorCode } from "./media-persistence-error";

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

type MediaServiceError =
  | "invalid_identity"
  | VenueRemoteMediaValidationError
  | "replay_conflict"
  | "persistence_failed";

export type MediaResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: MediaServiceError };

function persistenceFailure(error: unknown): MediaServiceError {
  return mediaPersistenceErrorCode(error) === "conflict"
    ? "replay_conflict"
    : "persistence_failed";
}

export class MediaService {
  constructor(private readonly port: MediaPort) {}

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
}

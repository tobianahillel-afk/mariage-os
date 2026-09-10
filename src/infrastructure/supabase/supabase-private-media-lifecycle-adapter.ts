import { MediaPersistenceError } from "@application/documents/media-persistence-error";
import type {
  PrivateMediaLifecyclePort,
  ReserveVenuePrivateOriginalInput,
  VenuePrivateOriginalReservation,
} from "@application/documents/private-media-lifecycle-port";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

export interface SupabasePrivateMediaLifecycleClientLike {
  rpc(
    functionName: "manage_venue_private_media",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function isConflictError(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  return (value as Record<string, unknown>).code === "23505";
}

function reservationArgs(
  input: ReserveVenuePrivateOriginalInput,
): Readonly<Record<string, unknown>> {
  return {
    target_action: "reserve_original",
    target_operation_id: input.operationId,
    target_project_id: input.projectId,
    target_media_id: input.mediaId,
    target_venue_id: input.venueId,
    target_link_id: input.linkId,
    target_category: input.category,
    target_caption: input.caption,
    target_original_filename: input.originalFilename,
    target_mime_type: input.mimeType,
    target_size_bytes: input.sizeBytes,
    target_sha256: input.sha256,
    target_width_px: input.widthPx,
    target_height_px: input.heightPx,
    target_derivative_of_id: null,
    target_derivative_kind: null,
    target_derivative_version: null,
  };
}

function parseReservationReceipt(
  value: unknown,
  input: ReserveVenuePrivateOriginalInput,
): VenuePrivateOriginalReservation {
  try {
    const receipt = value as Record<string, unknown>;
    const media = receipt.media as Record<string, unknown>;
    const link = receipt.link as Record<string, unknown>;
    const storagePath = `${input.projectId}/media/${input.mediaId}/original`;
    const valid = [
      receipt.action === "reserve_original",
      typeof receipt.replayed === "boolean",
      media.id === input.mediaId,
      media.project_id === input.projectId,
      media.media_type === "image",
      media.category === input.category,
      media.storage_path === storagePath,
      media.remote_url === null,
      media.source_page_url === null,
      media.original_filename === input.originalFilename,
      media.mime_type === input.mimeType,
      media.size_bytes === input.sizeBytes,
      media.sha256 === input.sha256,
      media.width_px === input.widthPx,
      media.height_px === input.heightPx,
      media.derivative_of_id === null,
      media.is_original === true,
      media.upload_status === "pending",
      media.caption === input.caption,
      media.derivative_kind === null,
      media.derivative_version === null,
      link.id === input.linkId,
      link.project_id === input.projectId,
      link.media_id === input.mediaId,
      link.target_type === "venue",
      link.target_id === input.venueId,
      link.relationship_type === "gallery",
    ].every(Boolean);
    if (!valid) throw new Error("invalid receipt");
    return { storagePath, replayed: receipt.replayed as boolean };
  } catch {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid Venue private media reservation response.",
    );
  }
}

export class SupabasePrivateMediaLifecycleAdapter
  implements PrivateMediaLifecyclePort
{
  constructor(
    private readonly client: SupabasePrivateMediaLifecycleClientLike,
  ) {}

  async reserveOriginal(
    input: ReserveVenuePrivateOriginalInput,
  ): Promise<VenuePrivateOriginalReservation> {
    let result: SupabaseResult;
    try {
      result = await this.client.rpc(
        "manage_venue_private_media",
        reservationArgs(input),
      );
    } catch {
      throw new MediaPersistenceError(
        "persistence_failed",
        "Venue private media reservation failed.",
      );
    }

    if (result.error !== null) {
      throw new MediaPersistenceError(
        isConflictError(result.error) ? "conflict" : "persistence_failed",
        "Venue private media reservation failed.",
      );
    }

    return parseReservationReceipt(result.data, input);
  }
}

import { MediaPersistenceError } from "@application/documents/media-persistence-error";
import type {
  FinalizeVenuePrivateOriginalInput,
  VenuePrivateOriginalFinalization,
} from "@application/documents/private-media-lifecycle-port";
import { isMediaUuid } from "@domain/documents/venue-remote-media";

function duplicateOriginalMediaIds(
  value: unknown,
  currentMediaId: string,
): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  for (const id of value) {
    if (!isMediaUuid(id) || id === currentMediaId || ids.includes(id)) {
      return null;
    }
    ids.push(id);
  }
  const sortedIds = [...ids].sort();
  return ids.every((id, index) => id === sortedIds[index]) ? ids : null;
}

export function parsePrivateMediaOriginalFinalization(
  value: unknown,
  input: FinalizeVenuePrivateOriginalInput,
): VenuePrivateOriginalFinalization {
  try {
    const receipt = value as Record<string, unknown>;
    const media = receipt.media as Record<string, unknown>;
    const link = receipt.link as Record<string, unknown>;
    const storagePath = `${input.projectId}/media/${input.mediaId}/original`;
    const duplicates = duplicateOriginalMediaIds(
      receipt.duplicateOriginalMediaIds,
      input.mediaId,
    );
    const valid = [
      receipt.action === "finalize_original",
      typeof receipt.replayed === "boolean",
      duplicates !== null,
      media.id === input.mediaId,
      media.project_id === input.projectId,
      media.media_type === "image",
      media.storage_path === storagePath,
      media.remote_url === null,
      media.source_page_url === null,
      media.derivative_of_id === null,
      media.is_original === true,
      media.upload_status === "ready",
      media.derivative_kind === null,
      media.derivative_version === null,
      typeof link.id === "string" && link.id.length > 0,
      link.project_id === input.projectId,
      link.media_id === input.mediaId,
      link.target_type === "venue",
      typeof link.target_id === "string" && link.target_id.length > 0,
      link.relationship_type === "gallery",
    ].every(Boolean);
    if (!valid || duplicates === null) throw new Error("invalid receipt");
    return {
      storagePath,
      replayed: receipt.replayed as boolean,
      duplicateOriginalMediaIds: duplicates,
    };
  } catch {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid Venue private media finalization response.",
    );
  }
}

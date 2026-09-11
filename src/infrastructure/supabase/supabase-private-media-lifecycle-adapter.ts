import { MediaPersistenceError } from "@application/documents/media-persistence-error";
import type {
  AbandonVenuePrivateDerivativeInput,
  AbandonVenuePrivateOriginalInput,
  FinalizeVenuePrivateDerivativeInput,
  FinalizeVenuePrivateOriginalInput,
  PrivateMediaLifecyclePort,
  ReserveVenuePrivateDerivativeInput,
  ReserveVenuePrivateOriginalInput,
  VenuePrivateDerivativeAbandonment,
  VenuePrivateDerivativeFinalization,
  VenuePrivateDerivativeReservation,
  VenuePrivateOriginalAbandonment,
  VenuePrivateOriginalFinalization,
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

function originalStoragePath(projectId: string, mediaId: string): string {
  return `${projectId}/media/${mediaId}/original`;
}

function derivativeStoragePath(
  input: Pick<
    ReserveVenuePrivateDerivativeInput,
    "projectId" | "mediaId" | "derivativeKind" | "derivativeVersion"
  >,
): string {
  return `${input.projectId}/media/${input.mediaId}/${input.derivativeKind}-v${input.derivativeVersion}`;
}

function lifecycleArgs(
  action: string,
  input: { readonly operationId: string; readonly projectId: string; readonly mediaId: string },
): Record<string, unknown> {
  return {
    target_action: action,
    target_operation_id: input.operationId,
    target_project_id: input.projectId,
    target_media_id: input.mediaId,
    target_venue_id: null,
    target_link_id: null,
    target_category: null,
    target_caption: null,
    target_original_filename: null,
    target_mime_type: null,
    target_size_bytes: null,
    target_sha256: null,
    target_width_px: null,
    target_height_px: null,
    target_derivative_of_id: null,
    target_derivative_kind: null,
    target_derivative_version: null,
  };
}

function originalReservationArgs(
  input: ReserveVenuePrivateOriginalInput,
): Readonly<Record<string, unknown>> {
  return {
    ...lifecycleArgs("reserve_original", input),
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
  };
}

function derivativeReservationArgs(
  input: ReserveVenuePrivateDerivativeInput,
): Readonly<Record<string, unknown>> {
  return {
    ...lifecycleArgs("reserve_derivative", input),
    target_mime_type: input.mimeType,
    target_size_bytes: input.sizeBytes,
    target_sha256: input.sha256,
    target_width_px: input.widthPx,
    target_height_px: input.heightPx,
    target_derivative_of_id: input.parentMediaId,
    target_derivative_kind: input.derivativeKind,
    target_derivative_version: input.derivativeVersion,
  };
}

async function callLifecycle(
  client: SupabasePrivateMediaLifecycleClientLike,
  args: Readonly<Record<string, unknown>>,
  message: string,
): Promise<unknown> {
  let result: SupabaseResult;
  try {
    result = await client.rpc("manage_venue_private_media", args);
  } catch {
    throw new MediaPersistenceError("persistence_failed", message);
  }
  if (result.error !== null) {
    throw new MediaPersistenceError(
      isConflictError(result.error) ? "conflict" : "persistence_failed",
      message,
    );
  }
  return result.data;
}

function parseOriginalReservation(
  value: unknown,
  input: ReserveVenuePrivateOriginalInput,
): VenuePrivateOriginalReservation {
  try {
    const receipt = value as Record<string, unknown>;
    const media = receipt.media as Record<string, unknown>;
    const link = receipt.link as Record<string, unknown>;
    const storagePath = originalStoragePath(input.projectId, input.mediaId);
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

function parseDerivativeReservation(
  value: unknown,
  input: ReserveVenuePrivateDerivativeInput,
): VenuePrivateDerivativeReservation {
  try {
    const receipt = value as Record<string, unknown>;
    const media = receipt.media as Record<string, unknown>;
    const storagePath = derivativeStoragePath(input);
    const valid = [
      receipt.action === "reserve_derivative",
      typeof receipt.replayed === "boolean",
      media.id === input.mediaId,
      media.project_id === input.projectId,
      media.media_type === "image",
      media.category === null,
      media.storage_path === storagePath,
      media.remote_url === null,
      media.source_page_url === null,
      media.original_filename === null,
      media.mime_type === input.mimeType,
      media.size_bytes === input.sizeBytes,
      media.sha256 === input.sha256,
      media.width_px === input.widthPx,
      media.height_px === input.heightPx,
      media.derivative_of_id === input.parentMediaId,
      media.is_original === false,
      media.upload_status === "pending",
      media.caption === null,
      media.derivative_kind === input.derivativeKind,
      media.derivative_version === input.derivativeVersion,
    ].every(Boolean);
    if (!valid) throw new Error("invalid receipt");
    return { storagePath, replayed: receipt.replayed as boolean };
  } catch {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid Venue private derivative reservation response.",
    );
  }
}

function parseOriginalFinalization(
  value: unknown,
  input: FinalizeVenuePrivateOriginalInput,
): VenuePrivateOriginalFinalization {
  try {
    const receipt = value as Record<string, unknown>;
    const media = receipt.media as Record<string, unknown>;
    const link = receipt.link as Record<string, unknown>;
    const storagePath = originalStoragePath(input.projectId, input.mediaId);
    const valid = [
      receipt.action === "finalize_original",
      typeof receipt.replayed === "boolean",
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
    if (!valid) throw new Error("invalid receipt");
    return { storagePath, replayed: receipt.replayed as boolean };
  } catch {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid Venue private media finalization response.",
    );
  }
}

function parseDerivativeFinalization(
  value: unknown,
  input: FinalizeVenuePrivateDerivativeInput,
): VenuePrivateDerivativeFinalization {
  try {
    const receipt = value as Record<string, unknown>;
    const media = receipt.media as Record<string, unknown>;
    const storagePath = derivativeStoragePath(input);
    const valid = [
      receipt.action === "finalize_derivative",
      typeof receipt.replayed === "boolean",
      media.id === input.mediaId,
      media.project_id === input.projectId,
      media.media_type === "image",
      media.category === null,
      media.storage_path === storagePath,
      media.remote_url === null,
      media.source_page_url === null,
      media.original_filename === null,
      media.derivative_of_id === input.parentMediaId,
      media.is_original === false,
      media.upload_status === "ready",
      media.caption === null,
      media.derivative_kind === input.derivativeKind,
      media.derivative_version === input.derivativeVersion,
    ].every(Boolean);
    if (!valid) throw new Error("invalid receipt");
    return { storagePath, replayed: receipt.replayed as boolean };
  } catch {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid Venue private derivative finalization response.",
    );
  }
}

function parseOriginalAbandonment(
  value: unknown,
  input: AbandonVenuePrivateOriginalInput,
): VenuePrivateOriginalAbandonment {
  try {
    const receipt = value as Record<string, unknown>;
    const valid = [
      receipt.action === "abandon_original",
      typeof receipt.replayed === "boolean",
      receipt.projectId === input.projectId,
      receipt.mediaId === input.mediaId,
      receipt.linkId === input.linkId,
      receipt.absent === true,
    ].every(Boolean);
    if (!valid) throw new Error("invalid receipt");
    return { replayed: receipt.replayed as boolean, absent: true };
  } catch {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid Venue private media abandonment response.",
    );
  }
}

function parseDerivativeAbandonment(
  value: unknown,
  input: AbandonVenuePrivateDerivativeInput,
): VenuePrivateDerivativeAbandonment {
  try {
    const receipt = value as Record<string, unknown>;
    const valid = [
      receipt.action === "abandon_derivative",
      typeof receipt.replayed === "boolean",
      receipt.projectId === input.projectId,
      receipt.mediaId === input.mediaId,
      receipt.linkId === null,
      receipt.absent === true,
    ].every(Boolean);
    if (!valid) throw new Error("invalid receipt");
    return { replayed: receipt.replayed as boolean, absent: true };
  } catch {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid Venue private derivative abandonment response.",
    );
  }
}

export class SupabasePrivateMediaLifecycleAdapter implements PrivateMediaLifecyclePort {
  constructor(
    private readonly client: SupabasePrivateMediaLifecycleClientLike,
  ) {}

  async reserveOriginal(
    input: ReserveVenuePrivateOriginalInput,
  ): Promise<VenuePrivateOriginalReservation> {
    const data = await callLifecycle(
      this.client,
      originalReservationArgs(input),
      "Venue private media reservation failed.",
    );
    return parseOriginalReservation(data, input);
  }

  async finalizeOriginal(
    input: FinalizeVenuePrivateOriginalInput,
  ): Promise<VenuePrivateOriginalFinalization> {
    const data = await callLifecycle(
      this.client,
      lifecycleArgs("finalize_original", input),
      "Venue private media finalization failed.",
    );
    return parseOriginalFinalization(data, input);
  }

  async abandonOriginal(
    input: AbandonVenuePrivateOriginalInput,
  ): Promise<VenuePrivateOriginalAbandonment> {
    const data = await callLifecycle(
      this.client,
      {
        ...lifecycleArgs("abandon_original", input),
        target_venue_id: input.venueId,
        target_link_id: input.linkId,
      },
      "Venue private media abandonment failed.",
    );
    return parseOriginalAbandonment(data, input);
  }

  async reserveDerivative(
    input: ReserveVenuePrivateDerivativeInput,
  ): Promise<VenuePrivateDerivativeReservation> {
    const data = await callLifecycle(
      this.client,
      derivativeReservationArgs(input),
      "Venue private derivative reservation failed.",
    );
    return parseDerivativeReservation(data, input);
  }

  async finalizeDerivative(
    input: FinalizeVenuePrivateDerivativeInput,
  ): Promise<VenuePrivateDerivativeFinalization> {
    const data = await callLifecycle(
      this.client,
      lifecycleArgs("finalize_derivative", input),
      "Venue private derivative finalization failed.",
    );
    return parseDerivativeFinalization(data, input);
  }

  async abandonDerivative(
    input: AbandonVenuePrivateDerivativeInput,
  ): Promise<VenuePrivateDerivativeAbandonment> {
    const data = await callLifecycle(
      this.client,
      lifecycleArgs("abandon_derivative", input),
      "Venue private derivative abandonment failed.",
    );
    return parseDerivativeAbandonment(data, input);
  }
}

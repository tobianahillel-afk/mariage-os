import type {
  MediaPort,
  NormalizedCreateVenueRemoteMediaInput,
} from "@application/documents/media-service";
import { MediaPersistenceError } from "@application/documents/media-persistence-error";
import {
  venueRemoteMediaCallerPayloadEquals,
  type VenueRemoteMediaBundle,
} from "@domain/documents/venue-remote-media";
import {
  parseVenueRemoteMediaListRow,
  parseVenueRemoteMediaReceipt,
} from "./parse-venue-remote-media-receipt";

const MEDIA_COLUMNS =
  "id,project_id,media_type,category,storage_path,remote_url,source_page_url,original_filename,mime_type,size_bytes,sha256,width_px,height_px,derivative_of_id,is_original,upload_status,caption,created_at,created_by,updated_at,updated_by,revision";
const LINK_COLUMNS =
  `id,project_id,media_id,target_type,target_id,relationship_type,created_at,created_by,media(${MEDIA_COLUMNS})`;

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface FilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): FilterBuilder;
  order(
    column: string,
    options: Readonly<{ ascending: boolean }>,
  ): FilterBuilder;
}

interface MediaTable {
  select(columns: string): FilterBuilder;
}

export interface SupabaseMediaClientLike {
  from(table: "media_links"): MediaTable;
  rpc(
    functionName: "create_venue_remote_media",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function providerErrorCode(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function expectedCreatePayload(
  bundle: VenueRemoteMediaBundle,
  input: NormalizedCreateVenueRemoteMediaInput,
): VenueRemoteMediaBundle {
  if (
    !venueRemoteMediaCallerPayloadEquals(bundle, {
      projectId: input.projectId,
      venueId: input.venueId,
      mediaId: input.mediaId,
      linkId: input.linkId,
      category: input.category,
      remoteUrl: input.remoteUrl,
      sourcePageUrl: input.sourcePageUrl,
      caption: input.caption,
    })
  ) {
    throw new MediaPersistenceError(
      "provider_response_invalid",
      "Invalid venue remote media response.",
    );
  }
  return bundle;
}

function uniqueBundles(
  bundles: readonly VenueRemoteMediaBundle[],
): readonly VenueRemoteMediaBundle[] {
  const mediaIds = new Set<string>();
  const linkIds = new Set<string>();
  for (const bundle of bundles) {
    if (mediaIds.has(bundle.media.id) || linkIds.has(bundle.link.id)) {
      throw new MediaPersistenceError(
        "provider_response_invalid",
        "Invalid venue remote media response.",
      );
    }
    mediaIds.add(bundle.media.id);
    linkIds.add(bundle.link.id);
  }
  return bundles;
}

export class SupabaseMediaAdapter implements MediaPort {
  constructor(private readonly client: SupabaseMediaClientLike) {}

  async createVenueRemoteMedia(
    input: NormalizedCreateVenueRemoteMediaInput,
  ): Promise<VenueRemoteMediaBundle> {
    const { data, error } = await this.client.rpc("create_venue_remote_media", {
      target_project_id: input.projectId,
      target_venue_id: input.venueId,
      target_media_id: input.mediaId,
      target_link_id: input.linkId,
      target_category: input.category,
      target_remote_url: input.remoteUrl,
      target_source_page_url: input.sourcePageUrl,
      target_caption: input.caption,
    });
    if (error !== null) {
      throw new MediaPersistenceError(
        providerErrorCode(error) === "23505"
          ? "conflict"
          : "persistence_failed",
        "Venue remote media creation failed.",
      );
    }

    let bundle: VenueRemoteMediaBundle;
    try {
      bundle = parseVenueRemoteMediaReceipt(
        data,
        input.projectId,
        input.venueId,
        input.mediaId,
        input.linkId,
      );
    } catch {
      throw new MediaPersistenceError(
        "provider_response_invalid",
        "Invalid venue remote media response.",
      );
    }
    return expectedCreatePayload(bundle, input);
  }

  async listVenueRemoteMedia(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueRemoteMediaBundle[]> {
    const { data, error } = await this.client
      .from("media_links")
      .select(LINK_COLUMNS)
      .eq("project_id", projectId)
      .eq("target_type", "venue")
      .eq("target_id", venueId)
      .eq("relationship_type", "gallery")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (error !== null || !Array.isArray(data)) {
      throw new MediaPersistenceError(
        "persistence_failed",
        "Venue remote media query failed.",
      );
    }
    try {
      return uniqueBundles(
        data.map((row) => parseVenueRemoteMediaListRow(row, projectId, venueId)),
      );
    } catch (errorValue) {
      if (errorValue instanceof MediaPersistenceError) throw errorValue;
      throw new MediaPersistenceError(
        "provider_response_invalid",
        "Invalid venue remote media response.",
      );
    }
  }
}

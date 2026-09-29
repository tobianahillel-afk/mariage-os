import type {
  CreatedVenue,
  VenueCommandPort,
  VenueQuickAddInput,
} from "@application/venues/venue-command-port";
import type { VenueCoreRecord } from "@application/venues/venue-repository-port";
import {
  normalizeVenueQuickAdd,
  type VenueQuickAddDraft,
  type VenueQuickAddError,
} from "@domain/venues/venue-quick-add";

export interface VenueQuickAddCachePort {
  cacheCloudVenue(venue: VenueCoreRecord): Promise<void>;
}

export type QuickAddVenueResult =
  | {
      readonly ok: true;
      readonly venue: CreatedVenue;
      readonly localCache: "synced" | "unavailable";
    }
  | {
      readonly ok: false;
      readonly error: VenueQuickAddError | "persistence_failed";
    };

function confirmedVenue(
  venue: CreatedVenue,
  input: VenueQuickAddInput,
): VenueCoreRecord {
  return {
    id: venue.id,
    projectId: venue.projectId,
    name: input.name,
    code: input.code,
    websiteUrl: input.websiteUrl,
    city: input.city,
    status: venue.status,
    rejectionReason: null,
    revision: venue.revision,
  };
}

async function cacheConfirmedVenue(
  cache: VenueQuickAddCachePort,
  venue: VenueCoreRecord,
): Promise<"synced" | "unavailable"> {
  try {
    await cache.cacheCloudVenue(venue);
    return "synced";
  } catch {
    return "unavailable";
  }
}

export async function quickAddVenue(
  port: VenueCommandPort,
  projectId: string,
  draft: VenueQuickAddDraft,
  cache: VenueQuickAddCachePort,
): Promise<QuickAddVenueResult> {
  const normalized = normalizeVenueQuickAdd(draft);
  if (!normalized.ok) return normalized;

  const input = { projectId, ...normalized.value };
  let venue: CreatedVenue;
  try {
    venue = await port.createVenue(input);
  } catch {
    return { ok: false, error: "persistence_failed" };
  }

  const localCache = await cacheConfirmedVenue(
    cache,
    confirmedVenue(venue, input),
  );
  return { ok: true, venue, localCache };
}

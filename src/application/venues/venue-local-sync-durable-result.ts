import type { LocalProjectStore } from "@application/local-data/local-project-store";
import type { PendingMutationEnvelope } from "@application/local-data/local-records";
import {
  venueFromCachedRecord,
  VENUE_CACHE_RECORD_TYPE,
} from "@application/venues/venue-local-cache";
import type { VenueCoreRecord } from "@application/venues/venue-repository-port";

type DurableResultState = "synced" | "pending" | "conflict" | "failed_permanent";

export interface DurableVenueResult {
  readonly state: DurableResultState;
  readonly venue: VenueCoreRecord | null;
}

export async function currentDurableVenueResult(
  local: LocalProjectStore,
  venueId: string,
): Promise<DurableVenueResult> {
  try {
    const record = await local.getCachedRecord(
      VENUE_CACHE_RECORD_TYPE,
      venueId,
    );
    if (record === null) return { state: "pending", venue: null };
    return {
      state: record.syncMarker,
      venue: venueFromCachedRecord(record),
    };
  } catch {
    return { state: "pending", venue: null };
  }
}

export async function failureResult(
  local: LocalProjectStore,
  operationId: string,
  venueId: string,
  failure: "conflict" | "pending" | "failed_permanent",
): Promise<DurableVenueResult> {
  let mutations: readonly PendingMutationEnvelope[];
  try {
    mutations = await local.listPendingMutations();
  } catch {
    return { state: "pending", venue: null };
  }
  const current = await currentDurableVenueResult(local, venueId);
  if (current.venue === null) return current;
  const hasOtherTarget = mutations.some(
    (mutation) =>
      mutation.operationId !== operationId &&
      mutation.entityType === "venue" &&
      mutation.entityId === venueId,
  );
  if (hasOtherTarget) {
    return {
      state: current.state === "conflict" ? "conflict" : "pending",
      venue: current.venue,
    };
  }
  return { state: failure, venue: current.venue };
}

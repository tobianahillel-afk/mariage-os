import { expect, it } from "vitest";

import type {
  LocalProjectMetadata,
  LocalProjectStore,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type CachedRecordEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";
import { VenueLocalSyncCoordinator } from "@application/venues/venue-local-sync-coordinator";
import { venueCachedRecord } from "@application/venues/venue-local-cache";
import type { VenueCommandPort } from "@application/venues/venue-command-port";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "@application/venues/venue-repository-port";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const venueId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";

const venue: VenueCoreRecord = {
  id: venueId,
  projectId: scope.projectId,
  code: null,
  name: "Venue Alpha",
  status: "research",
  rejectionReason: null,
  websiteUrl: null,
  city: "Paris",
  revision: 1,
};

class RefreshRaceStore implements LocalProjectStore {
  readonly scope = scope;
  readonly cached = new Map<string, CachedRecordEnvelope>();
  readonly pending = new Map<string, PendingMutationEnvelope>();
  beforeRefreshDecision: (() => Promise<void>) | null = null;

  async putCachedRecord(record: CachedRecordEnvelope): Promise<void> {
    this.cached.set(record.key, record);
  }

  async putCachedRecordIfRefreshSafe(
    record: CachedRecordEnvelope,
  ): Promise<boolean> {
    const hook = this.beforeRefreshDecision;
    this.beforeRefreshDecision = null;
    if (hook !== null) await hook();
    const existing = this.cached.get(record.key);
    const blockedByMarker =
      existing?.syncMarker === "pending" || existing?.syncMarker === "conflict";
    const blockedByQueue = [...this.pending.values()].some(
      (mutation) =>
        mutation.entityType === record.recordType &&
        mutation.entityId === record.entityId,
    );
    if (blockedByMarker || blockedByQueue) return false;
    this.cached.set(record.key, record);
    return true;
  }

  async addPendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    this.pending.set(mutation.operationId, mutation);
    this.cached.set(record.key, record);
  }

  async getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null> {
    return this.cached.get(`${recordType}:${entityId}`) ?? null;
  }

  async listCachedRecords(): Promise<readonly CachedRecordEnvelope[]> {
    return [...this.cached.values()];
  }

  async getMetadata(): Promise<LocalProjectMetadata> {
    throw new Error("not used");
  }
  async addPendingMutation(): Promise<void> {
    throw new Error("not used");
  }
  async putPendingMutation(): Promise<void> {
    throw new Error("not used");
  }
  async settlePendingMutationWithCachedRecord(
    _mutation: PendingMutationEnvelope,
    _record: CachedRecordEnvelope,
  ): Promise<void> {
    throw new Error("not used");
  }
  async removePendingMutation(): Promise<void> {
    throw new Error("not used");
  }
  async getPendingMutation(): Promise<PendingMutationEnvelope | null> {
    throw new Error("not used");
  }
  async listPendingMutations(): Promise<readonly PendingMutationEnvelope[]> {
    return [...this.pending.values()];
  }
  async readSyncCounters(): Promise<LocalSyncCounters> {
    throw new Error("not used");
  }
  close(): void {}
}

function commands(): VenueCommandPort {
  return {
    createVenue: async () => {
      throw new Error("not used");
    },
    transitionVenue: async () => {
      throw new Error("not used");
    },
  };
}

function repositoryWith(remote: VenueCoreRecord): VenueRepositoryPort {
  return {
    listVenues: async () => [remote],
    getVenue: async () => remote,
    updateVenueCore: async () => {
      throw new Error("not used");
    },
  };
}

function coordinatorFor(
  local: LocalProjectStore,
  remote: VenueCoreRecord,
): VenueLocalSyncCoordinator {
  return new VenueLocalSyncCoordinator({
    local,
    repository: repositoryWith(remote),
    commands: commands(),
    now: () => "2026-09-30T15:30:00.000Z",
  });
}

it("does not overwrite a Venue mutation that becomes pending during refresh", async () => {
  const local = new RefreshRaceStore();
  await local.putCachedRecord(venueCachedRecord(scope, venue, "synced"));
  const localWorking = { ...venue, name: "Concurrent Local", city: "Nice" };
  local.beforeRefreshDecision = async () => {
    await local.addPendingMutationWithCachedRecord(
      createPendingMutationEnvelope(scope, {
        operationId,
        entityType: "venue",
        entityId: venueId,
        mutationType: "update_venue_core",
        baseRevision: "1",
        payload: {
          name: localWorking.name,
          code: localWorking.code,
          websiteUrl: localWorking.websiteUrl,
          city: localWorking.city,
        },
        createdAt: "2026-09-30T15:30:00.000Z",
        priorityClass: "essential_structured",
      }),
      venueCachedRecord(scope, localWorking, "pending"),
    );
  };
  await coordinatorFor(local, {
    ...venue,
    name: "Remote New",
    revision: 2,
  }).refreshFromCloud();

  expect(local.pending.get(operationId)).not.toBeUndefined();
  expect(local.cached.get(`venue:${venueId}`)).toEqual(
    venueCachedRecord(scope, localWorking, "pending"),
  );
});

it("preserves a pending working Venue during ordinary refresh", async () => {
  const local = new RefreshRaceStore();
  const working = { ...venue, name: "Pending Local" };
  await local.putCachedRecord(venueCachedRecord(scope, working, "pending"));

  const refreshed = await coordinatorFor(local, {
    ...venue,
    name: "Remote Older",
  }).refreshFromCloud();

  expect(refreshed).toHaveLength(1);
  expect(refreshed[0]?.name).toBe("Pending Local");
  expect(local.cached.get(`venue:${venueId}`)?.syncMarker).toBe("pending");
});

it("refreshes a synchronized working Venue from cloud", async () => {
  const local = new RefreshRaceStore();
  await local.putCachedRecord(venueCachedRecord(scope, venue, "synced"));

  await coordinatorFor(local, {
    ...venue,
    name: "Remote New",
    revision: 2,
  }).refreshFromCloud();

  expect(local.cached.get(`venue:${venueId}`)).toEqual(
    venueCachedRecord(
      scope,
      { ...venue, name: "Remote New", revision: 2 },
      "synced",
    ),
  );
});

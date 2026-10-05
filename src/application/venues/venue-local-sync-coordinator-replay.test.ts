import { describe, expect, it } from "vitest";
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
import type {
  VenueCommandPort,
  VenueTransitionInput,
} from "@application/venues/venue-command-port";
import { VenueLocalSyncCoordinator } from "@application/venues/venue-local-sync-coordinator";
import {
  venueCachedRecord,
  venueFromCachedRecord,
} from "@application/venues/venue-local-cache";
import type {
  VenueCoreRecord,
  VenueCoreUpdateInput,
  VenueRepositoryPort,
} from "@application/venues/venue-repository-port";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const venueId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";
const now = "2026-09-29T17:30:00.000Z";

const venue: VenueCoreRecord = {
  id: venueId,
  projectId: scope.projectId,
  code: "P2",
  name: "Venue Alpha",
  status: "research",
  rejectionReason: null,
  websiteUrl: null,
  city: "Paris",
  revision: 1,
};

class MemoryLocalStore implements LocalProjectStore {
  readonly scope = scope;
  readonly cached = new Map<string, CachedRecordEnvelope>();
  readonly pending = new Map<string, PendingMutationEnvelope>();

  async getMetadata(): Promise<LocalProjectMetadata> {
    return {
      key: "scope",
      localSchemaVersion: 1,
      appVersionLastOpened: "test",
      projectId: scope.projectId,
      userId: scope.userId,
      deviceId: scope.deviceId,
      lastSuccessfulSyncAt: null,
      backendSchemaVersionLastSeen: null,
      serviceWorkerBuildLastSeen: null,
    };
  }

  async putCachedRecord(record: CachedRecordEnvelope): Promise<void> {
    this.cached.set(record.key, record);
  }

  async putCachedRecordIfRefreshSafe(
    record: CachedRecordEnvelope,
  ): Promise<boolean> {
    const existing = this.cached.get(record.key);
    if (
      existing?.syncMarker === "pending" ||
      existing?.syncMarker === "conflict"
    ) {
      return false;
    }
    const hasPendingTarget = [...this.pending.values()].some(
      (mutation) =>
        mutation.entityType === record.recordType &&
        mutation.entityId === record.entityId,
    );
    if (hasPendingTarget) return false;
    this.cached.set(record.key, record);
    return true;
  }

  async getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null> {
    return this.cached.get(`${recordType}:${entityId}`) ?? null;
  }

  async listCachedRecords(
    recordType: string,
  ): Promise<readonly CachedRecordEnvelope[]> {
    return [...this.cached.values()].filter(
      (record) => record.recordType === recordType,
    );
  }

  async addPendingMutation(mutation: PendingMutationEnvelope): Promise<void> {
    if (this.pending.has(mutation.operationId)) throw new Error("duplicate");
    this.pending.set(mutation.operationId, mutation);
  }

  async addPendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    await this.addPendingMutation(mutation);
    this.cached.set(record.key, record);
  }

  async putPendingMutation(
    mutation: PendingMutationEnvelope,
    record?: CachedRecordEnvelope,
  ): Promise<void> {
    this.pending.set(mutation.operationId, mutation);
    if (record !== undefined) this.cached.set(record.key, record);
  }

  async settlePendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    if (!this.pending.has(mutation.operationId)) throw new Error("missing");
    this.cached.set(record.key, record);
    this.pending.delete(mutation.operationId);
  }

  async removePendingMutation(id: string): Promise<void> {
    this.pending.delete(id);
  }

  async getPendingMutation(
    id: string,
  ): Promise<PendingMutationEnvelope | null> {
    return this.pending.get(id) ?? null;
  }

  async listPendingMutations(): Promise<readonly PendingMutationEnvelope[]> {
    return [...this.pending.values()];
  }

  async readSyncCounters(): Promise<LocalSyncCounters> {
    return {
      pendingCount: 0,
      conflictCount: 0,
      retryableFailureCount: 0,
      permanentFailureCount: 0,
      unsyncedBinaryCount: 0,
    };
  }

  close(): void {}
}

class RemoteHarness {
  updateCalls: VenueCoreUpdateInput[] = [];
  transitionCalls: VenueTransitionInput[] = [];

  readonly repository: VenueRepositoryPort = {
    listVenues: async () => [venue],
    getVenue: async () => venue,
    updateVenueCore: async (input) => {
      this.updateCalls.push(input);
      return { ...venue, revision: input.expectedRevision + 1 };
    },
  };

  readonly commands: VenueCommandPort = {
    createVenue: async () => {
      throw new Error("not used");
    },
    transitionVenue: async (input) => {
      this.transitionCalls.push(input);
      return input.expectedRevision + 1;
    },
  };
}

async function seededHarness() {
  const local = new MemoryLocalStore();
  await local.putCachedRecord(venueCachedRecord(scope, venue, "synced"));
  const remote = new RemoteHarness();
  const coordinator = coordinatorFor(local, remote);
  return { local, remote, coordinator };
}

function coordinatorFor(
  local: MemoryLocalStore,
  remote: RemoteHarness,
): VenueLocalSyncCoordinator {
  return new VenueLocalSyncCoordinator({
    local,
    repository: remote.repository,
    commands: remote.commands,
    now: () => now,
  });
}

async function cachedVenue(local: MemoryLocalStore): Promise<VenueCoreRecord> {
  const record = await local.getCachedRecord("venue", venueId);
  if (record === null) throw new Error("missing cached venue fixture");
  return venueFromCachedRecord(record);
}

describe("VenueLocalSyncCoordinator replay ordering", () => {
  it("replays older local Venue intent before a newer intent", async () => {
    const { local, remote } = await seededHarness();
    const laterOperationId = "10000000-0000-4000-8000-000000000001";
    const earlierOperationId = "f0000000-0000-4000-8000-000000000001";

    await local.addPendingMutation(
      createPendingMutationEnvelope(scope, {
        operationId: laterOperationId,
        entityType: "venue",
        entityId: venueId,
        mutationType: "update_venue_core",
        baseRevision: "1",
        payload: {
          name: "Later Intent",
          code: null,
          websiteUrl: null,
          city: "Paris",
        },
        createdAt: "2026-09-29T17:31:00.000Z",
        priorityClass: "essential_structured",
      }),
    );
    await local.addPendingMutation(
      createPendingMutationEnvelope(scope, {
        operationId: earlierOperationId,
        entityType: "venue",
        entityId: venueId,
        mutationType: "update_venue_core",
        baseRevision: "1",
        payload: {
          name: "Earlier Intent",
          code: null,
          websiteUrl: null,
          city: "Paris",
        },
        createdAt: "2026-09-29T17:30:00.000Z",
        priorityClass: "essential_structured",
      }),
    );

    const results = await coordinatorFor(local, remote).replayPending();

    expect(results).toHaveLength(2);
    expect(remote.updateCalls.map((call) => call.operationId)).toEqual([
      earlierOperationId,
      laterOperationId,
    ]);
  });
});

describe("VenueLocalSyncCoordinator replay tie-break", () => {
  it("uses operation id only when queued intents share the same timestamp", async () => {
    const { local, remote } = await seededHarness();
    const firstOperationId = "10000000-0000-4000-8000-000000000001";
    const secondOperationId = "f0000000-0000-4000-8000-000000000001";

    for (const [id, name] of [
      [secondOperationId, "Second by id"],
      [firstOperationId, "First by id"],
    ] as const) {
      await local.addPendingMutation(
        createPendingMutationEnvelope(scope, {
          operationId: id,
          entityType: "venue",
          entityId: venueId,
          mutationType: "update_venue_core",
          baseRevision: "1",
          payload: {
            name,
            code: null,
            websiteUrl: null,
            city: "Paris",
          },
          createdAt: "2026-09-29T17:30:00.000Z",
          priorityClass: "essential_structured",
        }),
      );
    }

    await coordinatorFor(local, remote).replayPending();

    expect(remote.updateCalls.map((call) => call.operationId)).toEqual([
      firstOperationId,
      secondOperationId,
    ]);
  });
});

describe("VenueLocalSyncCoordinator corrupt replay", () => {
  it("retains an invalid queued Venue command without sending it", async () => {
    const { local, remote } = await seededHarness();
    local.pending.set(operationId, {
      operationId,
      projectId: scope.projectId,
      userId: scope.userId,
      deviceId: scope.deviceId,
      entityType: "venue",
      entityId: venueId,
      mutationType: "unknown_command",
      baseRevision: "1",
      payload: {},
      createdAt: now,
      attemptCount: 0,
      lastAttemptAt: null,
      status: "pending",
      lastErrorCode: null,
      priorityClass: "essential_structured",
    });

    const results = await coordinatorFor(local, remote).replayPending();

    expect(results).toEqual([{ state: "failed_permanent", venue: null }]);
    expect(remote.updateCalls).toHaveLength(0);
    expect(remote.transitionCalls).toHaveLength(0);
    expect(local.pending.get(operationId)).toMatchObject({
      status: "failed_permanent",
      lastErrorCode: "invalid_local_mutation",
    });
  });
});

describe("VenueLocalSyncCoordinator cloud cache", () => {
  it("caches an acknowledged cloud Venue as synchronized", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    await coordinatorFor(local, remote).cacheCloudVenue({
      ...venue,
      revision: 2,
    });

    expect(await cachedVenue(local)).toMatchObject({ revision: 2 });
    expect(local.cached.get(`venue:${venueId}`)?.syncMarker).toBe("synced");
  });
});

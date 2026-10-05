import { describe, expect, it } from "vitest";
import type {
  LocalProjectMetadata,
  LocalProjectStore,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
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
import { VenueMutationPersistenceError } from "@application/venues/venue-mutation-persistence-error";
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
  failNextAdd = false;
  failNextCachePut = false;
  failNextSettlement = false;

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
    if (this.failNextCachePut) {
      this.failNextCachePut = false;
      throw new Error("synthetic local failure");
    }
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
    await this.putCachedRecord(record);
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
    if (this.failNextAdd) {
      this.failNextAdd = false;
      throw new Error("synthetic local failure");
    }
    if (this.pending.has(mutation.operationId)) {
      throw new Error("duplicate mutation");
    }
    this.pending.set(mutation.operationId, mutation);
  }

  async addPendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    if (this.failNextAdd) {
      this.failNextAdd = false;
      throw new Error("synthetic local failure");
    }
    if (this.pending.has(mutation.operationId)) {
      throw new Error("duplicate mutation");
    }
    if (this.failNextCachePut) {
      this.failNextCachePut = false;
      throw new Error("synthetic local failure");
    }
    this.pending.set(mutation.operationId, mutation);
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
    const operationIdToSettle = mutation.operationId;
    if (this.failNextSettlement) {
      this.failNextSettlement = false;
      throw new Error("synthetic settlement failure");
    }
    if (!this.pending.has(operationIdToSettle)) {
      throw new Error("missing mutation");
    }
    this.cached.set(record.key, record);
    this.pending.delete(operationIdToSettle);
  }

  async removePendingMutation(operationIdToRemove: string): Promise<void> {
    this.pending.delete(operationIdToRemove);
  }

  async getPendingMutation(
    operationIdToRead: string,
  ): Promise<PendingMutationEnvelope | null> {
    return this.pending.get(operationIdToRead) ?? null;
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
  updateError: unknown = null;
  transitionError: unknown = null;
  remoteVenue: VenueCoreRecord = venue;

  readonly repository: VenueRepositoryPort = {
    listVenues: async () => [this.remoteVenue],
    getVenue: async () => this.remoteVenue,
    updateVenueCore: async (input) => {
      this.updateCalls.push(input);
      if (this.updateError !== null) throw this.updateError;
      return {
        ...this.remoteVenue,
        name: input.name,
        code: input.code,
        websiteUrl: input.websiteUrl,
        city: input.city,
        revision: input.expectedRevision + 1,
      };
    },
  };

  readonly commands: VenueCommandPort = {
    createVenue: async () => {
      throw new Error("not used");
    },
    transitionVenue: async (input) => {
      this.transitionCalls.push(input);
      if (this.transitionError !== null) throw this.transitionError;
      return input.expectedRevision + 1;
    },
  };
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

async function seededHarness() {
  const local = new MemoryLocalStore();
  await local.putCachedRecord(venueCachedRecord(scope, venue, "synced"));
  const remote = new RemoteHarness();
  return { local, remote, coordinator: coordinatorFor(local, remote) };
}

function updateInput(): VenueCoreUpdateInput {
  return {
    projectId: scope.projectId,
    venueId,
    expectedRevision: 1,
    name: "Venue Local",
    code: "P3",
    websiteUrl: null,
    city: "Lyon",
    operationId,
    deviceId: scope.deviceId,
  };
}

async function cachedVenue(local: MemoryLocalStore): Promise<VenueCoreRecord> {
  const record = await local.getCachedRecord("venue", venueId);
  if (record === null) throw new Error("missing cached venue fixture");
  return venueFromCachedRecord(record);
}

describe("VenueLocalSyncCoordinator acknowledgement", () => {
  it("persists locally before remote ack then settles queue and revision", async () => {
    const { local, remote, coordinator } = await seededHarness();
    const result = await coordinator.updateCore(updateInput());

    expect(result).toEqual({
      state: "synced",
      venue: expect.objectContaining({ name: "Venue Local", revision: 2 }),
    });
    expect(remote.updateCalls).toHaveLength(1);
    expect(remote.updateCalls[0]?.operationId).toBe(operationId);
    expect(local.pending.size).toBe(0);
    expect(await cachedVenue(local)).toMatchObject({
      name: "Venue Local",
      revision: 2,
    });
    expect(local.cached.get(`venue:${venueId}`)?.syncMarker).toBe("synced");
  });

  it("retains replayable work if atomic local acknowledgement settlement fails", async () => {
    const { local, remote, coordinator } = await seededHarness();
    local.failNextSettlement = true;

    const result = await coordinator.updateCore(updateInput());

    expect(result.state).toBe("pending");
    expect(result.venue).toMatchObject({ name: "Venue Local", revision: 1 });
    expect(remote.updateCalls).toHaveLength(1);
    expect(local.pending.get(operationId)).toMatchObject({
      status: "sending",
      lastErrorCode: null,
    });
    expect(local.cached.get(`venue:${venueId}`)?.syncMarker).toBe("pending");
    expect(await cachedVenue(local)).toMatchObject({
      name: "Venue Local",
      revision: 1,
    });

    const replayed = await coordinator.replayPending();
    expect(replayed).toHaveLength(1);
    expect(replayed[0]?.state).toBe("synced");
    expect(remote.updateCalls).toHaveLength(2);
    expect(local.pending.size).toBe(0);
    expect(await cachedVenue(local)).toMatchObject({ revision: 2 });
  });

  it("applies a lifecycle acknowledgement with the same operation id", async () => {
    const { local, remote, coordinator } = await seededHarness();
    const result = await coordinator.transitionStatus({
      projectId: scope.projectId,
      venueId,
      status: "shortlist",
      rejectionReason: null,
      expectedRevision: 1,
      operationId,
      deviceId: scope.deviceId,
    });

    expect(result.state).toBe("synced");
    expect(remote.transitionCalls[0]?.operationId).toBe(operationId);
    expect(await cachedVenue(local)).toMatchObject({
      status: "shortlist",
      revision: 2,
    });
    expect(local.pending.size).toBe(0);
  });
});

describe("VenueLocalSyncCoordinator retained work", () => {
  it("retains retryable work and stable operation identity", async () => {
    const { local, remote, coordinator } = await seededHarness();
    remote.updateError = new VenueMutationPersistenceError(
      "unavailable",
      "safe",
    );

    const result = await coordinator.updateCore(updateInput());

    expect(result.state).toBe("pending");
    expect(local.pending.get(operationId)).toMatchObject({
      operationId,
      status: "failed_retryable",
      attemptCount: 1,
      lastErrorCode: "unavailable",
    });
    expect(local.cached.get(`venue:${venueId}`)?.syncMarker).toBe("pending");
    expect(await cachedVenue(local)).toMatchObject({ name: "Venue Local" });
  });

  it("retains a stale-revision conflict without overwriting local intent", async () => {
    const { local, remote, coordinator } = await seededHarness();
    remote.updateError = new VenueMutationPersistenceError("conflict", "safe");

    const result = await coordinator.updateCore(updateInput());

    expect(result.state).toBe("conflict");
    expect(local.pending.get(operationId)?.status).toBe("conflict");
    expect(local.cached.get(`venue:${venueId}`)?.syncMarker).toBe("conflict");
    expect(await cachedVenue(local)).toMatchObject({ name: "Venue Local" });
  });

  it("does not attempt remote mutation when local durability fails", async () => {
    const { local, remote, coordinator } = await seededHarness();
    local.failNextAdd = true;

    await expect(coordinator.updateCore(updateInput())).resolves.toEqual({
      state: "durability_unavailable",
      venue: null,
    });
    expect(remote.updateCalls).toHaveLength(0);
  });

  it("does not retain an orphaned queue entry when working-cache durability fails", async () => {
    const { local, remote, coordinator } = await seededHarness();
    local.failNextCachePut = true;

    await expect(coordinator.updateCore(updateInput())).resolves.toEqual({
      state: "durability_unavailable",
      venue: null,
    });
    expect(remote.updateCalls).toHaveLength(0);
    expect(local.pending.size).toBe(0);
  });
});

describe("VenueLocalSyncCoordinator restart replay", () => {
  it.each(["response lost", "session expired"] as const)(
    "replays a retryable core update after %s with the same operation id",
    async (failure) => {
      const { local, remote, coordinator } = await seededHarness();
      remote.updateError = new VenueMutationPersistenceError(
        "unavailable",
        failure,
      );

      await coordinator.updateCore(updateInput());
      expect(local.pending.get(operationId)?.status).toBe("failed_retryable");

      remote.updateError = null;
      const restarted = coordinatorFor(local, remote);
      const results = await restarted.replayPending();

      expect(results).toHaveLength(1);
      expect(results[0]?.state).toBe("synced");
      expect(remote.updateCalls).toHaveLength(2);
      expect(remote.updateCalls.map((call) => call.operationId)).toEqual([
        operationId,
        operationId,
      ]);
      expect(local.pending.size).toBe(0);
      expect(await cachedVenue(local)).toMatchObject({
        name: "Venue Local",
        revision: 2,
      });
    },
  );

  it("does not automatically replay an explicit conflict", async () => {
    const { local, remote, coordinator } = await seededHarness();
    remote.updateError = new VenueMutationPersistenceError("conflict", "safe");
    await coordinator.updateCore(updateInput());

    remote.updateError = null;
    await expect(
      coordinatorFor(local, remote).replayPending(),
    ).resolves.toEqual([]);
    expect(remote.updateCalls).toHaveLength(1);
    expect(local.pending.get(operationId)?.status).toBe("conflict");
  });
});

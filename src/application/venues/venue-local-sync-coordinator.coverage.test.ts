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
import {
  VenueLocalSyncCoordinator,
  type VenueLocalSyncResult,
} from "@application/venues/venue-local-sync-coordinator";
import {
  venueCachedRecord,
  venueFromCachedRecord,
} from "@application/venues/venue-local-cache";
import {
  VENUE_CORE_UPDATE_MUTATION,
  VENUE_STATUS_MUTATION,
} from "@application/venues/venue-local-mutation";
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
const now = "2026-09-29T18:00:00.000Z";

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

class LocalHarness implements LocalProjectStore {
  readonly scope = scope;
  readonly cached = new Map<string, CachedRecordEnvelope>();
  readonly pending = new Map<string, PendingMutationEnvelope>();
  pendingPutCount = 0;
  failPendingPutAt: number | null = null;

  async getMetadata(): Promise<LocalProjectMetadata> {
    throw new Error("not used");
  }
  async putCachedRecord(record: CachedRecordEnvelope): Promise<void> {
    this.cached.set(record.key, record);
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
    this.pending.set(mutation.operationId, mutation);
  }
  async putPendingMutation(mutation: PendingMutationEnvelope): Promise<void> {
    this.pendingPutCount += 1;
    if (this.pendingPutCount === this.failPendingPutAt) {
      throw new Error("synthetic local put failure");
    }
    this.pending.set(mutation.operationId, mutation);
  }
  async removePendingMutation(id: string): Promise<void> {
    this.pending.delete(id);
  }
  async getPendingMutation(id: string): Promise<PendingMutationEnvelope | null> {
    return this.pending.get(id) ?? null;
  }
  async listPendingMutations(): Promise<readonly PendingMutationEnvelope[]> {
    return [...this.pending.values()];
  }
  async readSyncCounters(): Promise<LocalSyncCounters> {
    throw new Error("not used");
  }
  close(): void {}
}

class RemoteHarness {
  updateError: unknown = null;
  transitionError: unknown = null;
  updateCalls = 0;
  transitionCalls = 0;
  remoteVenue: VenueCoreRecord = venue;

  readonly repository: VenueRepositoryPort = {
    listVenues: async () => [this.remoteVenue],
    getVenue: async () => this.remoteVenue,
    updateVenueCore: async (input) => {
      this.updateCalls += 1;
      if (this.updateError !== null) throw this.updateError;
      return { ...this.remoteVenue, name: input.name, revision: 2 };
    },
  };

  readonly commands: VenueCommandPort = {
    createVenue: async () => {
      throw new Error("not used");
    },
    transitionVenue: async (input) => {
      this.transitionCalls += 1;
      if (this.transitionError !== null) throw this.transitionError;
      return input.expectedRevision + 1;
    },
  };
}

async function harness(seed = true) {
  const local = new LocalHarness();
  if (seed) {
    await local.putCachedRecord(venueCachedRecord(scope, venue, "synced"));
  }
  const remote = new RemoteHarness();
  const coordinator = new VenueLocalSyncCoordinator({
    local,
    repository: remote.repository,
    commands: remote.commands,
    now: () => now,
  });
  return { local, remote, coordinator };
}

function coreInput(patch: Partial<VenueCoreUpdateInput> = {}): VenueCoreUpdateInput {
  return {
    projectId: scope.projectId,
    venueId,
    expectedRevision: 1,
    name: "Venue Local",
    code: null,
    websiteUrl: null,
    city: "Lyon",
    operationId,
    deviceId: scope.deviceId,
    ...patch,
  };
}

function statusInput(
  patch: Partial<VenueTransitionInput> = {},
): VenueTransitionInput {
  return {
    projectId: scope.projectId,
    venueId,
    status: "shortlist",
    rejectionReason: null,
    expectedRevision: 1,
    operationId,
    deviceId: scope.deviceId,
    ...patch,
  };
}

function pendingStatusMutation(): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: VENUE_STATUS_MUTATION,
    baseRevision: "1",
    payload: { status: "shortlist", rejectionReason: null },
    createdAt: now,
    priorityClass: "essential_structured",
  });
}

describe("VenueLocalSyncCoordinator scope and cache misses", () => {
  it("rejects project and device scope mismatches", async () => {
    const { coordinator } = await harness();
    await expect(
      coordinator.updateCore(
        coreInput({ projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      ),
    ).rejects.toThrow("scope mismatch");
    await expect(
      coordinator.updateCore(
        coreInput({ deviceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
      ),
    ).rejects.toThrow("scope mismatch");
  });

  it("returns cache_miss for core and status writes", async () => {
    const { coordinator } = await harness(false);
    await expect(coordinator.updateCore(coreInput())).resolves.toEqual({
      state: "cache_miss",
      venue: null,
    });
    await expect(coordinator.transitionStatus(statusInput())).resolves.toEqual({
      state: "cache_miss",
      venue: null,
    });
  });
});

describe("VenueLocalSyncCoordinator failure classification", () => {
  it("retains denied mutation as failed_permanent", async () => {
    const { local, remote, coordinator } = await harness();
    remote.updateError = new VenueMutationPersistenceError("denied", "safe");
    const result = await coordinator.updateCore(coreInput());
    expect(result.state).toBe("failed_permanent");
    expect(local.pending.get(operationId)?.status).toBe("failed_permanent");
  });

  it("retains unknown remote failure as retryable", async () => {
    const { local, remote, coordinator } = await harness();
    remote.updateError = new Error("synthetic network failure");
    const result = await coordinator.updateCore(coreInput());
    expect(result.state).toBe("pending");
    expect(local.pending.get(operationId)).toMatchObject({
      status: "failed_retryable",
      lastErrorCode: "unavailable",
    });
  });

  it("preserves working data when failure-state persistence also fails", async () => {
    const { local, remote, coordinator } = await harness();
    remote.updateError = new Error("synthetic network failure");
    local.failPendingPutAt = 2;
    const result = await coordinator.updateCore(coreInput());
    expect(result).toMatchObject({
      state: "pending",
      venue: { name: "Venue Local" },
    });
  });
});

describe("VenueLocalSyncCoordinator lifecycle replay coverage", () => {
  it("replays a retryable lifecycle mutation after response loss", async () => {
    const { local, remote, coordinator } = await harness();
    remote.transitionError = new VenueMutationPersistenceError(
      "unavailable",
      "response lost",
    );
    await coordinator.transitionStatus(statusInput());
    remote.transitionError = null;

    const replayed = await coordinator.replayPending();

    expect(replayed).toHaveLength(1);
    expect(replayed[0]).toMatchObject({
      state: "synced",
      venue: { status: "shortlist", revision: 2 },
    });
    expect(remote.transitionCalls).toBe(2);
    expect(local.pending.size).toBe(0);
  });

  it("returns cache_miss when queued Venue no longer has local cache", async () => {
    const { local, coordinator } = await harness(false);
    await local.addPendingMutation(pendingStatusMutation());
    await expect(coordinator.replayPending()).resolves.toEqual([
      { state: "cache_miss", venue: null },
    ]);
  });

  it("skips a non-Venue retryable mutation", async () => {
    const { local, coordinator } = await harness();
    await local.addPendingMutation({
      ...pendingStatusMutation(),
      entityType: "project_preferences",
    });
    await expect(coordinator.replayPending()).resolves.toEqual([]);
  });
});

describe("VenueLocalSyncCoordinator conflict refresh coverage", () => {
  it("does not overwrite a conflicting cached Venue", async () => {
    const { local, remote, coordinator } = await harness();
    const conflicting = { ...venue, name: "Conflict Local" };
    await local.putCachedRecord(
      venueCachedRecord(scope, conflicting, "conflict"),
    );
    remote.remoteVenue = { ...venue, name: "Remote New", revision: 2 };

    await coordinator.refreshFromCloud();

    const record = await local.getCachedRecord("venue", venueId);
    expect(record === null ? null : venueFromCachedRecord(record)).toMatchObject({
      name: "Conflict Local",
    });
  });
});

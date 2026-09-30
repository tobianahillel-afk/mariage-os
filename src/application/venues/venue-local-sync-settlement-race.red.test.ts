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
import type { VenueCommandPort } from "@application/venues/venue-command-port";
import { VenueLocalSyncCoordinator } from "@application/venues/venue-local-sync-coordinator";
import { venueCachedRecord } from "@application/venues/venue-local-cache";
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

class RaceLocalStore implements LocalProjectStore {
  readonly scope = scope;
  readonly cached = new Map<string, CachedRecordEnvelope>();
  readonly pending = new Map<string, PendingMutationEnvelope>();
  replacement: PendingMutationEnvelope | null = null;
  settlementRecord: CachedRecordEnvelope | null = null;

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
  async listCachedRecords(): Promise<readonly CachedRecordEnvelope[]> {
    return [...this.cached.values()];
  }
  async addPendingMutation(mutation: PendingMutationEnvelope): Promise<void> {
    this.pending.set(mutation.operationId, mutation);
  }
  async addPendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    this.pending.set(mutation.operationId, mutation);
    this.cached.set(record.key, record);
  }
  async putPendingMutation(mutation: PendingMutationEnvelope): Promise<void> {
    this.pending.set(mutation.operationId, mutation);
  }
  async settlePendingMutationWithCachedRecord(
    id: string,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    this.settlementRecord = record;
    const current = this.pending.get(id);
    if (current === undefined) throw new Error("missing mutation");
    this.replacement = {
      ...current,
      entityId: "66666666-6666-4666-8666-666666666666",
      payload: { name: "Concurrent replacement" },
    };
    this.pending.set(id, this.replacement);
    throw new Error("settlement target does not match");
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
    throw new Error("not used");
  }
  close(): void {}
}

describe("WP-2.10 acknowledgement settlement race RED", () => {
  it("does not overwrite a concurrently changed local mutation after remote success", async () => {
    const local = new RaceLocalStore();
    await local.putCachedRecord(venueCachedRecord(scope, venue, "synced"));

    const repository: VenueRepositoryPort = {
      listVenues: async () => [venue],
      getVenue: async () => venue,
      updateVenueCore: async (input) => ({
        ...venue,
        name: input.name,
        city: input.city,
        revision: 2,
      }),
    };
    const commands: VenueCommandPort = {
      createVenue: async () => {
        throw new Error("not used");
      },
      transitionVenue: async () => {
        throw new Error("not used");
      },
    };
    const coordinator = new VenueLocalSyncCoordinator({
      local,
      repository,
      commands,
      now: () => "2026-09-30T10:25:00.000Z",
    });

    const result = await coordinator.updateCore({
      projectId: scope.projectId,
      venueId,
      expectedRevision: 1,
      operationId,
      deviceId: scope.deviceId,
      name: "Acknowledged remotely",
      code: null,
      websiteUrl: null,
      city: "Lyon",
    });

    expect(result.state).toBe("pending");
    expect(local.settlementRecord).not.toBeNull();
    expect(local.replacement).not.toBeNull();
    expect(local.pending.get(operationId)).toEqual(local.replacement);
  });
});

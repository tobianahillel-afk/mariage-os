import { describe, expect, it } from "vitest";

import type { LocalProjectStore } from "@application/local-data/local-project-store";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type CachedRecordEnvelope,
} from "@application/local-data/local-records";
import type { VenueCommandPort } from "@application/venues/venue-command-port";
import { VenueLocalSyncCoordinator } from "@application/venues/venue-local-sync-coordinator";
import {
  venueCachedRecord,
  venueFromCachedRecord,
} from "@application/venues/venue-local-cache";
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

const cloudVenue: VenueCoreRecord = {
  id: venueId,
  projectId: scope.projectId,
  code: null,
  name: "Cloud venue",
  status: "research",
  rejectionReason: null,
  websiteUrl: null,
  city: "Paris",
  revision: 2,
};
const localVenue: VenueCoreRecord = {
  ...cloudVenue,
  name: "Later local edit",
  revision: 1,
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

class RefreshRaceLocal {
  readonly scope = scope;
  readonly cached = new Map<string, CachedRecordEnvelope>();
  readonly readObserved = deferred();
  readonly releaseRead = deferred();
  private pauseNextRead = true;

  async getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null> {
    const snapshot = this.cached.get(`${recordType}:${entityId}`) ?? null;
    if (this.pauseNextRead) {
      this.pauseNextRead = false;
      this.readObserved.resolve();
      await this.releaseRead.promise;
    }
    return snapshot;
  }

  async putCachedRecord(record: CachedRecordEnvelope): Promise<void> {
    this.cached.set(record.key, record);
  }

  async listCachedRecords(
    recordType: string,
  ): Promise<readonly CachedRecordEnvelope[]> {
    return [...this.cached.values()].filter(
      (record) => record.recordType === recordType,
    );
  }

  async addLaterLocalIntent(): Promise<void> {
    const mutation = createPendingMutationEnvelope(scope, {
      operationId,
      entityType: "venue",
      entityId: venueId,
      mutationType: "update_venue_core",
      baseRevision: "1",
      payload: {
        name: localVenue.name,
        code: null,
        websiteUrl: null,
        city: localVenue.city,
      },
      createdAt: "2026-09-30T15:10:00.000Z",
      priorityClass: "essential_structured",
    });
    this.cached.set(
      `venue:${venueId}`,
      venueCachedRecord(scope, localVenue, "pending"),
    );
    void mutation;
  }
}

function coordinator(local: RefreshRaceLocal): VenueLocalSyncCoordinator {
  const repository: VenueRepositoryPort = {
    listVenues: async () => [cloudVenue],
    getVenue: async () => cloudVenue,
    updateVenueCore: async () => cloudVenue,
  };
  const commands: VenueCommandPort = {
    createVenue: async () => {
      throw new Error("not used");
    },
    transitionVenue: async () => {
      throw new Error("not used");
    },
  };
  return new VenueLocalSyncCoordinator({
    local: local as unknown as LocalProjectStore,
    repository,
    commands,
    now: () => "2026-09-30T15:10:00.000Z",
  });
}

describe("Venue cloud refresh vs concurrent local intent RED", () => {
  it("must not overwrite an edit that becomes pending after refresh reads cache", async () => {
    const local = new RefreshRaceLocal();
    await local.putCachedRecord(
      venueCachedRecord(scope, { ...cloudVenue, revision: 1 }, "synced"),
    );

    const refresh = coordinator(local).refreshFromCloud();
    await local.readObserved.promise;
    await local.addLaterLocalIntent();
    local.releaseRead.resolve();
    await refresh;

    const record = local.cached.get(`venue:${venueId}`);
    expect(record?.syncMarker).toBe("pending");
    expect(record === undefined ? null : venueFromCachedRecord(record).name).toBe(
      "Later local edit",
    );
  });
});

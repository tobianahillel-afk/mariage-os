import { expect, it } from "vitest";

import { createPendingMutationEnvelope } from "@application/local-data/local-records";
import { VenueLocalSyncCoordinator } from "@application/venues/venue-local-sync-coordinator";
import {
  venueCachedRecord,
  venueFromCachedRecord,
} from "@application/venues/venue-local-cache";
import type { VenueCommandPort } from "@application/venues/venue-command-port";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "@application/venues/venue-repository-port";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  deviceId,
  entityId,
  operationId,
  projectId,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const laterOperationId = "57777777-7777-4777-8777-777777777777";

const initialVenue: VenueCoreRecord = {
  id: entityId,
  projectId,
  code: null,
  name: "Initial Venue",
  status: "research",
  rejectionReason: null,
  websiteUrl: null,
  city: "Paris",
  revision: 1,
};

const firstWorking: VenueCoreRecord = {
  ...initialVenue,
  name: "First local intent",
  city: "Lyon",
};

const laterWorking: VenueCoreRecord = {
  ...initialVenue,
  name: "Later local intent",
  city: "Marseille",
};

function unusedCommands(): VenueCommandPort {
  return {
    createVenue: async () => {
      throw new Error("not used");
    },
    transitionVenue: async () => {
      throw new Error("not used");
    },
  };
}

async function stageLaterIntent(local: IndexedDbProjectStore): Promise<void> {
  await local.addPendingMutationWithCachedRecord(
    createPendingMutationEnvelope(scope, {
      operationId: laterOperationId,
      entityType: "venue",
      entityId,
      mutationType: "update_venue_core",
      baseRevision: "1",
      payload: {
        name: laterWorking.name,
        code: laterWorking.code,
        websiteUrl: laterWorking.websiteUrl,
        city: laterWorking.city,
      },
      createdAt: "2026-09-30T14:00:01.000Z",
      priorityClass: "essential_structured",
    }),
    venueCachedRecord(scope, laterWorking, "pending"),
  );
}

it("preserves later local intent when an older remote attempt fails", async () => {
  const factory = new FakeFactory();
  const local = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  await local.putCachedRecord(venueCachedRecord(scope, initialVenue, "synced"));

  const repository: VenueRepositoryPort = {
    listVenues: async () => [initialVenue],
    getVenue: async () => initialVenue,
    updateVenueCore: async () => {
      await stageLaterIntent(local);
      throw new Error("synthetic network failure");
    },
  };
  const coordinator = new VenueLocalSyncCoordinator({
    local,
    repository,
    commands: unusedCommands(),
    now: () => "2026-09-30T14:00:00.000Z",
  });

  const result = await coordinator.updateCore({
    projectId,
    venueId: entityId,
    expectedRevision: 1,
    operationId,
    deviceId,
    name: firstWorking.name,
    code: firstWorking.code,
    websiteUrl: firstWorking.websiteUrl,
    city: firstWorking.city,
  });

  expect(await local.getPendingMutation(operationId)).toMatchObject({
    status: "failed_retryable",
  });
  expect(await local.getPendingMutation(laterOperationId)).not.toBeNull();

  const cached = await local.getCachedRecord("venue", entityId);
  expect(cached?.syncMarker).toBe("pending");
  expect(cached === null ? null : venueFromCachedRecord(cached)).toEqual(
    laterWorking,
  );
  expect(result).toEqual({ state: "pending", venue: laterWorking });
});

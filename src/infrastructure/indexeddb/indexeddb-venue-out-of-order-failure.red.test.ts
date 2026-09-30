import { expect, it } from "vitest";

import { VenueLocalSyncCoordinator } from "@application/venues/venue-local-sync-coordinator";
import { VenueMutationPersistenceError } from "@application/venues/venue-mutation-persistence-error";
import type { VenueCommandPort } from "@application/venues/venue-command-port";
import { venueFromCachedRecord } from "@application/venues/venue-local-cache";
import type {
  VenueCoreRecord,
  VenueCoreUpdateInput,
  VenueRepositoryPort,
} from "@application/venues/venue-repository-port";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  deviceId,
  entityId,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const firstOperationId = "55555555-5555-4555-8555-555555555555";
const secondOperationId = "56666666-6666-4666-8666-666666666666";

const initialVenue: VenueCoreRecord = {
  id: entityId,
  projectId: scope.projectId,
  code: null,
  name: "Initial Venue",
  status: "research",
  rejectionReason: null,
  websiteUrl: null,
  city: "Paris",
  revision: 1,
};

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function input(
  operationId: string,
  name: string,
  city: string,
): VenueCoreUpdateInput {
  return {
    projectId: scope.projectId,
    venueId: entityId,
    expectedRevision: 1,
    operationId,
    deviceId,
    name,
    code: null,
    websiteUrl: null,
    city,
  };
}

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

it("does not let an older late failure regress a newer acknowledged Venue edit", async () => {
  const factory = new FakeFactory();
  const local = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  await local.putCachedRecord({
    key: `venue:${entityId}`,
    recordType: "venue",
    entityId,
    projectId: scope.projectId,
    serverRevision: "1",
    serverUpdatedAt: null,
    syncMarker: "synced",
    payload: {
      code: null,
      name: initialVenue.name,
      status: initialVenue.status,
      rejectionReason: null,
      websiteUrl: null,
      city: initialVenue.city,
      revision: 1,
    },
  });

  const firstRemote = deferred<VenueCoreRecord>();
  const firstStarted = deferred<void>();
  const repository: VenueRepositoryPort = {
    listVenues: async () => [initialVenue],
    getVenue: async () => initialVenue,
    updateVenueCore: async (update) => {
      if (update.operationId === firstOperationId) {
        firstStarted.resolve();
        return firstRemote.promise;
      }
      return {
        ...initialVenue,
        name: update.name,
        city: update.city,
        revision: 2,
      };
    },
  };
  const coordinator = new VenueLocalSyncCoordinator({
    local,
    repository,
    commands: unusedCommands(),
    now: () => "2026-09-30T16:00:00.000Z",
  });

  const first = coordinator.updateCore(
    input(firstOperationId, "Older local edit", "Lyon"),
  );
  await firstStarted.promise;
  await coordinator.updateCore(
    input(secondOperationId, "Newer acknowledged edit", "Nice"),
  );

  firstRemote.reject(new VenueMutationPersistenceError("conflict", "safe"));
  await first;

  const cached = await local.getCachedRecord("venue", entityId);
  expect(cached).not.toBeNull();
  expect(cached === null ? null : venueFromCachedRecord(cached)).toMatchObject({
    name: "Newer acknowledged edit",
    city: "Nice",
  });
});

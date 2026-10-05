import { expect, it } from "vitest";

import { createCachedRecordEnvelope } from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
  entityId,
  missingFixture,
  operationId,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const localBinaryId = "a1111111-1111-4111-8111-111111111111";
const venueId = "b1111111-1111-4111-8111-111111111111";

function binary(syncState: "unsynced" | "synced") {
  return {
    localBinaryId,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    venueId,
    filename: "visite.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 2048,
    createdAt: "2026-10-04T23:00:00.000Z",
    lastAccessedAt: "2026-10-04T23:00:00.000Z",
    pinned: true,
    syncState,
  } as const;
}

it("migrates v1 metadata to v2 without losing accepted cache or queue state", async () => {
  const factory = new FakeFactory();
  const first = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1.0.0",
  );
  const cached = createCachedRecordEnvelope(scope, {
    recordType: "venue",
    entityId,
    serverRevision: "1",
    serverUpdatedAt: null,
    syncMarker: "synced",
    payload: { name: "Venue Alpha" },
  });
  const mutation = createMutation();

  await first.putCachedRecord(cached);
  await first.addPendingMutation(mutation);

  const metadataRows = rawStore(factory, "metadata");
  const metadata = metadataRows.get("scope") ?? missingFixture();
  metadataRows.set("scope", { ...metadata, localSchemaVersion: 1 });
  first.close();

  factory.forceUpgrade = true;
  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  expect((await reopened.getMetadata()).localSchemaVersion).toBe(2);
  expect(await reopened.getCachedRecord("venue", entityId)).toEqual(cached);
  expect(await reopened.getPendingMutation(operationId)).toEqual(mutation);
  expect(rawStore(factory, "offline_pins").size).toBe(0);
  expect(rawStore(factory, "local_binaries").size).toBe(0);
});

it("counts only unsynced local visit binaries as unresolved local work", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  rawStore(factory, "local_binaries").set(localBinaryId, binary("synced"));
  expect((await store.readSyncCounters()).unsyncedBinaryCount).toBe(0);

  rawStore(factory, "local_binaries").set(localBinaryId, binary("unsynced"));
  expect((await store.readSyncCounters()).unsyncedBinaryCount).toBe(1);
});

it("fails closed on malformed or foreign local-binary metadata", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  rawStore(factory, "local_binaries").set(localBinaryId, {
    ...binary("unsynced"),
    mimeType: "invalid",
  });
  await expect(store.readSyncCounters()).rejects.toThrow("local binary");

  rawStore(factory, "local_binaries").set(localBinaryId, {
    ...binary("unsynced"),
    userId: "c1111111-1111-4111-8111-111111111111",
  });
  await expect(store.readSyncCounters()).rejects.toThrow("another local scope");
});

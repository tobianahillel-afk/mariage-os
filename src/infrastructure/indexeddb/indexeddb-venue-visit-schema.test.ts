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

it("counts local visit binaries as unresolved local work", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  rawStore(factory, "local_binaries").set("binary-1", {
    localBinaryId: "binary-1",
  });

  expect(await store.readSyncCounters()).toEqual({
    pendingCount: 0,
    conflictCount: 0,
    retryableFailureCount: 0,
    permanentFailureCount: 0,
    unsyncedBinaryCount: 1,
  });
});

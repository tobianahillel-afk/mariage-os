import { expect, it } from "vitest";

import { createCachedRecordEnvelope } from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import { runAtomicSettlementWithCache } from "./indexeddb-project-store-io";
import {
  FakeFactory,
  createMutation,
  databaseName,
  entityId,
  missingOperationId,
  operationId,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

function cachedRecord(syncMarker: "pending" | "synced") {
  return createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: syncMarker === "pending" ? "rev-1" : "rev-2",
    serverUpdatedAt: null,
    syncMarker,
    payload: { density: "compact" },
  });
}

it("fails closed when acknowledgement settlement has no pending mutation", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );

  await expect(
    store.settlePendingMutationWithCachedRecord(
      createMutation(),
      cachedRecord("synced"),
    ),
  ).rejects.toThrow("settlement target is missing");
});

it("rejects a corrupted persisted operation identity", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  rawStore(factory, "pending_mutations").set(operationId, {
    ...createMutation(),
    operationId: missingOperationId,
  });

  await expect(
    store.settlePendingMutationWithCachedRecord(
      createMutation(),
      cachedRecord("synced"),
    ),
  ).rejects.toThrow("settlement intent does not match");
});

it("surfaces a failure inside the atomic settlement transaction", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  await store.addPendingMutationWithCachedRecord(
    createMutation(),
    cachedRecord("pending"),
  );

  factory.state.failure = "request";
  await expect(
    runAtomicSettlementWithCache(
      factory.rawDatabase(databaseName) as unknown as IDBDatabase,
      operationId,
      cachedRecord("synced"),
      {
        validateMutation: () => undefined,
        shouldWriteCache: () => true,
      },
    ),
  ).rejects.toThrow("settlement/cache transaction");
});

it.each([0, 3])(
  "rejects non-migratable local schema version %s",
  async (version) => {
    const factory = new FakeFactory();
    const store = await IndexedDbProjectStore.open(
      factory as unknown as IDBFactory,
      scope,
      "2",
    );
    rawStore(factory, "metadata").set("scope", {
      ...(await store.getMetadata()),
      localSchemaVersion: version,
    });
    store.close();
    factory.forceUpgrade = true;

    await expect(
      IndexedDbProjectStore.open(factory as unknown as IDBFactory, scope, "2"),
    ).rejects.toThrow("scope metadata is inconsistent");
  },
);

import { createCachedRecordEnvelope } from "@application/local-data/local-records";
import { expect, it } from "vitest";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
  entityId,
  missingOperationId,
  operationId,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

it("atomically revalidates the settlement target", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  const record = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "rev-2",
    serverUpdatedAt: null,
    syncMarker: "synced",
    payload: { density: "compact" },
  });
  await store.addPendingMutation(mutation);

  const readPending = store.getPendingMutation.bind(store);
  store.getPendingMutation = async (id) => {
    const existing = await readPending(id);
    rawStore(factory, "pending_mutations").set(operationId, {
      ...mutation,
      entityId: missingOperationId,
    });
    return existing;
  };

  await expect(
    store.settlePendingMutationWithCachedRecord(operationId, record),
  ).rejects.toThrow("target does not match");
  expect(rawStore(factory, "cached_records").size).toBe(0);
});

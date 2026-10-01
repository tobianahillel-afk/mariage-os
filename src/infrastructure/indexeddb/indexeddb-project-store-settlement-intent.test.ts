import { expect, it } from "vitest";

import { createCachedRecordEnvelope } from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
  entityId,
  operationId,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

function cachedRecord(marker: "pending" | "synced", revision: string) {
  return createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: revision,
    serverUpdatedAt: null,
    syncMarker: marker,
    payload: { density: "compact" },
  });
}

it("rejects changed settlement intent", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const original = createMutation();
  const working = cachedRecord("pending", "1");
  const acknowledgement = cachedRecord("synced", "2");
  await store.addPendingMutationWithCachedRecord(original, working);
  const changedIntent = {
    ...original,
    payload: { density: "comfortable" },
  };
  rawStore(factory, "pending_mutations").set(operationId, changedIntent);

  await expect(
    store.settlePendingMutationWithCachedRecord(original, acknowledgement),
  ).rejects.toThrow("settlement intent does not match");
  expect(rawStore(factory, "pending_mutations").get(operationId)).toEqual(
    changedIntent,
  );
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    working,
  );
});

it("allows retry metadata to change before settlement", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const original = createMutation();
  const acknowledgement = cachedRecord("synced", "2");
  await store.addPendingMutation(original);
  rawStore(factory, "pending_mutations").set(operationId, {
    ...original,
    status: "sending",
    attemptCount: original.attemptCount + 1,
    lastAttemptAt: "2026-10-01T09:00:00.000Z",
  });

  await store.settlePendingMutationWithCachedRecord(original, acknowledgement);

  expect(await store.getPendingMutation(operationId)).toBeNull();
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    acknowledgement,
  );
});

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

it("rejects changed settlement intent", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const original = createMutation();
  const working = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "1",
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: { density: "compact" },
  });
  const acknowledgement = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "2",
    serverUpdatedAt: null,
    syncMarker: "synced",
    payload: { density: "compact" },
  });
  await store.addPendingMutationWithCachedRecord(original, working);
  const changedIntent = {
    ...original,
    payload: { density: "comfortable" },
  };
  rawStore(factory, "pending_mutations").set(operationId, changedIntent);

  await expect(
    store.settlePendingMutationWithCachedRecord(operationId, acknowledgement),
  ).rejects.toThrow("settlement intent does not match");
  expect(rawStore(factory, "pending_mutations").get(operationId)).toEqual(
    changedIntent,
  );
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    working,
  );
});

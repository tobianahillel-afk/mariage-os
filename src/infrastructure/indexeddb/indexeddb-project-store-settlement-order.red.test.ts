import { expect, it } from "vitest";

import { createCachedRecordEnvelope } from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
  entityId,
  missingOperationId,
  operationId,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

it("preserves a later unresolved Venue intent when an older mutation settles", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const first = {
    ...createMutation(),
    entityType: "venue",
    mutationType: "update_venue_core",
    payload: { name: "First local edit" },
  };
  const second = {
    ...first,
    operationId: missingOperationId,
    payload: { name: "Later local edit" },
    createdAt: "2026-09-30T12:01:00.000Z",
  };
  const firstWorking = createCachedRecordEnvelope(scope, {
    recordType: "venue",
    entityId,
    serverRevision: "1",
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: first.payload,
  });
  const laterWorking = {
    ...firstWorking,
    payload: second.payload,
  };
  const firstAcknowledged = {
    ...firstWorking,
    serverRevision: "2",
    syncMarker: "synced" as const,
    payload: { name: "First cloud acknowledgement" },
  };

  await store.addPendingMutationWithCachedRecord(first, firstWorking);
  await store.addPendingMutationWithCachedRecord(second, laterWorking);

  await store.settlePendingMutationWithCachedRecord(
    operationId,
    firstAcknowledged,
  );

  expect(await store.getPendingMutation(operationId)).toBeNull();
  expect(await store.getPendingMutation(missingOperationId)).toEqual(second);
  expect(await store.getCachedRecord("venue", entityId)).toEqual(laterWorking);

  store.close();
  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  expect(await reopened.getPendingMutation(missingOperationId)).toEqual(second);
  expect(await reopened.getCachedRecord("venue", entityId)).toEqual(
    laterWorking,
  );
});

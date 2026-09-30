import { expect, it } from "vitest";

import { createCachedRecordEnvelope } from "@application/local-data/local-records";

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

function venueMutation(operation: string, name: string, createdAt: string) {
  return {
    ...createMutation(),
    operationId: operation,
    entityType: "venue",
    mutationType: "update_venue_core",
    payload: { name },
    createdAt,
  };
}

function venueRecord(
  name: string,
  marker: "pending" | "synced",
  revision: string,
) {
  return createCachedRecordEnvelope(scope, {
    recordType: "venue",
    entityId,
    serverRevision: revision,
    serverUpdatedAt: null,
    syncMarker: marker,
    payload: { name },
  });
}

it("preserves a later unresolved Venue intent when an older mutation settles", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const first = venueMutation(
    operationId,
    "First local edit",
    "2026-09-30T12:00:00.000Z",
  );
  const second = venueMutation(
    missingOperationId,
    "Later local edit",
    "2026-09-30T12:01:00.000Z",
  );
  const firstWorking = venueRecord("First local edit", "pending", "1");
  const laterWorking = venueRecord("Later local edit", "pending", "1");
  const firstAcknowledged = venueRecord(
    "First cloud acknowledgement",
    "synced",
    "2",
  );

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

it.each([
  ["foreign", { projectId: missingOperationId }],
  ["malformed", { status: "not_a_status" }],
] as const)(
  "fails closed on a %s concurrent persisted mutation",
  async (_kind, corruption) => {
    const factory = new FakeFactory();
    const store = await IndexedDbProjectStore.open(
      factory as unknown as IDBFactory,
      scope,
      "1",
    );
    const first = venueMutation(
      operationId,
      "First local edit",
      "2026-09-30T12:00:00.000Z",
    );
    const firstWorking = venueRecord("First local edit", "pending", "1");
    const acknowledgement = venueRecord("Cloud value", "synced", "2");
    await store.addPendingMutationWithCachedRecord(first, firstWorking);
    rawStore(factory, "pending_mutations").set(missingOperationId, {
      ...venueMutation(
        missingOperationId,
        "Later local edit",
        "2026-09-30T12:01:00.000Z",
      ),
      ...corruption,
    });

    await expect(
      store.settlePendingMutationWithCachedRecord(
        operationId,
        acknowledgement,
      ),
    ).rejects.toThrow();

    expect(await store.getPendingMutation(operationId)).toEqual(first);
    expect(await store.getCachedRecord("venue", entityId)).toEqual(
      firstWorking,
    );
  },
);

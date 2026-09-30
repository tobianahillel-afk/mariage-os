import { expect, it } from "vitest";

import {
  createCachedRecordEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
  entityId,
  operationId,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

function sendingMutation(
  mutation: PendingMutationEnvelope,
): PendingMutationEnvelope {
  return {
    ...mutation,
    attemptCount: 1,
    lastAttemptAt: "2026-09-30T10:50:00.000Z",
    status: "sending",
  };
}

it("rejects a stale status update after settlement", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  await store.addPendingMutation(mutation);
  await store.removePendingMutation(operationId);

  await expect(
    store.putPendingMutation(sendingMutation(mutation)),
  ).rejects.toThrow("update target is missing");
  expect(await store.getPendingMutation(operationId)).toBeNull();
});

it("does not overwrite a changed pending mutation intent", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  await store.addPendingMutation(mutation);
  const replacement = {
    ...mutation,
    payload: { density: "comfortable" },
  };
  rawStore(factory, "pending_mutations").set(operationId, replacement);

  await expect(
    store.putPendingMutation(sendingMutation(mutation)),
  ).rejects.toThrow("update intent does not match");
  expect(rawStore(factory, "pending_mutations").get(operationId)).toEqual(
    replacement,
  );
});

it("fails closed when stale-update lookup storage fails", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  await store.addPendingMutation(mutation);
  factory.state.failure = "request";

  await expect(
    store.putPendingMutation(sendingMutation(mutation)),
  ).rejects.toThrow("pending mutation transaction");
  expect(rawStore(factory, "pending_mutations").get(operationId)).toEqual(
    mutation,
  );
});

function cachedPreference(marker: "pending" | "conflict") {
  return createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "rev-1",
    serverUpdatedAt: null,
    syncMarker: marker,
    payload: { density: "compact" },
  });
}

it("atomically updates pending status and cache marker", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  await store.addPendingMutationWithCachedRecord(
    mutation,
    cachedPreference("pending"),
  );
  const failed = {
    ...sendingMutation(mutation),
    status: "conflict" as const,
    lastErrorCode: "conflict",
  };

  await store.putPendingMutation(failed, cachedPreference("conflict"));

  expect(await store.getPendingMutation(operationId)).toEqual(failed);
  expect(
    await store.getCachedRecord("project_preferences", entityId),
  ).toMatchObject({ syncMarker: "conflict" });
});

it("rolls back pending and cache on atomic update failure", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  const originalCache = cachedPreference("pending");
  await store.addPendingMutationWithCachedRecord(mutation, originalCache);
  factory.state.failure = "transaction_abort";

  await expect(
    store.putPendingMutation(
      {
        ...sendingMutation(mutation),
        status: "conflict",
        lastErrorCode: "conflict",
      },
      cachedPreference("conflict"),
    ),
  ).rejects.toThrow("pending/cache update transaction");

  expect(await store.getPendingMutation(operationId)).toEqual(mutation);
  expect(
    await store.getCachedRecord("project_preferences", entityId),
  ).toEqual(originalCache);
});

it("rejects changed intent before atomic cache update", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  const originalCache = cachedPreference("pending");
  await store.addPendingMutationWithCachedRecord(mutation, originalCache);
  rawStore(factory, "pending_mutations").set(operationId, {
    ...mutation,
    payload: { density: "comfortable" },
  });

  await expect(
    store.putPendingMutation(
      sendingMutation(mutation),
      cachedPreference("conflict"),
    ),
  ).rejects.toThrow("update intent does not match");

  expect(
    await store.getCachedRecord("project_preferences", entityId),
  ).toEqual(originalCache);
});

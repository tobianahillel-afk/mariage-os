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

function openStore(factory: FakeFactory) {
  return IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
}

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

function conflictMutation(
  mutation: PendingMutationEnvelope,
): PendingMutationEnvelope {
  return {
    ...sendingMutation(mutation),
    status: "conflict",
    lastErrorCode: "conflict",
  };
}

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

it("rejects stale status after settlement", async () => {
  const factory = new FakeFactory();
  const store = await openStore(factory);
  const mutation = createMutation();
  await store.addPendingMutation(mutation);
  await store.removePendingMutation(operationId);

  const write = store.putPendingMutation(sendingMutation(mutation));

  await expect(write).rejects.toThrow("update target is missing");
  expect(await store.getPendingMutation(operationId)).toBeNull();
});

it("rejects changed pending intent", async () => {
  const factory = new FakeFactory();
  const store = await openStore(factory);
  const mutation = createMutation();
  await store.addPendingMutation(mutation);
  const replacement = {
    ...mutation,
    payload: { density: "comfortable" },
  };
  rawStore(factory, "pending_mutations").set(operationId, replacement);

  const write = store.putPendingMutation(sendingMutation(mutation));

  await expect(write).rejects.toThrow("update intent does not match");
  expect(rawStore(factory, "pending_mutations").get(operationId)).toEqual(
    replacement,
  );
});

it("fails closed when stale lookup fails", async () => {
  const factory = new FakeFactory();
  const store = await openStore(factory);
  const mutation = createMutation();
  await store.addPendingMutation(mutation);
  factory.state.failure = "request";

  const write = store.putPendingMutation(sendingMutation(mutation));

  await expect(write).rejects.toThrow("pending mutation transaction");
  expect(rawStore(factory, "pending_mutations").get(operationId)).toEqual(
    mutation,
  );
});

it("updates pending status and cache atomically", async () => {
  const factory = new FakeFactory();
  const store = await openStore(factory);
  const mutation = createMutation();
  await store.addPendingMutationWithCachedRecord(
    mutation,
    cachedPreference("pending"),
  );
  const failed = conflictMutation(mutation);

  await store.putPendingMutation(failed, cachedPreference("conflict"));

  expect(await store.getPendingMutation(operationId)).toEqual(failed);
  const cached = await store.getCachedRecord("project_preferences", entityId);
  expect(cached).toMatchObject({ syncMarker: "conflict" });
});

it("rolls back pending and cache atomically", async () => {
  const factory = new FakeFactory();
  const store = await openStore(factory);
  const mutation = createMutation();
  const originalCache = cachedPreference("pending");
  await store.addPendingMutationWithCachedRecord(mutation, originalCache);
  factory.state.failure = "transaction_abort";

  const write = store.putPendingMutation(
    conflictMutation(mutation),
    cachedPreference("conflict"),
  );

  await expect(write).rejects.toThrow("pending/cache update transaction");
  expect(await store.getPendingMutation(operationId)).toEqual(mutation);
  const cached = await store.getCachedRecord("project_preferences", entityId);
  expect(cached).toEqual(originalCache);
});

it("validates intent before atomic cache update", async () => {
  const factory = new FakeFactory();
  const store = await openStore(factory);
  const mutation = createMutation();
  const originalCache = cachedPreference("pending");
  await store.addPendingMutationWithCachedRecord(mutation, originalCache);
  rawStore(factory, "pending_mutations").set(operationId, {
    ...mutation,
    payload: { density: "comfortable" },
  });

  const write = store.putPendingMutation(
    sendingMutation(mutation),
    cachedPreference("conflict"),
  );

  await expect(write).rejects.toThrow("update intent does not match");
  const cached = await store.getCachedRecord("project_preferences", entityId);
  expect(cached).toEqual(originalCache);
});

it("fails closed on malformed concurrent mutation before cache rewrite", async () => {
  const factory = new FakeFactory();
  const store = await openStore(factory);
  const mutation = createMutation();
  const originalCache = cachedPreference("pending");
  await store.addPendingMutationWithCachedRecord(mutation, originalCache);
  rawStore(factory, "pending_mutations").set(
    "58888888-8888-4888-8888-888888888888",
    {
      ...createMutation(),
      operationId: "58888888-8888-4888-8888-888888888888",
      status: "not_a_status",
    },
  );

  const write = store.putPendingMutation(
    conflictMutation(mutation),
    cachedPreference("conflict"),
  );

  await expect(write).rejects.toThrow();
  expect(await store.getPendingMutation(operationId)).toEqual(mutation);
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    originalCache,
  );
});

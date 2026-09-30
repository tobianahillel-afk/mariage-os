import { expect, it } from "vitest";

import type { PendingMutationEnvelope } from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
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

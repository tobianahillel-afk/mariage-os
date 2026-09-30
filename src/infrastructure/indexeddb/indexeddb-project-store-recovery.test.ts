import { expect, it } from "vitest";

import {
  IndexedDbProjectStore,
  IndexedDbProjectStoreFactory,
} from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
  databaseName,
  entityId,
  operationId,
  scope,
  rawStore,
} from "../../../tests/support/indexeddb-project-store-test-support";

it("retains pending mutation across store close and reopen", async () => {
  const factory = new FakeFactory();
  const first = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  await first.addPendingMutation(mutation);
  first.close();

  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );

  expect(await reopened.getPendingMutation(operationId)).toEqual(mutation);
  expect(await reopened.listPendingMutations()).toEqual([mutation]);
});

it("refuses foreign mutation scope and duplicate operation ids", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();

  await expect(
    store.addPendingMutation({ ...mutation, projectId: operationId }),
  ).rejects.toThrow("another local scope");
  await expect(
    store.addPendingMutation({ ...mutation, userId: operationId }),
  ).rejects.toThrow("another local scope");
  await expect(
    store.addPendingMutation({ ...mutation, deviceId: operationId }),
  ).rejects.toThrow("another local scope");

  await store.addPendingMutation(mutation);
  await expect(store.addPendingMutation(mutation)).rejects.toThrow(
    "pending_mutations request",
  );
});

it("fails closed when persisted pending scope is corrupted", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  rawStore(factory, "pending_mutations").set(operationId, {
    ...mutation,
    userId: entityId,
  });

  await expect(store.getPendingMutation(operationId)).rejects.toThrow(
    "another local scope",
  );
  await expect(store.listPendingMutations()).rejects.toThrow(
    "another local scope",
  );
  await expect(store.removePendingMutation(operationId)).rejects.toThrow(
    "another local scope",
  );
});

it.each([
  ["open", "open"],
  ["request", "metadata request"],
  ["transaction_error", "metadata transaction"],
  ["transaction_abort", "metadata transaction"],
] as const)("surfaces %s failures", async (failure, message) => {
  const factory = new FakeFactory();
  factory.state.failure = failure;

  await expect(
    IndexedDbProjectStore.open(factory as unknown as IDBFactory, scope, "1"),
  ).rejects.toThrow(message);
});

it("closes the database and factory port opens a scoped store", async () => {
  const factory = new FakeFactory();
  const port = new IndexedDbProjectStoreFactory(
    factory as unknown as IDBFactory,
  );
  const store = await port.open(scope, "1");
  store.close();
  expect(factory.rawDatabase(databaseName).closed).toBe(true);
});

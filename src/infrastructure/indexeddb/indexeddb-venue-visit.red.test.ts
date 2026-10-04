import { expect, it } from "vitest";
import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

it("WP-2.12 RED — upgrades the local project schema to v2", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );

  expect((await store.getMetadata()).localSchemaVersion).toBe(2);
});

it("WP-2.12 RED — creates a durable offline_pins store", async () => {
  const factory = new FakeFactory();
  await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );

  expect(() => rawStore(factory, "offline_pins")).not.toThrow();
});

it("WP-2.12 RED — creates a durable local_binaries store", async () => {
  const factory = new FakeFactory();
  await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );

  expect(() => rawStore(factory, "local_binaries")).not.toThrow();
});

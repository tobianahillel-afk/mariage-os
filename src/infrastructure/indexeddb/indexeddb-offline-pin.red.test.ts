import { expect, it } from "vitest";

import type { CachedRecordEnvelope } from "@application/local-data/local-records";
import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  entityId,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

interface ExpectedOfflinePinApi {
  putOfflinePinWithCachedRecord(
    pin: unknown,
    record: CachedRecordEnvelope,
  ): Promise<void>;
  getOfflinePin(
    entityType: string,
    entityId: string,
  ): Promise<unknown | null>;
}

async function api(): Promise<ExpectedOfflinePinApi> {
  const store = await IndexedDbProjectStore.open(
    new FakeFactory() as unknown as IDBFactory,
    scope,
    "2.12-red-pin",
  );
  return store as unknown as ExpectedOfflinePinApi;
}

it("does not yet expose atomic offline-pin plus cached-package persistence", async () => {
  const store = await api();

  expect(typeof store.putOfflinePinWithCachedRecord).toBe("function");
});

it("does not yet expose scoped offline-pin reads", async () => {
  const store = await api();

  expect(typeof store.getOfflinePin).toBe("function");
  expect(entityId).toMatch(/^[0-9a-f-]+$/);
});

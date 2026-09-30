import { describe, expect, it } from "vitest";

import {
  createCachedRecordEnvelope,
  createPendingMutationEnvelope,
} from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  entityId,
  missingOperationId,
  operationId,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const otherEntityId = "47777777-7777-4777-8777-777777777777";

function venueRecord(
  name: string,
  marker: "synced" | "pending" | "conflict",
  id = entityId,
) {
  return createCachedRecordEnvelope(scope, {
    recordType: "venue",
    entityId: id,
    serverRevision: "1",
    serverUpdatedAt: null,
    syncMarker: marker,
    payload: { name },
  });
}

function venueMutation(id = entityId) {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: id,
    mutationType: "update_venue_core",
    baseRevision: "1",
    payload: { name: "Local intent" },
    createdAt: "2026-09-30T15:30:00.000Z",
    priorityClass: "essential_structured",
  });
}

async function openedStore() {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  return { factory, store };
}

describe("IndexedDbProjectStore atomic cloud refresh", () => {
  it("writes a cloud snapshot when the record is refresh-safe", async () => {
    const { store } = await openedStore();
    await store.putCachedRecord(venueRecord("Old", "synced"));

    await expect(
      store.putCachedRecordIfRefreshSafe(venueRecord("Cloud", "synced")),
    ).resolves.toBe(true);
    await expect(store.getCachedRecord("venue", entityId)).resolves.toEqual(
      venueRecord("Cloud", "synced"),
    );
  });

  it.each(["pending", "conflict"] as const)(
    "preserves an existing %s working cache",
    async (marker) => {
      const { store } = await openedStore();
      const local = venueRecord("Local", marker);
      await store.putCachedRecord(local);

      await expect(
        store.putCachedRecordIfRefreshSafe(venueRecord("Cloud", "synced")),
      ).resolves.toBe(false);
      await expect(store.getCachedRecord("venue", entityId)).resolves.toEqual(
        local,
      );
    },
  );

  it("preserves cache when a same-target mutation is unresolved", async () => {
    const { store } = await openedStore();
    const local = venueRecord("Local", "pending");
    await store.addPendingMutationWithCachedRecord(venueMutation(), local);

    await expect(
      store.putCachedRecordIfRefreshSafe(venueRecord("Cloud", "synced")),
    ).resolves.toBe(false);
    await expect(store.getPendingMutation(operationId)).resolves.not.toBeNull();
    await expect(store.getCachedRecord("venue", entityId)).resolves.toEqual(
      local,
    );
  });

  it("allows refresh when unresolved work targets another Venue", async () => {
    const { store } = await openedStore();
    await store.putCachedRecord(venueRecord("Old", "synced"));
    await store.addPendingMutationWithCachedRecord(
      venueMutation(otherEntityId),
      venueRecord("Other local", "pending", otherEntityId),
    );

    await expect(
      store.putCachedRecordIfRefreshSafe(venueRecord("Cloud", "synced")),
    ).resolves.toBe(true);
    await expect(store.getCachedRecord("venue", entityId)).resolves.toEqual(
      venueRecord("Cloud", "synced"),
    );
  });

});

describe("IndexedDbProjectStore atomic cloud refresh failures", () => {
  it.each(["request", "transaction_error", "transaction_abort"] as const)(
    "fails closed on %s storage failure",
    async (failure) => {
      const { factory, store } = await openedStore();
      const local = venueRecord("Local", "synced");
      await store.putCachedRecord(local);
      factory.state.failure = failure;

      await expect(
        store.putCachedRecordIfRefreshSafe(venueRecord("Cloud", "synced")),
      ).rejects.toThrow("cloud refresh transaction");
      await expect(store.getCachedRecord("venue", entityId)).resolves.toEqual(
        local,
      );
    },
  );

  it.each([
    ["foreign", { projectId: missingOperationId }],
    ["malformed", { status: "not_a_status" }],
  ] as const)(
    "fails closed on a %s queued row without overwriting cache",
    async (_kind, corruption) => {
      const { factory, store } = await openedStore();
      const local = venueRecord("Local", "synced");
      await store.putCachedRecord(local);
      rawStore(factory, "pending_mutations").set(operationId, {
        ...venueMutation(),
        ...corruption,
      });

      await expect(
        store.putCachedRecordIfRefreshSafe(venueRecord("Cloud", "synced")),
      ).rejects.toThrow();
      await expect(store.getCachedRecord("venue", entityId)).resolves.toEqual(
        local,
      );
    },
  );
});

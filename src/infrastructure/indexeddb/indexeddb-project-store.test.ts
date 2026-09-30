import { expect, it } from "vitest";

import { createCachedRecordEnvelope } from "@application/local-data/local-records";

import {
  IndexedDbProjectStore,
  IndexedDbProjectStoreFactory,
} from "./indexeddb-project-store";
import {
  FakeFactory,
  createMutation,
  databaseName,
  deviceId,
  entityId,
  missingFixture,
  missingOperationId,
  operationId,
  projectId,
  rawStore,
  scope,
  userId,
} from "../../../tests/support/indexeddb-project-store-test-support";

it("creates schema metadata and keeps it stable on the same app version", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1.0.0",
  );

  expect(await store.getMetadata()).toEqual({
    key: "scope",
    localSchemaVersion: 1,
    appVersionLastOpened: "1.0.0",
    projectId,
    userId,
    deviceId,
    lastSuccessfulSyncAt: null,
    backendSchemaVersionLastSeen: null,
    serviceWorkerBuildLastSeen: null,
  });

  factory.forceUpgrade = true;
  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1.0.0",
  );
  expect(await reopened.getMetadata()).toEqual(await store.getMetadata());
});

it("updates app-version metadata on reopen", async () => {
  const factory = new FakeFactory();
  await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2",
  );
  expect((await store.getMetadata()).appVersionLastOpened).toBe("2");
});

it.each([
  ["localSchemaVersion", 2],
  ["projectId", "99999999-9999-4999-8999-999999999999"],
  ["userId", "99999999-9999-4999-8999-999999999999"],
  ["deviceId", "99999999-9999-4999-8999-999999999999"],
] as const)("rejects inconsistent %s metadata", async (field, value) => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const rows = rawStore(factory, "metadata");
  const metadata = rows.get("scope") ?? missingFixture();
  rows.set("scope", { ...metadata, [field]: value });

  await expect(store.getMetadata()).rejects.toThrow("scope metadata");
});

it("rejects missing metadata", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  rawStore(factory, "metadata").delete("scope");
  await expect(store.getMetadata()).rejects.toThrow("metadata is missing");
});

it("persists and reads scoped cached records", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const record = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "rev-1",
    serverUpdatedAt: "2026-09-04T14:00:00.000Z",
    syncMarker: "synced",
    payload: { density: "compact" },
  });

  const venueRecord = createCachedRecordEnvelope(scope, {
    recordType: "venue",
    entityId,
    serverRevision: "2",
    serverUpdatedAt: "2026-09-04T14:00:00.000Z",
    syncMarker: "synced",
    payload: { name: "Venue Alpha" },
  });

  await store.putCachedRecord(record);
  await store.putCachedRecord(venueRecord);
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    record,
  );
  expect(
    await store.getCachedRecord("project_preferences", operationId),
  ).toBeNull();
  expect(await store.listCachedRecords("project_preferences")).toEqual([
    record,
  ]);
  expect(await store.listCachedRecords("venue")).toEqual([venueRecord]);
});

it("rejects cached records from another project on write and read", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const record = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: null,
  });
  const foreign = { ...record, projectId: operationId };

  await expect(store.putCachedRecord(foreign)).rejects.toThrow(
    "another project",
  );
  rawStore(factory, "cached_records").set(record.key, foreign);
  await expect(
    store.getCachedRecord("project_preferences", entityId),
  ).rejects.toThrow("another project");
});

it("persists pending operations once and exposes counters", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();

  for (const [suffix, status] of [
    ["5", "pending"],
    ["6", "sending"],
    ["7", "conflict"],
    ["8", "failed_retryable"],
    ["9", "failed_permanent"],
  ] as const) {
    await store.addPendingMutation({
      ...mutation,
      operationId: `55555555-5555-4555-8555-55555555555${suffix}`,
      status,
    });
  }

  expect(await store.readSyncCounters()).toEqual({
    pendingCount: 2,
    conflictCount: 1,
    retryableFailureCount: 1,
    permanentFailureCount: 1,
  });
  expect((await store.listPendingMutations()).length).toBe(5);
  expect(await store.getPendingMutation(operationId)).toEqual(mutation);
  expect(await store.getPendingMutation(missingOperationId)).toBeNull();

  const sending = {
    ...mutation,
    attemptCount: 1,
    lastAttemptAt: "2026-09-04T14:01:00.000Z",
    status: "sending" as const,
  };
  await store.putPendingMutation(sending);
  expect(await store.getPendingMutation(operationId)).toEqual(sending);

  await store.removePendingMutation(operationId);
  expect(await store.getPendingMutation(operationId)).toBeNull();
  await expect(
    store.removePendingMutation(operationId),
  ).resolves.toBeUndefined();
});

it("atomically stores a pending mutation with its working cache", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  const record = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "rev-1",
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: { density: "compact" },
  });

  await store.addPendingMutationWithCachedRecord(mutation, record);

  expect(await store.getPendingMutation(operationId)).toEqual(mutation);
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    record,
  );
});

it.each(["request", "transaction_error", "transaction_abort"] as const)(
  "rolls back atomic pending/cache durability on %s failure",
  async (failure) => {
    const factory = new FakeFactory();
    const store = await IndexedDbProjectStore.open(
      factory as unknown as IDBFactory,
      scope,
      "1",
    );
    const mutation = createMutation();
    const record = createCachedRecordEnvelope(scope, {
      recordType: "project_preferences",
      entityId,
      serverRevision: "rev-1",
      serverUpdatedAt: null,
      syncMarker: "pending",
      payload: { density: "compact" },
    });
    factory.state.failure = failure;

    await expect(
      store.addPendingMutationWithCachedRecord(mutation, record),
    ).rejects.toThrow();

    expect(rawStore(factory, "pending_mutations").size).toBe(0);
    expect(rawStore(factory, "cached_records").size).toBe(0);
  },
);

it("atomically settles a pending mutation with its acknowledged cache", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  const pendingRecord = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "rev-1",
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: { density: "compact" },
  });
  const syncedRecord = {
    ...pendingRecord,
    syncMarker: "synced" as const,
    serverRevision: "rev-2",
  };
  await store.addPendingMutationWithCachedRecord(mutation, pendingRecord);

  await store.settlePendingMutationWithCachedRecord(operationId, syncedRecord);

  expect(await store.getPendingMutation(operationId)).toBeNull();
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    syncedRecord,
  );
});

it.each(["request", "transaction_error", "transaction_abort"] as const)(
  "rolls back atomic acknowledgement settlement on %s failure",
  async (failure) => {
    const factory = new FakeFactory();
    const store = await IndexedDbProjectStore.open(
      factory as unknown as IDBFactory,
      scope,
      "1",
    );
    const mutation = createMutation();
    const pendingRecord = createCachedRecordEnvelope(scope, {
      recordType: "project_preferences",
      entityId,
      serverRevision: "rev-1",
      serverUpdatedAt: null,
      syncMarker: "pending",
      payload: { density: "compact" },
    });
    const syncedRecord = {
      ...pendingRecord,
      syncMarker: "synced" as const,
      serverRevision: "rev-2",
    };
    await store.addPendingMutationWithCachedRecord(mutation, pendingRecord);
    factory.state.failure = failure;

    await expect(
      store.settlePendingMutationWithCachedRecord(operationId, syncedRecord),
    ).rejects.toThrow();

    expect(await store.getPendingMutation(operationId)).toEqual(mutation);
    expect(
      await store.getCachedRecord("project_preferences", entityId),
    ).toEqual(pendingRecord);
  },
);

it("rejects acknowledgement settlement for a different cached target", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "1",
  );
  const mutation = createMutation();
  const pendingRecord = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "rev-1",
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: { density: "compact" },
  });
  const wrongRecord = createCachedRecordEnvelope(scope, {
    recordType: "venue",
    entityId,
    serverRevision: "2",
    serverUpdatedAt: null,
    syncMarker: "synced",
    payload: { name: "Wrong target" },
  });
  await store.addPendingMutationWithCachedRecord(mutation, pendingRecord);

  await expect(
    store.settlePendingMutationWithCachedRecord(operationId, wrongRecord),
  ).rejects.toThrow("target does not match");

  expect(await store.getPendingMutation(operationId)).toEqual(mutation);
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    pendingRecord,
  );
  expect(await store.getCachedRecord("venue", entityId)).toBeNull();
});

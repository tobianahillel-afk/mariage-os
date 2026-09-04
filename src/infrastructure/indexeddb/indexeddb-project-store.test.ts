import { expect, it } from "vitest";

import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createCachedRecordEnvelope,
  createPendingMutationEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";

import {
  IndexedDbProjectStore,
  IndexedDbProjectStoreFactory,
} from "./indexeddb-project-store";

type Row = Record<string, unknown>;
type FailureMode =
  "none" | "open" | "request" | "transaction_error" | "transaction_abort";

function missingFixture(): never {
  throw new Error("IndexedDB test fixture is missing.");
}

class FakeRequest<T> {
  result!: T;
  onupgradeneeded: (() => void) | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class FakeDatabase {
  readonly stores = new Map<
    string,
    { keyPath: string; rows: Map<string, Row> }
  >();
  closed = false;

  readonly objectStoreNames = {
    contains: (name: string): boolean => this.stores.has(name),
  };

  constructor(private readonly state: FakeFactoryState) {}

  createObjectStore(
    name: string,
    options: IDBObjectStoreParameters,
  ): IDBObjectStore {
    this.stores.set(name, {
      keyPath: String(options.keyPath),
      rows: new Map(),
    });
    return {} as IDBObjectStore;
  }

  transaction(storeName: string): IDBTransaction {
    const store = this.stores.get(storeName) ?? missingFixture();
    return new FakeTransaction(store, this.state) as unknown as IDBTransaction;
  }

  close(): void {
    this.closed = true;
  }
}

class FakeTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor(
    private readonly store: { keyPath: string; rows: Map<string, Row> },
    private readonly state: FakeFactoryState,
  ) {}

  objectStore(): IDBObjectStore {
    return new FakeObjectStore(
      this.store,
      this,
      this.state,
    ) as unknown as IDBObjectStore;
  }

  finish(): void {
    const mode = this.state.consumeFailure();
    queueMicrotask(() => {
      if (mode === "transaction_error") {
        this.onerror?.();
      } else if (mode === "transaction_abort") {
        this.onabort?.();
      } else {
        this.oncomplete?.();
      }
    });
  }
}

class FakeObjectStore {
  constructor(
    private readonly store: { keyPath: string; rows: Map<string, Row> },
    private readonly transaction: FakeTransaction,
    private readonly state: FakeFactoryState,
  ) {}

  private keyFor(value: Row): string {
    return String(value[this.store.keyPath]);
  }

  private request<T>(result: T, mutate?: () => void): IDBRequest<T> {
    const request = new FakeRequest<T>();
    queueMicrotask(() => {
      if (this.state.failure === "request") {
        this.state.consumeFailure();
        request.onerror?.();
        return;
      }
      mutate?.();
      request.result = result;
      request.onsuccess?.();
      this.transaction.finish();
    });
    return request as unknown as IDBRequest<T>;
  }

  get(key: IDBValidKey): IDBRequest<unknown> {
    return this.request(
      this.store.rows.get(String(key)),
    ) as unknown as IDBRequest<unknown>;
  }

  getAll(): IDBRequest<unknown[]> {
    return this.request([...this.store.rows.values()]) as unknown as IDBRequest<
      unknown[]
    >;
  }

  put(value: unknown): IDBRequest<IDBValidKey> {
    const row = value as Row;
    const key = this.keyFor(row);
    return this.request<IDBValidKey>(key, () => this.store.rows.set(key, row));
  }

  add(value: unknown): IDBRequest<IDBValidKey> {
    const row = value as Row;
    const key = this.keyFor(row);
    if (this.store.rows.has(key)) {
      return this.requestFailure<IDBValidKey>();
    }
    return this.request<IDBValidKey>(key, () => this.store.rows.set(key, row));
  }

  private requestFailure<T>(): IDBRequest<T> {
    const request = new FakeRequest<T>();
    queueMicrotask(() => request.onerror?.());
    return request as unknown as IDBRequest<T>;
  }
}

class FakeFactoryState {
  failure: FailureMode = "none";

  consumeFailure(): FailureMode {
    const failure = this.failure;
    this.failure = "none";
    return failure;
  }
}

class FakeFactory {
  readonly state = new FakeFactoryState();
  readonly databases = new Map<string, FakeDatabase>();
  forceUpgrade = false;

  open(name: string): IDBOpenDBRequest {
    const request = new FakeRequest<IDBDatabase>();
    queueMicrotask(() => {
      if (this.state.failure === "open") {
        this.state.consumeFailure();
        request.onerror?.();
        return;
      }
      const existing = this.databases.get(name);
      const database = existing ?? new FakeDatabase(this.state);
      this.databases.set(name, database);
      request.result = database as unknown as IDBDatabase;
      if (existing === undefined || this.forceUpgrade) {
        request.onupgradeneeded?.();
      }
      request.onsuccess?.();
    });
    return request as unknown as IDBOpenDBRequest;
  }

  rawDatabase(name: string): FakeDatabase {
    return this.databases.get(name) ?? missingFixture();
  }
}

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const deviceId = "33333333-3333-4333-8333-333333333333";
const entityId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";
const missingOperationId = "59999999-9999-4999-8999-999999999999";
const scope = createLocalProjectScope(userId, projectId, deviceId);
const databaseName = `mariage-os:project:${userId}:${projectId}`;

function createMutation(): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "project_preferences",
    entityId,
    mutationType: "update_preferences",
    baseRevision: "rev-1",
    payload: { density: "compact" },
    createdAt: "2026-09-04T14:00:00.000Z",
    priorityClass: "metadata",
  });
}

function rawStore(factory: FakeFactory, name: string): Map<string, Row> {
  const store = factory.rawDatabase(databaseName).stores.get(name);
  return (store ?? missingFixture()).rows;
}

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

  await store.putCachedRecord(record);
  expect(await store.getCachedRecord("project_preferences", entityId)).toEqual(
    record,
  );
  expect(
    await store.getCachedRecord("project_preferences", operationId),
  ).toBeNull();
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

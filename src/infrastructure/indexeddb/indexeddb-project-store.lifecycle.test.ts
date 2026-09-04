import { expect, it } from "vitest";

import { createLocalProjectScope } from "@application/local-data/local-project-scope";

import { IndexedDbProjectStore } from "./indexeddb-project-store";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);

class OpenRequest<T> {
  result!: T;
  onupgradeneeded: (() => void) | null = null;
  onblocked: (() => void) | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class MetadataRequest<T> {
  result!: T;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class MetadataTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor(private readonly metadata: unknown) {}

  objectStore(): IDBObjectStore {
    return {
      get: () => {
        const request = new MetadataRequest<unknown>();
        queueMicrotask(() => {
          request.result = this.metadata;
          request.onsuccess?.();
          this.oncomplete?.();
        });
        return request as unknown as IDBRequest<unknown>;
      },
    } as unknown as IDBObjectStore;
  }
}

class LifecycleDatabase {
  closed = false;
  onversionchange: (() => void) | null = null;
  readonly objectStoreNames = { contains: () => true };

  transaction(): IDBTransaction {
    return new MetadataTransaction({
      key: "scope",
      localSchemaVersion: 1,
      appVersionLastOpened: "1",
      projectId: scope.projectId,
      userId: scope.userId,
      deviceId: scope.deviceId,
      lastSuccessfulSyncAt: null,
      backendSchemaVersionLastSeen: null,
      serviceWorkerBuildLastSeen: null,
    }) as unknown as IDBTransaction;
  }

  close(): void {
    this.closed = true;
  }
}

function blockedFactory(database: LifecycleDatabase): IDBFactory {
  return {
    open: () => {
      const request = new OpenRequest<IDBDatabase>();
      queueMicrotask(() => {
        request.onblocked?.();
        request.result = database as unknown as IDBDatabase;
        request.onsuccess?.();
      });
      return request as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}

function successfulFactory(database: LifecycleDatabase): IDBFactory {
  return {
    open: () => {
      const request = new OpenRequest<IDBDatabase>();
      queueMicrotask(() => {
        request.result = database as unknown as IDBDatabase;
        request.onsuccess?.();
      });
      return request as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}

it("rejects a blocked open and closes a late successful connection", async () => {
  const database = new LifecycleDatabase();
  await expect(IndexedDbProjectStore.open(blockedFactory(database), scope, "1"))
    .rejects.toThrow("open blocked");
  await new Promise((resolve) => queueMicrotask(resolve));
  expect(database.closed).toBe(true);
});

it("closes an open connection when another version requests an upgrade", async () => {
  const database = new LifecycleDatabase();
  const store = await IndexedDbProjectStore.open(
    successfulFactory(database),
    scope,
    "1",
  );
  expect(database.onversionchange).not.toBeNull();
  database.onversionchange?.();
  expect(database.closed).toBe(true);
  store.close();
});

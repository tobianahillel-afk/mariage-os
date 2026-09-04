import type {
  LocalProjectMetadata,
  LocalProjectStore,
  LocalProjectStoreFactory,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";
import {
  localProjectDatabaseName,
  type LocalProjectScope,
} from "@application/local-data/local-project-scope";
import type {
  CachedRecordEnvelope,
  PendingMutationEnvelope,
} from "@application/local-data/local-records";

const LOCAL_SCHEMA_VERSION = 1;
const METADATA_STORE = "metadata";
const CACHE_STORE = "cached_records";
const MUTATION_STORE = "pending_mutations";

function storageError(action: string): Error {
  return new Error(`Local IndexedDB ${action} failed.`);
}

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, LOCAL_SCHEMA_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(METADATA_STORE)) {
        database.createObjectStore(METADATA_STORE, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        database.createObjectStore(CACHE_STORE, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(MUTATION_STORE)) {
        database.createObjectStore(MUTATION_STORE, { keyPath: "operationId" });
      }
    };
    request.onerror = () => reject(storageError("open"));
    request.onsuccess = () => resolve(request.result);
  });
}

function runRequest<T>(
  database: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = createRequest(transaction.objectStore(storeName));
    let result: T | undefined;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(storageError(`${storeName} request`));
    transaction.onerror = () =>
      reject(storageError(`${storeName} transaction`));
    transaction.onabort = () =>
      reject(storageError(`${storeName} transaction`));
    transaction.oncomplete = () => resolve(result as T);
  });
}

function createMetadata(
  scope: LocalProjectScope,
  appVersion: string,
): LocalProjectMetadata {
  return {
    key: "scope",
    localSchemaVersion: LOCAL_SCHEMA_VERSION,
    appVersionLastOpened: appVersion,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    lastSuccessfulSyncAt: null,
    backendSchemaVersionLastSeen: null,
    serviceWorkerBuildLastSeen: null,
  };
}

function assertScopeMetadata(
  value: LocalProjectMetadata,
  scope: LocalProjectScope,
): void {
  if (
    value.localSchemaVersion !== LOCAL_SCHEMA_VERSION ||
    value.projectId !== scope.projectId ||
    value.userId !== scope.userId ||
    value.deviceId !== scope.deviceId
  ) {
    throw new Error("Local IndexedDB scope metadata is inconsistent.");
  }
}

function assertCachedRecordScope(
  record: CachedRecordEnvelope,
  scope: LocalProjectScope,
): void {
  if (record.projectId !== scope.projectId) {
    throw new Error("Cached record belongs to another project scope.");
  }
}

function assertMutationScope(
  mutation: PendingMutationEnvelope,
  scope: LocalProjectScope,
): void {
  if (
    mutation.projectId !== scope.projectId ||
    mutation.userId !== scope.userId ||
    mutation.deviceId !== scope.deviceId
  ) {
    throw new Error("Pending mutation belongs to another local scope.");
  }
}

export class IndexedDbProjectStore implements LocalProjectStore {
  private constructor(
    private readonly database: IDBDatabase,
    readonly scope: LocalProjectScope,
  ) {}

  static async open(
    factory: IDBFactory,
    scope: LocalProjectScope,
    appVersion: string,
  ): Promise<IndexedDbProjectStore> {
    const database = await openDatabase(
      factory,
      localProjectDatabaseName(scope),
    );
    const store = new IndexedDbProjectStore(database, scope);
    await store.initializeMetadata(appVersion);
    return store;
  }

  private async initializeMetadata(appVersion: string): Promise<void> {
    const existing = await runRequest<LocalProjectMetadata | undefined>(
      this.database,
      METADATA_STORE,
      "readonly",
      (store) => store.get("scope"),
    );

    if (existing !== undefined) {
      assertScopeMetadata(existing, this.scope);
    }

    if (
      existing === undefined ||
      existing.appVersionLastOpened !== appVersion
    ) {
      const metadata = {
        ...(existing ?? createMetadata(this.scope, appVersion)),
        appVersionLastOpened: appVersion,
      };
      await runRequest<IDBValidKey>(
        this.database,
        METADATA_STORE,
        "readwrite",
        (store) => store.put(metadata),
      );
    }
  }

  async getMetadata(): Promise<LocalProjectMetadata> {
    const metadata = await runRequest<LocalProjectMetadata | undefined>(
      this.database,
      METADATA_STORE,
      "readonly",
      (store) => store.get("scope"),
    );
    if (metadata === undefined) {
      throw new Error("Local IndexedDB scope metadata is missing.");
    }
    assertScopeMetadata(metadata, this.scope);
    return metadata;
  }

  async putCachedRecord(record: CachedRecordEnvelope): Promise<void> {
    assertCachedRecordScope(record, this.scope);
    await runRequest<IDBValidKey>(
      this.database,
      CACHE_STORE,
      "readwrite",
      (store) => store.put(record),
    );
  }

  async getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null> {
    const record = await runRequest<CachedRecordEnvelope | undefined>(
      this.database,
      CACHE_STORE,
      "readonly",
      (store) => store.get(`${recordType}:${entityId}`),
    );
    if (record === undefined) {
      return null;
    }
    assertCachedRecordScope(record, this.scope);
    return record;
  }

  async addPendingMutation(mutation: PendingMutationEnvelope): Promise<void> {
    assertMutationScope(mutation, this.scope);
    await runRequest<IDBValidKey>(
      this.database,
      MUTATION_STORE,
      "readwrite",
      (store) => store.add(mutation),
    );
  }

  async getPendingMutation(
    operationId: string,
  ): Promise<PendingMutationEnvelope | null> {
    const mutation = await runRequest<PendingMutationEnvelope | undefined>(
      this.database,
      MUTATION_STORE,
      "readonly",
      (store) => store.get(operationId),
    );
    if (mutation === undefined) {
      return null;
    }
    assertMutationScope(mutation, this.scope);
    return mutation;
  }

  async listPendingMutations(): Promise<readonly PendingMutationEnvelope[]> {
    const mutations = await runRequest<PendingMutationEnvelope[]>(
      this.database,
      MUTATION_STORE,
      "readonly",
      (store) => store.getAll(),
    );
    for (const mutation of mutations) {
      assertMutationScope(mutation, this.scope);
    }
    return mutations;
  }

  async readSyncCounters(): Promise<LocalSyncCounters> {
    const counters: LocalSyncCounters = {
      pendingCount: 0,
      conflictCount: 0,
      retryableFailureCount: 0,
      permanentFailureCount: 0,
    };
    const mutable = { ...counters };

    for (const mutation of await this.listPendingMutations()) {
      if (mutation.status === "conflict") {
        mutable.conflictCount += 1;
      } else if (mutation.status === "failed_retryable") {
        mutable.retryableFailureCount += 1;
      } else if (mutation.status === "failed_permanent") {
        mutable.permanentFailureCount += 1;
      } else {
        mutable.pendingCount += 1;
      }
    }
    return mutable;
  }

  close(): void {
    this.database.close();
  }
}

export class IndexedDbProjectStoreFactory implements LocalProjectStoreFactory {
  constructor(private readonly factory: IDBFactory) {}

  open(
    scope: LocalProjectScope,
    appVersion: string,
  ): Promise<LocalProjectStore> {
    return IndexedDbProjectStore.open(this.factory, scope, appVersion);
  }
}

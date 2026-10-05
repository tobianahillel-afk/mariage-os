import {
  assertLocalBinaryScope,
  parseLocalBinaryMetadata,
} from "@application/local-data/local-binary-record";
import type { LocalOfflinePin } from "@application/local-data/local-offline-pin";
import type { LocalProjectPurgePort } from "@application/local-data/local-project-purge-port";
import {
  parseCachedRecordEnvelope,
  parseLocalProjectMetadata,
  parsePendingMutationEnvelope,
} from "@application/local-data/persisted-local-data-parser";
import type {
  LocalOfflinePinStore,
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
import {
  assertCachedRecordScope,
  assertMutationScope,
  assertMutationTarget,
  shouldWriteCloudRefreshCache,
  shouldWriteMutationCache,
  validatePendingMutationUpdate,
  validateSettlementMutation,
} from "./indexeddb-project-store-validation";

import { runAtomicCloudCacheRefresh } from "./indexeddb-project-store-refresh";
import {
  getIndexedDbOfflinePin,
  putIndexedDbOfflinePinWithCachedRecord,
} from "./indexeddb-project-store-offline-pin";

import {
  CACHE_STORE,
  LOCAL_BINARY_STORE,
  LOCAL_SCHEMA_VERSION,
  METADATA_STORE,
  MUTATION_STORE,
  openDatabase,
  purgeDatabase,
  runAtomicMutationWithCache,
  runAtomicPendingMutationUpdate,
  runAtomicPendingMutationUpdateWithCache,
  runAtomicSettlementWithCache,
  runRequest,
} from "./indexeddb-project-store-io";

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

function assertScopeIdentity(
  value: LocalProjectMetadata,
  scope: LocalProjectScope,
): void {
  if (
    value.projectId !== scope.projectId ||
    value.userId !== scope.userId ||
    value.deviceId !== scope.deviceId
  ) {
    throw new Error("Local IndexedDB scope metadata is inconsistent.");
  }
}

function assertMigratableSchema(value: LocalProjectMetadata): void {
  if (
    value.localSchemaVersion < 1 ||
    value.localSchemaVersion > LOCAL_SCHEMA_VERSION
  ) {
    throw new Error("Local IndexedDB scope metadata is inconsistent.");
  }
}

function assertScopeMetadata(
  value: LocalProjectMetadata,
  scope: LocalProjectScope,
): void {
  assertScopeIdentity(value, scope);
  if (value.localSchemaVersion !== LOCAL_SCHEMA_VERSION) {
    throw new Error("Local IndexedDB scope metadata is inconsistent.");
  }
}

function countUnsyncedBinaries(
  values: readonly unknown[],
  scope: LocalProjectScope,
): number {
  let count = 0;
  for (const value of values) {
    const binary = parseLocalBinaryMetadata(value);
    assertLocalBinaryScope(binary, scope);
    if (binary.syncState === "unsynced") count += 1;
  }
  return count;
}

export class IndexedDbProjectStore
  implements LocalProjectStore, LocalOfflinePinStore
{
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
    const raw = await runRequest<unknown>(
      this.database,
      METADATA_STORE,
      "readonly",
      (store) => store.get("scope"),
    );
    const existing =
      raw === undefined ? undefined : parseLocalProjectMetadata(raw);

    if (existing !== undefined) {
      assertScopeIdentity(existing, this.scope);
      assertMigratableSchema(existing);
    }

    if (
      existing === undefined ||
      existing.localSchemaVersion !== LOCAL_SCHEMA_VERSION ||
      existing.appVersionLastOpened !== appVersion
    ) {
      const metadata = {
        ...(existing ?? createMetadata(this.scope, appVersion)),
        localSchemaVersion: LOCAL_SCHEMA_VERSION,
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
    const raw = await runRequest<unknown>(
      this.database,
      METADATA_STORE,
      "readonly",
      (store) => store.get("scope"),
    );
    if (raw === undefined) {
      throw new Error("Local IndexedDB scope metadata is missing.");
    }
    const metadata = parseLocalProjectMetadata(raw);
    assertScopeMetadata(metadata, this.scope);
    return metadata;
  }

  async putCachedRecord(record: CachedRecordEnvelope): Promise<void> {
    const parsed = parseCachedRecordEnvelope(record);
    assertCachedRecordScope(parsed, this.scope);
    await runRequest<IDBValidKey>(
      this.database,
      CACHE_STORE,
      "readwrite",
      (store) => store.put(parsed),
    );
  }

  async putCachedRecordIfRefreshSafe(
    record: CachedRecordEnvelope,
  ): Promise<boolean> {
    const parsed = parseCachedRecordEnvelope(record);
    assertCachedRecordScope(parsed, this.scope);
    return runAtomicCloudCacheRefresh(
      this.database,
      parsed,
      (currentValue, queueValues) =>
        shouldWriteCloudRefreshCache(
          currentValue,
          queueValues,
          parsed,
          this.scope,
        ),
    );
  }

  async getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null> {
    const raw = await runRequest<unknown>(
      this.database,
      CACHE_STORE,
      "readonly",
      (store) => store.get(`${recordType}:${entityId}`),
    );
    if (raw === undefined) {
      return null;
    }
    const record = parseCachedRecordEnvelope(raw);
    assertCachedRecordScope(record, this.scope);
    return record;
  }

  async listCachedRecords(
    recordType: string,
  ): Promise<readonly CachedRecordEnvelope[]> {
    const raw = await runRequest<unknown[]>(
      this.database,
      CACHE_STORE,
      "readonly",
      (store) => store.getAll(),
    );
    return raw.flatMap((value) => {
      const record = parseCachedRecordEnvelope(value);
      assertCachedRecordScope(record, this.scope);
      return record.recordType === recordType ? [record] : [];
    });
  }

  putOfflinePinWithCachedRecord(
    pin: LocalOfflinePin,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    return putIndexedDbOfflinePinWithCachedRecord(
      this.database,
      this.scope,
      pin,
      record,
    );
  }

  getOfflinePin(
    entityType: string,
    entityId: string,
  ): Promise<LocalOfflinePin | null> {
    return getIndexedDbOfflinePin(
      this.database,
      this.scope,
      entityType,
      entityId,
    );
  }

  async addPendingMutation(mutation: PendingMutationEnvelope): Promise<void> {
    const parsed = parsePendingMutationEnvelope(mutation);
    assertMutationScope(parsed, this.scope);
    await runRequest<IDBValidKey>(
      this.database,
      MUTATION_STORE,
      "readwrite",
      (store) => store.add(parsed),
    );
  }

  async addPendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    const parsedMutation = parsePendingMutationEnvelope(mutation);
    const parsedRecord = parseCachedRecordEnvelope(record);
    assertMutationScope(parsedMutation, this.scope);
    assertCachedRecordScope(parsedRecord, this.scope);
    assertMutationTarget(parsedMutation, parsedRecord);
    await runAtomicMutationWithCache(
      this.database,
      parsedMutation,
      parsedRecord,
    );
  }

  async putPendingMutation(
    mutation: PendingMutationEnvelope,
    record?: CachedRecordEnvelope,
  ): Promise<void> {
    const parsed = parsePendingMutationEnvelope(mutation);
    assertMutationScope(parsed, this.scope);
    const validate = (value: unknown): void =>
      validatePendingMutationUpdate(value, parsed, this.scope);
    if (record === undefined) {
      await runAtomicPendingMutationUpdate(this.database, parsed, validate);
      return;
    }

    const parsedRecord = parseCachedRecordEnvelope(record);
    assertCachedRecordScope(parsedRecord, this.scope);
    assertMutationTarget(parsed, parsedRecord);
    await runAtomicPendingMutationUpdateWithCache(
      this.database,
      parsed,
      parsedRecord,
      {
        validateCurrent: validate,
        shouldWriteCache: (values) =>
          shouldWriteMutationCache(
            values,
            parsed.operationId,
            parsedRecord,
            this.scope,
          ),
      },
    );
  }

  async settlePendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    const expected = parsePendingMutationEnvelope(mutation);
    const parsedRecord = parseCachedRecordEnvelope(record);
    assertMutationScope(expected, this.scope);
    assertCachedRecordScope(parsedRecord, this.scope);
    await runAtomicSettlementWithCache(
      this.database,
      expected.operationId,
      parsedRecord,
      {
        validateMutation: (value) =>
          validateSettlementMutation(value, expected, parsedRecord, this.scope),
        shouldWriteCache: (values) =>
          shouldWriteMutationCache(
            values,
            expected.operationId,
            parsedRecord,
            this.scope,
          ),
      },
    );
  }

  async removePendingMutation(operationId: string): Promise<void> {
    const existing = await this.getPendingMutation(operationId);
    if (existing === null) return;
    await runRequest<undefined>(
      this.database,
      MUTATION_STORE,
      "readwrite",
      (store) => store.delete(operationId),
    );
  }

  async getPendingMutation(
    operationId: string,
  ): Promise<PendingMutationEnvelope | null> {
    const raw = await runRequest<unknown>(
      this.database,
      MUTATION_STORE,
      "readonly",
      (store) => store.get(operationId),
    );
    if (raw === undefined) {
      return null;
    }
    const mutation = parsePendingMutationEnvelope(raw);
    assertMutationScope(mutation, this.scope);
    return mutation;
  }

  async listPendingMutations(): Promise<readonly PendingMutationEnvelope[]> {
    const raw = await runRequest<unknown[]>(
      this.database,
      MUTATION_STORE,
      "readonly",
      (store) => store.getAll(),
    );
    return raw.map((value) => {
      const mutation = parsePendingMutationEnvelope(value);
      assertMutationScope(mutation, this.scope);
      return mutation;
    });
  }

  async readSyncCounters(): Promise<LocalSyncCounters> {
    const binaries = await runRequest<unknown[]>(
      this.database,
      LOCAL_BINARY_STORE,
      "readonly",
      (binaryStore) => binaryStore.getAll(),
    );
    const counters: LocalSyncCounters = {
      pendingCount: 0,
      conflictCount: 0,
      retryableFailureCount: 0,
      permanentFailureCount: 0,
      unsyncedBinaryCount: countUnsyncedBinaries(binaries, this.scope),
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

export class IndexedDbProjectStoreFactory
  implements LocalProjectStoreFactory, LocalProjectPurgePort
{
  constructor(private readonly factory: IDBFactory) {}

  open(
    scope: LocalProjectScope,
    appVersion: string,
  ): Promise<LocalProjectStore> {
    return IndexedDbProjectStore.open(this.factory, scope, appVersion);
  }

  purge(scope: LocalProjectScope): Promise<void> {
    return purgeDatabase(this.factory, localProjectDatabaseName(scope));
  }
}

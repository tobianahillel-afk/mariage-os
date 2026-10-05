import type { LocalOfflinePin } from "@application/local-data/local-offline-pin";
import type {
  CachedRecordEnvelope,
  PendingMutationEnvelope,
} from "@application/local-data/local-records";

export const LOCAL_SCHEMA_VERSION = 2;
export const METADATA_STORE = "metadata";
export const CACHE_STORE = "cached_records";
export const MUTATION_STORE = "pending_mutations";
export const OFFLINE_PIN_STORE = "offline_pins";
export const LOCAL_BINARY_STORE = "local_binaries";

function storageError(action: string): Error {
  return new Error(`Local IndexedDB ${action} failed.`);
}

function createSchema(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(METADATA_STORE)) {
    database.createObjectStore(METADATA_STORE, { keyPath: "key" });
  }
  if (!database.objectStoreNames.contains(CACHE_STORE)) {
    database.createObjectStore(CACHE_STORE, { keyPath: "key" });
  }
  if (!database.objectStoreNames.contains(MUTATION_STORE)) {
    database.createObjectStore(MUTATION_STORE, { keyPath: "operationId" });
  }
  if (!database.objectStoreNames.contains(OFFLINE_PIN_STORE)) {
    database.createObjectStore(OFFLINE_PIN_STORE, { keyPath: "key" });
  }
  if (!database.objectStoreNames.contains(LOCAL_BINARY_STORE)) {
    database.createObjectStore(LOCAL_BINARY_STORE, {
      keyPath: "localBinaryId",
    });
  }
}

export function openDatabase(
  factory: IDBFactory,
  name: string,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, LOCAL_SCHEMA_VERSION);
    let settled = false;
    const fail = (action: string): void => {
      settled = true;
      reject(storageError(action));
    };

    request.onupgradeneeded = () => createSchema(request.result);
    request.onblocked = () => fail("open blocked");
    request.onerror = () => fail("open");
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      if (settled) {
        database.close();
        return;
      }
      settled = true;
      resolve(database);
    };
  });
}

export function purgeDatabase(
  factory: IDBFactory,
  name: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.deleteDatabase(name);
    request.onblocked = () => reject(storageError("purge blocked"));
    request.onerror = () => reject(storageError("purge"));
    request.onsuccess = () => resolve();
  });
}

export function runRequest<T>(
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

export function runAtomicPendingMutationUpdate(
  database: IDBDatabase,
  mutation: PendingMutationEnvelope,
  validateCurrent: (value: unknown) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(MUTATION_STORE, "readwrite");
    const mutationStore = transaction.objectStore(MUTATION_STORE);
    let validationError: unknown = null;
    const fail = (): void =>
      reject(storageError("pending mutation transaction"));
    const lookupRequest = mutationStore.get(mutation.operationId);

    lookupRequest.onerror = fail;
    lookupRequest.onsuccess = () => {
      try {
        validateCurrent(lookupRequest.result);
      } catch (error) {
        validationError = error;
        return;
      }
      const updateRequest = mutationStore.put(mutation);
      updateRequest.onerror = fail;
    };
    transaction.onerror = fail;
    transaction.onabort = fail;
    transaction.oncomplete = () => {
      if (validationError !== null) {
        reject(validationError);
        return;
      }
      resolve();
    };
  });
}

interface AtomicPendingCacheUpdateState {
  currentValue: unknown;
  queueValues: readonly unknown[];
  currentReady: boolean;
  queueReady: boolean;
  started: boolean;
  validationError: unknown;
}

interface AtomicPendingCacheUpdatePolicy {
  validateCurrent: (value: unknown) => void;
  shouldWriteCache: (values: readonly unknown[]) => boolean;
}

type AtomicPendingCacheUpdateExecution = AtomicPendingCacheUpdatePolicy & {
  mutationStore: IDBObjectStore;
  cacheStore: IDBObjectStore;
  mutation: PendingMutationEnvelope;
  record: CachedRecordEnvelope;
  fail: () => void;
};

function startAtomicPendingCacheUpdate(
  state: AtomicPendingCacheUpdateState,
  execution: AtomicPendingCacheUpdateExecution,
): void {
  if (!state.currentReady || !state.queueReady || state.started) return;
  state.started = true;
  let writeCache: boolean;
  try {
    execution.validateCurrent(state.currentValue);
    writeCache = execution.shouldWriteCache(state.queueValues);
  } catch (error) {
    state.validationError = error;
    return;
  }

  const mutationRequest = execution.mutationStore.put(execution.mutation);
  mutationRequest.onerror = execution.fail;
  if (!writeCache) return;
  const cacheRequest = execution.cacheStore.put(execution.record);
  cacheRequest.onerror = execution.fail;
}

export function runAtomicPendingMutationUpdateWithCache(
  database: IDBDatabase,
  mutation: PendingMutationEnvelope,
  record: CachedRecordEnvelope,
  policy: AtomicPendingCacheUpdatePolicy,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [MUTATION_STORE, CACHE_STORE],
      "readwrite",
    );
    const execution: AtomicPendingCacheUpdateExecution = {
      mutationStore: transaction.objectStore(MUTATION_STORE),
      cacheStore: transaction.objectStore(CACHE_STORE),
      mutation,
      record,
      ...policy,
      fail: () => reject(storageError("pending/cache update transaction")),
    };
    const state: AtomicPendingCacheUpdateState = {
      currentValue: undefined,
      queueValues: [],
      currentReady: false,
      queueReady: false,
      started: false,
      validationError: null,
    };
    const lookupRequest = execution.mutationStore.get(mutation.operationId);
    const queueRequest = execution.mutationStore.getAll();

    lookupRequest.onerror = execution.fail;
    queueRequest.onerror = execution.fail;
    lookupRequest.onsuccess = () => {
      state.currentValue = lookupRequest.result;
      state.currentReady = true;
      startAtomicPendingCacheUpdate(state, execution);
    };
    queueRequest.onsuccess = () => {
      state.queueValues = queueRequest.result;
      state.queueReady = true;
      startAtomicPendingCacheUpdate(state, execution);
    };
    transaction.onerror = execution.fail;
    transaction.onabort = execution.fail;
    transaction.oncomplete = () => {
      if (state.validationError !== null) {
        reject(state.validationError);
        return;
      }
      resolve();
    };
  });
}

export function runAtomicOfflinePinWithCache(
  database: IDBDatabase,
  pin: LocalOfflinePin,
  record: CachedRecordEnvelope,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [OFFLINE_PIN_STORE, CACHE_STORE],
      "readwrite",
    );
    const fail = (): void =>
      reject(storageError("offline pin/cache transaction"));
    const pinRequest = transaction.objectStore(OFFLINE_PIN_STORE).put(pin);
    const cacheRequest = transaction.objectStore(CACHE_STORE).put(record);
    pinRequest.onerror = fail;
    cacheRequest.onerror = fail;
    transaction.onerror = fail;
    transaction.onabort = fail;
    transaction.oncomplete = () => resolve();
  });
}

export function runAtomicMutationWithCache(
  database: IDBDatabase,
  mutation: PendingMutationEnvelope,
  record: CachedRecordEnvelope,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [MUTATION_STORE, CACHE_STORE],
      "readwrite",
    );
    const fail = (): void => reject(storageError("pending/cache transaction"));
    const mutationRequest = transaction
      .objectStore(MUTATION_STORE)
      .add(mutation);
    const cacheRequest = transaction.objectStore(CACHE_STORE).put(record);
    mutationRequest.onerror = fail;
    cacheRequest.onerror = fail;
    transaction.onerror = fail;
    transaction.onabort = fail;
    transaction.oncomplete = () => resolve();
  });
}

interface AtomicSettlementState {
  currentValue: unknown;
  queueValues: readonly unknown[];
  currentReady: boolean;
  queueReady: boolean;
  started: boolean;
  validationError: unknown;
}

interface AtomicSettlementPolicy {
  validateMutation: (value: unknown) => void;
  shouldWriteCache: (values: readonly unknown[]) => boolean;
}

interface AtomicSettlementExecution extends AtomicSettlementPolicy {
  mutationStore: IDBObjectStore;
  cacheStore: IDBObjectStore;
  operationId: string;
  record: CachedRecordEnvelope;
  fail: () => void;
}

function startAtomicSettlement(
  state: AtomicSettlementState,
  execution: AtomicSettlementExecution,
): void {
  if (!state.currentReady || !state.queueReady || state.started) return;
  state.started = true;
  let writeCache: boolean;
  try {
    execution.validateMutation(state.currentValue);
    writeCache = execution.shouldWriteCache(state.queueValues);
  } catch (error) {
    state.validationError = error;
    return;
  }
  const mutationRequest = execution.mutationStore.delete(execution.operationId);
  mutationRequest.onerror = execution.fail;
  if (!writeCache) return;
  const cacheRequest = execution.cacheStore.put(execution.record);
  cacheRequest.onerror = execution.fail;
}

export function runAtomicSettlementWithCache(
  database: IDBDatabase,
  operationId: string,
  record: CachedRecordEnvelope,
  policy: AtomicSettlementPolicy,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [MUTATION_STORE, CACHE_STORE],
      "readwrite",
    );
    const execution: AtomicSettlementExecution = {
      mutationStore: transaction.objectStore(MUTATION_STORE),
      cacheStore: transaction.objectStore(CACHE_STORE),
      operationId,
      record,
      ...policy,
      fail: () => reject(storageError("settlement/cache transaction")),
    };
    const state: AtomicSettlementState = {
      currentValue: undefined,
      queueValues: [],
      currentReady: false,
      queueReady: false,
      started: false,
      validationError: null,
    };
    const lookupRequest = execution.mutationStore.get(operationId);
    const queueRequest = execution.mutationStore.getAll();
    lookupRequest.onerror = execution.fail;
    queueRequest.onerror = execution.fail;
    lookupRequest.onsuccess = () => {
      state.currentValue = lookupRequest.result;
      state.currentReady = true;
      startAtomicSettlement(state, execution);
    };
    queueRequest.onsuccess = () => {
      state.queueValues = queueRequest.result;
      state.queueReady = true;
      startAtomicSettlement(state, execution);
    };
    transaction.onerror = execution.fail;
    transaction.onabort = execution.fail;
    transaction.oncomplete = () => {
      if (state.validationError !== null) {
        reject(state.validationError);
        return;
      }
      resolve();
    };
  });
}

import type {
  CachedRecordEnvelope,
  PendingMutationEnvelope,
} from "@application/local-data/local-records";

export const LOCAL_SCHEMA_VERSION = 1;
export const METADATA_STORE = "metadata";
export const CACHE_STORE = "cached_records";
export const MUTATION_STORE = "pending_mutations";

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

export function runAtomicSettlementWithCache(
  database: IDBDatabase,
  operationId: string,
  record: CachedRecordEnvelope,
  validateMutation: (value: unknown) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [MUTATION_STORE, CACHE_STORE],
      "readwrite",
    );
    const mutationStore = transaction.objectStore(MUTATION_STORE);
    const cacheStore = transaction.objectStore(CACHE_STORE);
    let validationError: unknown = null;
    const fail = (): void =>
      reject(storageError("settlement/cache transaction"));
    const lookupRequest = mutationStore.get(operationId);

    lookupRequest.onerror = fail;
    lookupRequest.onsuccess = () => {
      try {
        validateMutation(lookupRequest.result);
      } catch (error) {
        validationError = error;
        return;
      }
      const mutationRequest = mutationStore.delete(operationId);
      const cacheRequest = cacheStore.put(record);
      mutationRequest.onerror = fail;
      cacheRequest.onerror = fail;
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

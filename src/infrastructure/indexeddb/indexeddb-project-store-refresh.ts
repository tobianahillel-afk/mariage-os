import type { CachedRecordEnvelope } from "@application/local-data/local-records";

import { CACHE_STORE, MUTATION_STORE } from "./indexeddb-project-store-io";

function storageError(): Error {
  return new Error("Local IndexedDB cloud refresh transaction failed.");
}

export function runAtomicCloudCacheRefresh(
  database: IDBDatabase,
  record: CachedRecordEnvelope,
  shouldWrite: (
    currentValue: unknown,
    queueValues: readonly unknown[],
  ) => boolean,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [MUTATION_STORE, CACHE_STORE],
      "readwrite",
    );
    const mutationStore = transaction.objectStore(MUTATION_STORE);
    const cacheStore = transaction.objectStore(CACHE_STORE);
    let validationError: unknown = null;
    let wrote = false;
    const fail = (): void => reject(storageError());
    const queueRequest = mutationStore.getAll();

    queueRequest.onerror = fail;
    queueRequest.onsuccess = () => {
      const currentRequest = cacheStore.get(record.key);
      currentRequest.onerror = fail;
      currentRequest.onsuccess = () => {
        let write: boolean;
        try {
          write = shouldWrite(currentRequest.result, queueRequest.result);
        } catch (error) {
          validationError = error;
          return;
        }
        if (!write) return;
        wrote = true;
        const writeRequest = cacheStore.put(record);
        writeRequest.onerror = fail;
      };
    };

    transaction.onerror = fail;
    transaction.onabort = fail;
    transaction.oncomplete = () => {
      if (validationError !== null) {
        reject(validationError);
        return;
      }
      resolve(wrote);
    };
  });
}

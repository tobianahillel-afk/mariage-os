import type { CachedRecordEnvelope } from "@application/local-data/local-records";

import { CACHE_STORE, MUTATION_STORE } from "./indexeddb-project-store-io";

interface AtomicRefreshState {
  currentValue: unknown;
  queueValues: readonly unknown[];
  currentReady: boolean;
  queueReady: boolean;
  started: boolean;
  validationError: unknown;
  wrote: boolean;
}

interface AtomicRefreshExecution {
  readonly cacheStore: IDBObjectStore;
  readonly record: CachedRecordEnvelope;
  readonly shouldWrite: (
    currentValue: unknown,
    queueValues: readonly unknown[],
  ) => boolean;
  readonly fail: () => void;
}

function storageError(): Error {
  return new Error("Local IndexedDB cloud refresh transaction failed.");
}

function startAtomicRefresh(
  state: AtomicRefreshState,
  execution: AtomicRefreshExecution,
): void {
  if (!state.currentReady || !state.queueReady || state.started) return;
  state.started = true;

  let write: boolean;
  try {
    write = execution.shouldWrite(state.currentValue, state.queueValues);
  } catch (error) {
    state.validationError = error;
    return;
  }
  if (!write) return;

  state.wrote = true;
  const request = execution.cacheStore.put(execution.record);
  request.onerror = execution.fail;
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
    const state: AtomicRefreshState = {
      currentValue: undefined,
      queueValues: [],
      currentReady: false,
      queueReady: false,
      started: false,
      validationError: null,
      wrote: false,
    };
    const execution: AtomicRefreshExecution = {
      cacheStore,
      record,
      shouldWrite,
      fail: () => reject(storageError()),
    };
    const currentRequest = cacheStore.get(record.key);
    const queueRequest = mutationStore.getAll();

    currentRequest.onerror = execution.fail;
    queueRequest.onerror = execution.fail;
    currentRequest.onsuccess = () => {
      state.currentValue = currentRequest.result;
      state.currentReady = true;
      startAtomicRefresh(state, execution);
    };
    queueRequest.onsuccess = () => {
      state.queueValues = queueRequest.result;
      state.queueReady = true;
      startAtomicRefresh(state, execution);
    };
    transaction.onerror = execution.fail;
    transaction.onabort = execution.fail;
    transaction.oncomplete = () => {
      if (state.validationError !== null) {
        reject(state.validationError);
        return;
      }
      resolve(state.wrote);
    };
  });
}

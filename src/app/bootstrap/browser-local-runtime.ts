import type { LocalProjectStoreFactory } from "@application/local-data/local-project-store";
import { getOrCreateBrowserDeviceId } from "@infra/indexeddb/browser-device-id";
import { IndexedDbProjectStoreFactory } from "@infra/indexeddb/indexeddb-project-store";

export interface BrowserLocalRuntime {
  readonly localStoreFactory: LocalProjectStoreFactory | null;
  readonly deviceId: string | null;
  readonly online: boolean;
  readonly appVersion: string;
}

export interface BrowserLocalRuntimeInput {
  readonly indexedDb: IDBFactory | null;
  readonly storage: Storage | null;
  readonly createUuid: () => string;
  readonly online: boolean;
  readonly appVersion: string;
}

export function createBrowserLocalRuntime(
  input: BrowserLocalRuntimeInput,
): BrowserLocalRuntime {
  if (input.indexedDb === null || input.storage === null) {
    return {
      localStoreFactory: null,
      deviceId: null,
      online: input.online,
      appVersion: input.appVersion,
    };
  }

  try {
    return {
      localStoreFactory: new IndexedDbProjectStoreFactory(input.indexedDb),
      deviceId: getOrCreateBrowserDeviceId(input.storage, input.createUuid),
      online: input.online,
      appVersion: input.appVersion,
    };
  } catch {
    return {
      localStoreFactory: null,
      deviceId: null,
      online: input.online,
      appVersion: input.appVersion,
    };
  }
}

export function createDefaultBrowserLocalRuntime(
  appVersion: string,
): BrowserLocalRuntime {
  try {
    const indexedDb = globalThis.indexedDB ?? null;
    const storage = globalThis.localStorage ?? null;
    return createBrowserLocalRuntime({
      indexedDb,
      storage,
      createUuid: () => globalThis.crypto.randomUUID(),
      online: globalThis.navigator?.onLine ?? false,
      appVersion,
    });
  } catch {
    return {
      localStoreFactory: null,
      deviceId: null,
      online: false,
      appVersion,
    };
  }
}

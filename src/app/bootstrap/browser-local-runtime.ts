import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import type { LocalProjectPurgePort } from "@application/local-data/local-project-purge-port";
import type { LocalProjectStoreFactory } from "@application/local-data/local-project-store";
import { BrowserProjectSessionContextStore } from "@infra/browser/browser-project-session-context-store";
import { getOrCreateBrowserDeviceId } from "@infra/indexeddb/browser-device-id";
import { IndexedDbProjectStoreFactory } from "@infra/indexeddb/indexeddb-project-store";

export interface BrowserLocalRuntime {
  readonly localStoreFactory: LocalProjectStoreFactory | null;
  readonly localPurge: LocalProjectPurgePort | null;
  readonly sessionContext: ProjectSessionContextPort | null;
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

function unavailableRuntime(
  input: Pick<BrowserLocalRuntimeInput, "online" | "appVersion">,
  sessionContext: ProjectSessionContextPort | null,
): BrowserLocalRuntime {
  return {
    localStoreFactory: null,
    localPurge: null,
    sessionContext,
    deviceId: null,
    online: input.online,
    appVersion: input.appVersion,
  };
}

export function createBrowserLocalRuntime(
  input: BrowserLocalRuntimeInput,
): BrowserLocalRuntime {
  const sessionContext =
    input.storage === null
      ? null
      : new BrowserProjectSessionContextStore(input.storage);

  if (input.indexedDb === null || input.storage === null) {
    return unavailableRuntime(input, sessionContext);
  }

  try {
    const localStore = new IndexedDbProjectStoreFactory(input.indexedDb);
    return {
      localStoreFactory: localStore,
      localPurge: localStore,
      sessionContext,
      deviceId: getOrCreateBrowserDeviceId(input.storage, input.createUuid),
      online: input.online,
      appVersion: input.appVersion,
    };
  } catch {
    return unavailableRuntime(input, sessionContext);
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
    return unavailableRuntime({ online: false, appVersion }, null);
  }
}

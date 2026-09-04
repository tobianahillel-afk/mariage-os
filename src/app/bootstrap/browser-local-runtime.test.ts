import { afterEach, expect, it, vi } from "vitest";

import {
  createBrowserLocalRuntime,
  createDefaultBrowserLocalRuntime,
} from "./browser-local-runtime";

const deviceId = "33333333-3333-4333-8333-333333333333";
const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";

function storage(existing: string | null = null): Storage {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? existing),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("composes IndexedDB, session context and stable device identity", () => {
  const target = storage();
  const runtime = createBrowserLocalRuntime({
    indexedDb: {} as IDBFactory,
    storage: target,
    createUuid: () => deviceId,
    online: true,
    appVersion: "1.0.0",
  });

  expect(runtime.localStoreFactory).not.toBeNull();
  expect(runtime.sessionContext).not.toBeNull();
  runtime.sessionContext?.remember(projectId, userId);
  expect(runtime.sessionContext?.readUserId(projectId)).toBe(userId);
  expect(runtime.deviceId).toBe(deviceId);
  expect(runtime.online).toBe(true);
  expect(runtime.appVersion).toBe("1.0.0");
});

it("retains the safe session marker capability when IndexedDB is unavailable", () => {
  const runtime = createBrowserLocalRuntime({
    indexedDb: null,
    storage: storage(),
    createUuid: () => deviceId,
    online: false,
    appVersion: "1",
  });

  expect(runtime.localStoreFactory).toBeNull();
  expect(runtime.sessionContext).not.toBeNull();
  expect(runtime.deviceId).toBeNull();
  expect(runtime.online).toBe(false);
});

it("fails closed when browser storage is unavailable", () => {
  expect(
    createBrowserLocalRuntime({
      indexedDb: {} as IDBFactory,
      storage: null,
      createUuid: () => deviceId,
      online: true,
      appVersion: "1",
    }),
  ).toEqual({
    localStoreFactory: null,
    sessionContext: null,
    deviceId: null,
    online: true,
    appVersion: "1",
  });
});

it("keeps only the safe marker adapter when device identity persistence throws", () => {
  const target = storage();
  vi.mocked(target.getItem).mockImplementation(() => {
    throw new Error("blocked");
  });

  const runtime = createBrowserLocalRuntime({
    indexedDb: {} as IDBFactory,
    storage: target,
    createUuid: () => deviceId,
    online: true,
    appVersion: "1",
  });

  expect(runtime.localStoreFactory).toBeNull();
  expect(runtime.sessionContext).not.toBeNull();
  expect(runtime.deviceId).toBeNull();
});

it("default composition uses platform UUID and persists device identity", () => {
  const target = storage();
  vi.stubGlobal("indexedDB", {} as IDBFactory);
  vi.stubGlobal("localStorage", target);
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => deviceId) });

  const runtime = createDefaultBrowserLocalRuntime("1");

  expect(runtime.localStoreFactory).not.toBeNull();
  expect(runtime.sessionContext).not.toBeNull();
  expect(runtime.deviceId).toBe(deviceId);
  expect(runtime.online).toBe(true);
  expect(target.setItem).toHaveBeenCalledWith("mariage-os.device-id", deviceId);
});

it("default composition degrades when the platform globals are unavailable", () => {
  expect(createDefaultBrowserLocalRuntime("1").appVersion).toBe("1");
});

it("default composition catches platform getter failures", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    get() {
      throw new Error("blocked");
    },
  });

  try {
    expect(createDefaultBrowserLocalRuntime("1")).toEqual({
      localStoreFactory: null,
      sessionContext: null,
      deviceId: null,
      online: false,
      appVersion: "1",
    });
  } finally {
    if (descriptor === undefined) {
      Reflect.deleteProperty(globalThis, "indexedDB");
    } else {
      Object.defineProperty(globalThis, "indexedDB", descriptor);
    }
  }
});

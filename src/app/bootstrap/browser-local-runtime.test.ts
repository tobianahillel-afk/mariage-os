import { afterEach, expect, it, vi } from "vitest";

import {
  createBrowserLocalRuntime,
  createDefaultBrowserLocalRuntime,
} from "./browser-local-runtime";

const deviceId = "33333333-3333-4333-8333-333333333333";

function storage(existing: string | null = null): Storage {
  return {
    getItem: vi.fn().mockReturnValue(existing),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("composes IndexedDB and stable device identity when browser storage exists", () => {
  const target = storage();
  const runtime = createBrowserLocalRuntime({
    indexedDb: {} as IDBFactory,
    storage: target,
    createUuid: () => deviceId,
    online: true,
    appVersion: "1.0.0",
  });

  expect(runtime.localStoreFactory).not.toBeNull();
  expect(runtime.deviceId).toBe(deviceId);
  expect(runtime.online).toBe(true);
  expect(runtime.appVersion).toBe("1.0.0");
});

it("fails closed when IndexedDB is unavailable", () => {
  expect(
    createBrowserLocalRuntime({
      indexedDb: null,
      storage: storage(),
      createUuid: () => deviceId,
      online: false,
      appVersion: "1",
    }),
  ).toEqual({
    localStoreFactory: null,
    deviceId: null,
    online: false,
    appVersion: "1",
  });
});

it("fails closed when device identity storage is unavailable", () => {
  expect(
    createBrowserLocalRuntime({
      indexedDb: {} as IDBFactory,
      storage: null,
      createUuid: () => deviceId,
      online: true,
      appVersion: "1",
    }).localStoreFactory,
  ).toBeNull();
});

it("fails closed when browser identity persistence throws", () => {
  const target = storage();
  vi.mocked(target.getItem).mockImplementation(() => {
    throw new Error("blocked");
  });

  expect(
    createBrowserLocalRuntime({
      indexedDb: {} as IDBFactory,
      storage: target,
      createUuid: () => deviceId,
      online: true,
      appVersion: "1",
    }),
  ).toMatchObject({ localStoreFactory: null, deviceId: null });
});

it("default composition uses platform UUID and persists device identity", () => {
  const target = storage();
  vi.stubGlobal("indexedDB", {} as IDBFactory);
  vi.stubGlobal("localStorage", target);
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => deviceId) });

  const runtime = createDefaultBrowserLocalRuntime("1");

  expect(runtime.localStoreFactory).not.toBeNull();
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

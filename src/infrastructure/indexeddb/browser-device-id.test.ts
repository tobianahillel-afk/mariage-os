import { describe, expect, it, vi } from "vitest";

import { getOrCreateBrowserDeviceId } from "./browser-device-id";

const deviceId = "33333333-3333-4333-8333-333333333333";

function storage(initial: string | null) {
  return {
    getItem: vi.fn().mockReturnValue(initial),
    setItem: vi.fn(),
  };
}

describe("getOrCreateBrowserDeviceId", () => {
  it("reuses a previously persisted UUID", () => {
    const target = storage(deviceId);
    const createUuid = vi.fn(() => "44444444-4444-4444-8444-444444444444");

    expect(getOrCreateBrowserDeviceId(target, createUuid)).toBe(deviceId);
    expect(createUuid).not.toHaveBeenCalled();
    expect(target.setItem).not.toHaveBeenCalled();
  });

  it.each([null, "malformed"])("creates and persists a UUID for %s", (initial) => {
    const target = storage(initial);

    expect(getOrCreateBrowserDeviceId(target, () => deviceId)).toBe(deviceId);
    expect(target.setItem).toHaveBeenCalledWith("mariage-os.device-id", deviceId);
  });

  it("rejects a malformed UUID factory result", () => {
    expect(() => getOrCreateBrowserDeviceId(storage(null), () => "bad")).toThrow(
      "must return a UUID",
    );
  });
});

import { isUuid } from "@application/local-data/local-project-scope";

const DEVICE_ID_KEY = "mariage-os.device-id";

export interface DeviceIdentityStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function getOrCreateBrowserDeviceId(
  storage: DeviceIdentityStorage,
  createUuid: () => string,
): string {
  const existing = storage.getItem(DEVICE_ID_KEY);
  if (existing !== null && isUuid(existing)) {
    return existing;
  }

  const created = createUuid();
  if (!isUuid(created)) {
    throw new Error("Device ID factory must return a UUID.");
  }
  storage.setItem(DEVICE_ID_KEY, created);
  return created;
}

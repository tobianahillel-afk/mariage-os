import {
  assertLocalOfflinePinScope,
  parseLocalOfflinePin,
  type LocalOfflinePin,
} from "@application/local-data/local-offline-pin";
import { parseCachedRecordEnvelope } from "@application/local-data/persisted-local-data-parser";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type { CachedRecordEnvelope } from "@application/local-data/local-records";
import {
  assertVenueVisitPackageMatchesPin,
  parseVenueVisitPackagePayload,
} from "@application/venues/venue-visit-package";

import { assertCachedRecordScope } from "./indexeddb-project-store-validation";
import {
  OFFLINE_PIN_STORE,
  runAtomicOfflinePinWithCache,
  runRequest,
} from "./indexeddb-project-store-io";

function assertOfflinePinPackage(
  pin: LocalOfflinePin,
  record: CachedRecordEnvelope,
): void {
  if (
    record.recordType !== "venue_visit_package" ||
    record.entityId !== pin.entityId
  ) {
    throw new Error("Offline pin visit package target does not match.");
  }
  const visitPackage = parseVenueVisitPackagePayload(record.payload);
  assertVenueVisitPackageMatchesPin(visitPackage, pin);
}

export async function putIndexedDbOfflinePinWithCachedRecord(
  database: IDBDatabase,
  scope: LocalProjectScope,
  pin: LocalOfflinePin,
  record: CachedRecordEnvelope,
): Promise<void> {
  const parsedPin = parseLocalOfflinePin(pin);
  const parsedRecord = parseCachedRecordEnvelope(record);
  assertLocalOfflinePinScope(parsedPin, scope);
  assertCachedRecordScope(parsedRecord, scope);
  assertOfflinePinPackage(parsedPin, parsedRecord);
  await runAtomicOfflinePinWithCache(database, parsedPin, parsedRecord);
}

export async function getIndexedDbOfflinePin(
  database: IDBDatabase,
  scope: LocalProjectScope,
  entityType: string,
  entityId: string,
): Promise<LocalOfflinePin | null> {
  const raw = await runRequest<unknown>(
    database,
    OFFLINE_PIN_STORE,
    "readonly",
    (store) => store.get(`${entityType}:${entityId}`),
  );
  if (raw === undefined) return null;
  const pin = parseLocalOfflinePin(raw);
  assertLocalOfflinePinScope(pin, scope);
  return pin;
}

import {
  createCachedRecordEnvelope,
  type CachedRecordEnvelope,
} from "@application/local-data/local-records";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type { VenueCoreRecord } from "@application/venues/venue-repository-port";
import { isVenueStatus } from "@domain/venues/venue-status";

export const VENUE_CACHE_RECORD_TYPE = "venue";

type VenueSyncMarker = CachedRecordEnvelope["syncMarker"];
type JsonRecord = Record<string, unknown>;

function invalidCachedVenue(): never {
  throw new Error("Invalid cached Venue record.");
}

function objectValue(value: unknown): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidCachedVenue();
  }
  return value as JsonRecord;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : invalidCachedVenue();
}

function nullableString(value: unknown): string | null {
  return value === null ? null : stringValue(value);
}

function revisionValue(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    return invalidCachedVenue();
  }
  return value as number;
}

export function venueCachedRecord(
  scope: LocalProjectScope,
  venue: VenueCoreRecord,
  syncMarker: VenueSyncMarker,
): CachedRecordEnvelope {
  if (venue.projectId !== scope.projectId) {
    throw new Error("Venue cache write belongs to another project scope.");
  }
  return createCachedRecordEnvelope(scope, {
    recordType: VENUE_CACHE_RECORD_TYPE,
    entityId: venue.id,
    serverRevision: String(venue.revision),
    serverUpdatedAt: null,
    syncMarker,
    payload: {
      code: venue.code,
      name: venue.name,
      status: venue.status,
      rejectionReason: venue.rejectionReason,
      websiteUrl: venue.websiteUrl,
      city: venue.city,
      revision: venue.revision,
    },
  });
}

export function venueFromCachedRecord(
  record: CachedRecordEnvelope,
): VenueCoreRecord {
  if (record.recordType !== VENUE_CACHE_RECORD_TYPE) invalidCachedVenue();
  const payload = objectValue(record.payload);
  const status = stringValue(payload.status);
  if (!isVenueStatus(status)) invalidCachedVenue();
  const rejectionReason = nullableString(payload.rejectionReason);
  if ((status === "rejected") !== (rejectionReason !== null)) {
    invalidCachedVenue();
  }
  const revision = revisionValue(payload.revision);
  if (record.serverRevision !== String(revision)) invalidCachedVenue();

  return {
    id: record.entityId,
    projectId: record.projectId,
    code: nullableString(payload.code),
    name: stringValue(payload.name),
    status,
    rejectionReason,
    websiteUrl: nullableString(payload.websiteUrl),
    city: nullableString(payload.city),
    revision,
  };
}

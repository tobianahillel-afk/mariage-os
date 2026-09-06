import type { VenueCoreRecord } from "@application/venues/venue-repository-port";
import { isVenueStatus } from "@domain/venues/venue-status";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UnknownRecord = Record<string, unknown>;

function invalidVenueResponse(): never {
  throw new Error("Invalid venue response.");
}

function recordValue(value: unknown): UnknownRecord {
  if (typeof value !== "object") invalidVenueResponse();
  if (value === null) invalidVenueResponse();
  if (Array.isArray(value)) invalidVenueResponse();
  return value as UnknownRecord;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") invalidVenueResponse();
  return value;
}

function nullableStringValue(value: unknown): string | null {
  if (value === null) return null;
  return stringValue(value);
}

function uuidValue(value: unknown): string {
  const parsed = stringValue(value);
  if (!UUID_PATTERN.test(parsed)) invalidVenueResponse();
  return parsed;
}

function revisionValue(value: unknown): number {
  if (typeof value !== "number") invalidVenueResponse();
  if (!Number.isInteger(value)) invalidVenueResponse();
  if (value < 1) invalidVenueResponse();
  return value;
}

export function parseVenueCoreRow(
  value: unknown,
  expectedProjectId: string,
): VenueCoreRecord {
  const row = recordValue(value);
  const projectId = uuidValue(row.project_id);
  if (projectId !== expectedProjectId) invalidVenueResponse();

  const status = stringValue(row.status);
  if (!isVenueStatus(status)) invalidVenueResponse();

  const rejectionReason = nullableStringValue(row.rejection_reason);
  const isRejected = status === "rejected";
  if (isRejected !== (rejectionReason !== null)) invalidVenueResponse();

  return {
    id: uuidValue(row.id),
    projectId,
    code: nullableStringValue(row.code),
    name: stringValue(row.name),
    status,
    rejectionReason,
    websiteUrl: nullableStringValue(row.website_url),
    city: nullableStringValue(row.city),
    revision: revisionValue(row.revision),
  };
}

import {
  isUuid,
  type LocalProjectScope,
} from "@application/local-data/local-project-scope";

type LocalBinarySyncState = "unsynced" | "synced";

export interface LocalBinaryMetadata {
  readonly localBinaryId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly venueId: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
  readonly lastAccessedAt: string;
  readonly pinned: boolean;
  readonly syncState: LocalBinarySyncState;
}

type RawRecord = Record<string, unknown>;

function invalid(field: string): never {
  throw new Error(`Invalid persisted local binary ${field}.`);
}

function recordValue(value: unknown): RawRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid("record");
  }
  return value as RawRecord;
}

function stringValue(value: unknown, field: string): string {
  return typeof value === "string" && value.length > 0 ? value : invalid(field);
}

function uuidValue(value: unknown, field: string): string {
  const parsed = stringValue(value, field);
  return isUuid(parsed) ? parsed : invalid(field);
}

function instantValue(value: unknown, field: string): string {
  const parsed = stringValue(value, field);
  const date = new Date(parsed);
  return !Number.isNaN(date.getTime()) && date.toISOString() === parsed
    ? parsed
    : invalid(field);
}

function sizeValue(value: unknown): number {
  return Number.isInteger(value) && (value as number) >= 0
    ? (value as number)
    : invalid("size");
}

function booleanValue(value: unknown, field: string): boolean {
  return typeof value === "boolean" ? value : invalid(field);
}

function syncStateValue(value: unknown): LocalBinarySyncState {
  return value === "unsynced" || value === "synced"
    ? value
    : invalid("sync state");
}

function mimeValue(value: unknown): string {
  const parsed = stringValue(value, "MIME type");
  return parsed.includes("/") ? parsed : invalid("MIME type");
}

export function parseLocalBinaryMetadata(value: unknown): LocalBinaryMetadata {
  const row = recordValue(value);
  return {
    localBinaryId: uuidValue(row.localBinaryId, "id"),
    projectId: uuidValue(row.projectId, "project id"),
    userId: uuidValue(row.userId, "user id"),
    deviceId: uuidValue(row.deviceId, "device id"),
    venueId: uuidValue(row.venueId, "Venue id"),
    filename: stringValue(row.filename, "filename"),
    mimeType: mimeValue(row.mimeType),
    sizeBytes: sizeValue(row.sizeBytes),
    createdAt: instantValue(row.createdAt, "created timestamp"),
    lastAccessedAt: instantValue(row.lastAccessedAt, "access timestamp"),
    pinned: booleanValue(row.pinned, "pin state"),
    syncState: syncStateValue(row.syncState),
  };
}

export function assertLocalBinaryScope(
  record: LocalBinaryMetadata,
  scope: LocalProjectScope,
): void {
  if (
    record.projectId !== scope.projectId ||
    record.userId !== scope.userId ||
    record.deviceId !== scope.deviceId
  ) {
    throw new Error("Local binary belongs to another local scope.");
  }
}

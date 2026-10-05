import {
  isUuid,
  type LocalProjectScope,
} from "@application/local-data/local-project-scope";

type LocalOfflinePinReason =
  | "manual"
  | "upcoming_visit"
  | "favorite"
  | "recent";

type LocalOfflineMediaPolicy = "none" | "thumbnails";

export interface LocalOfflinePin {
  readonly key: string;
  readonly entityType: "venue";
  readonly entityId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly reason: LocalOfflinePinReason;
  readonly preparedAt: string;
  readonly updatedAt: string;
  readonly mediaPolicy: LocalOfflineMediaPolicy;
  readonly packageRevision: number;
}

type RawRecord = Record<string, unknown>;

const reasons: readonly LocalOfflinePinReason[] = [
  "manual",
  "upcoming_visit",
  "favorite",
  "recent",
];
const mediaPolicies: readonly LocalOfflineMediaPolicy[] = [
  "none",
  "thumbnails",
];

function invalid(field: string): never {
  throw new Error(`Invalid persisted offline pin ${field}.`);
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

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  const parsed = stringValue(value, field);
  return allowed.includes(parsed as T) ? (parsed as T) : invalid(field);
}

function revisionValue(value: unknown): number {
  return Number.isInteger(value) && (value as number) >= 1
    ? (value as number)
    : invalid("package revision");
}

export function parseLocalOfflinePin(value: unknown): LocalOfflinePin {
  const row = recordValue(value);
  const entityId = uuidValue(row.entityId, "entity id");
  const key = stringValue(row.key, "key");
  if (key !== `venue:${entityId}`) invalid("key");

  return {
    key,
    entityType: enumValue(
      row.entityType,
      ["venue"] as const,
      "entity type",
    ),
    entityId,
    projectId: uuidValue(row.projectId, "project id"),
    userId: uuidValue(row.userId, "user id"),
    deviceId: uuidValue(row.deviceId, "device id"),
    reason: enumValue(row.reason, reasons, "reason"),
    preparedAt: instantValue(row.preparedAt, "prepared timestamp"),
    updatedAt: instantValue(row.updatedAt, "updated timestamp"),
    mediaPolicy: enumValue(row.mediaPolicy, mediaPolicies, "media policy"),
    packageRevision: revisionValue(row.packageRevision),
  };
}

export function assertLocalOfflinePinScope(
  pin: LocalOfflinePin,
  scope: LocalProjectScope,
): void {
  if (
    pin.projectId !== scope.projectId ||
    pin.userId !== scope.userId ||
    pin.deviceId !== scope.deviceId
  ) {
    throw new Error("Offline pin belongs to another local scope.");
  }
}

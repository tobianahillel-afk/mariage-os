import { isUuid } from "@application/local-data/local-project-scope";
import type { LocalProjectMetadata } from "@application/local-data/local-project-store";
import type {
  CachedRecordEnvelope,
  PendingMutationEnvelope,
} from "@application/local-data/local-records";

const STABLE_NAME = /^[a-z][a-z0-9_]*$/;
const MAX_JSON_NODES = 10_000;
const syncMarkers = ["synced", "pending", "conflict"] as const;
const mutationStatuses = [
  "pending",
  "sending",
  "conflict",
  "failed_retryable",
  "failed_permanent",
] as const;
const mutationPriorities = [
  "essential_structured",
  "metadata",
  "media_related",
] as const;

type RawRecord = Record<string, unknown>;
type PersistedJsonValue = CachedRecordEnvelope["payload"];

function invalid(label: string): never {
  throw new Error(`Invalid persisted local ${label}.`);
}

function recordValue(value: unknown, label: string): RawRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid(label);
  }
  return value as RawRecord;
}

function stringValue(value: unknown, label: string): string {
  return typeof value === "string" ? value : invalid(label);
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : stringValue(value, label);
}

function integerValue(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    return invalid(label);
  }
  return value as number;
}

function uuidValue(value: unknown, label: string): string {
  const parsed = stringValue(value, label);
  return isUuid(parsed) ? parsed : invalid(label);
}

function nullableUuid(value: unknown, label: string): string | null {
  return value === null ? null : uuidValue(value, label);
}

function instantValue(value: unknown, label: string): string {
  const parsed = stringValue(value, label);
  const date = new Date(parsed);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== parsed) {
    return invalid(label);
  }
  return parsed;
}

function nullableInstant(value: unknown, label: string): string | null {
  return value === null ? null : instantValue(value, label);
}

function stableName(value: unknown, label: string): string {
  const parsed = stringValue(value, label);
  return STABLE_NAME.test(parsed) ? parsed : invalid(label);
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  const parsed = stringValue(value, label);
  return allowed.includes(parsed as T) ? (parsed as T) : invalid(label);
}

interface JsonWalkState {
  readonly queue: unknown[];
  readonly seen: Set<object>;
  nodes: number;
}

function enqueueJsonObject(value: object, state: JsonWalkState): void {
  if (state.seen.has(value)) {
    invalid("JSON payload cycle");
  }
  state.seen.add(value);
  if (Array.isArray(value)) {
    state.queue.push(...value);
    return;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    invalid("JSON payload object");
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    invalid("JSON payload symbol key");
  }
  state.queue.push(...Object.values(value));
}

function inspectJsonValue(value: unknown, state: JsonWalkState): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid("JSON payload number");
    }
    return;
  }
  if (typeof value !== "object") {
    invalid("JSON payload value");
  }
  enqueueJsonObject(value, state);
}

function jsonValue(value: unknown): PersistedJsonValue {
  const state: JsonWalkState = { queue: [value], seen: new Set(), nodes: 0 };
  while (state.queue.length > 0) {
    state.nodes += 1;
    if (state.nodes > MAX_JSON_NODES) {
      invalid("JSON payload size");
    }
    inspectJsonValue(state.queue.pop(), state);
  }
  return value as PersistedJsonValue;
}

export function parseLocalProjectMetadata(value: unknown): LocalProjectMetadata {
  const row = recordValue(value, "metadata");
  return {
    key: enumValue(row.key, ["scope"] as const, "metadata key"),
    localSchemaVersion: integerValue(
      row.localSchemaVersion,
      "metadata schema version",
    ),
    appVersionLastOpened: stringValue(
      row.appVersionLastOpened,
      "metadata app version",
    ),
    projectId: uuidValue(row.projectId, "metadata project id"),
    userId: uuidValue(row.userId, "metadata user id"),
    deviceId: uuidValue(row.deviceId, "metadata device id"),
    lastSuccessfulSyncAt: nullableInstant(
      row.lastSuccessfulSyncAt,
      "metadata sync timestamp",
    ),
    backendSchemaVersionLastSeen: nullableString(
      row.backendSchemaVersionLastSeen,
      "metadata backend schema version",
    ),
    serviceWorkerBuildLastSeen: nullableString(
      row.serviceWorkerBuildLastSeen,
      "metadata service-worker build",
    ),
  };
}

export function parseCachedRecordEnvelope(value: unknown): CachedRecordEnvelope {
  const row = recordValue(value, "cached record");
  const recordType = stableName(row.recordType, "cached record type");
  const entityId = uuidValue(row.entityId, "cached record entity id");
  const key = stringValue(row.key, "cached record key");
  if (key !== `${recordType}:${entityId}`) {
    invalid("cached record key");
  }
  return {
    key,
    recordType,
    entityId,
    projectId: uuidValue(row.projectId, "cached record project id"),
    serverRevision: nullableString(
      row.serverRevision,
      "cached record server revision",
    ),
    serverUpdatedAt: nullableInstant(
      row.serverUpdatedAt,
      "cached record server timestamp",
    ),
    syncMarker: enumValue(row.syncMarker, syncMarkers, "cached record sync marker"),
    payload: jsonValue(row.payload),
  };
}

export function parsePendingMutationEnvelope(
  value: unknown,
): PendingMutationEnvelope {
  const row = recordValue(value, "pending mutation");
  return {
    operationId: uuidValue(row.operationId, "pending mutation operation id"),
    projectId: uuidValue(row.projectId, "pending mutation project id"),
    userId: uuidValue(row.userId, "pending mutation user id"),
    deviceId: uuidValue(row.deviceId, "pending mutation device id"),
    entityType: stableName(row.entityType, "pending mutation entity type"),
    entityId: nullableUuid(row.entityId, "pending mutation entity id"),
    mutationType: stableName(row.mutationType, "pending mutation type"),
    baseRevision: nullableString(row.baseRevision, "pending mutation base revision"),
    payload: jsonValue(row.payload),
    createdAt: instantValue(row.createdAt, "pending mutation created timestamp"),
    attemptCount: integerValue(row.attemptCount, "pending mutation attempt count"),
    lastAttemptAt: nullableInstant(
      row.lastAttemptAt,
      "pending mutation last-attempt timestamp",
    ),
    status: enumValue(row.status, mutationStatuses, "pending mutation status"),
    lastErrorCode: nullableString(
      row.lastErrorCode,
      "pending mutation error code",
    ),
    priorityClass: enumValue(
      row.priorityClass,
      mutationPriorities,
      "pending mutation priority",
    ),
  };
}

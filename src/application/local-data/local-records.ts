import {
  isUuid,
  type LocalProjectScope,
} from "@application/local-data/local-project-scope";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type LocalSyncMarker = "synced" | "pending" | "conflict";
export type PendingMutationStatus =
  | "pending"
  | "sending"
  | "conflict"
  | "failed_retryable"
  | "failed_permanent";
export type PendingMutationPriority =
  | "essential_structured"
  | "metadata"
  | "media_related";

export interface CachedRecordEnvelope {
  readonly key: string;
  readonly recordType: string;
  readonly entityId: string;
  readonly projectId: string;
  readonly serverRevision: string | null;
  readonly serverUpdatedAt: string | null;
  readonly syncMarker: LocalSyncMarker;
  readonly payload: JsonValue;
}

export interface CachedRecordInput {
  readonly recordType: string;
  readonly entityId: string;
  readonly serverRevision: string | null;
  readonly serverUpdatedAt: string | null;
  readonly syncMarker: LocalSyncMarker;
  readonly payload: JsonValue;
}

export interface PendingMutationEnvelope {
  readonly operationId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly mutationType: string;
  readonly baseRevision: string | null;
  readonly payload: JsonValue;
  readonly createdAt: string;
  readonly attemptCount: number;
  readonly lastAttemptAt: string | null;
  readonly status: PendingMutationStatus;
  readonly lastErrorCode: string | null;
  readonly priorityClass: PendingMutationPriority;
}

export interface PendingMutationInput {
  readonly operationId: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly mutationType: string;
  readonly baseRevision: string | null;
  readonly payload: JsonValue;
  readonly createdAt: string;
  readonly priorityClass: PendingMutationPriority;
}

function requireName(value: string, field: string): void {
  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    throw new Error(`${field} must use a stable snake_case identifier.`);
  }
}

function requireIsoInstant(value: string, field: string): void {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be a canonical ISO timestamp.`);
  }
}

export function createCachedRecordEnvelope(
  scope: LocalProjectScope,
  input: CachedRecordInput,
): CachedRecordEnvelope {
  requireName(input.recordType, "recordType");
  if (!isUuid(input.entityId)) {
    throw new Error("entityId must be a UUID.");
  }
  if (input.serverUpdatedAt !== null) {
    requireIsoInstant(input.serverUpdatedAt, "serverUpdatedAt");
  }

  return Object.freeze({
    key: `${input.recordType}:${input.entityId}`,
    recordType: input.recordType,
    entityId: input.entityId,
    projectId: scope.projectId,
    serverRevision: input.serverRevision,
    serverUpdatedAt: input.serverUpdatedAt,
    syncMarker: input.syncMarker,
    payload: input.payload,
  });
}

export function createPendingMutationEnvelope(
  scope: LocalProjectScope,
  input: PendingMutationInput,
): PendingMutationEnvelope {
  if (!isUuid(input.operationId)) {
    throw new Error("operationId must be a UUID.");
  }
  requireName(input.entityType, "entityType");
  requireName(input.mutationType, "mutationType");
  if (input.entityId !== null && !isUuid(input.entityId)) {
    throw new Error("entityId must be null or a UUID.");
  }
  requireIsoInstant(input.createdAt, "createdAt");

  return Object.freeze({
    operationId: input.operationId,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    entityType: input.entityType,
    entityId: input.entityId,
    mutationType: input.mutationType,
    baseRevision: input.baseRevision,
    payload: input.payload,
    createdAt: input.createdAt,
    attemptCount: 0,
    lastAttemptAt: null,
    status: "pending",
    lastErrorCode: null,
    priorityClass: input.priorityClass,
  });
}

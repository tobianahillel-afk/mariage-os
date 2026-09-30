import {
  parseCachedRecordEnvelope,
  parsePendingMutationEnvelope,
} from "@application/local-data/persisted-local-data-parser";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type {
  CachedRecordEnvelope,
  PendingMutationEnvelope,
} from "@application/local-data/local-records";

export function assertCachedRecordScope(
  record: CachedRecordEnvelope,
  scope: LocalProjectScope,
): void {
  if (record.projectId !== scope.projectId) {
    throw new Error("Cached record belongs to another project scope.");
  }
}

export function assertMutationScope(
  mutation: PendingMutationEnvelope,
  scope: LocalProjectScope,
): void {
  if (
    mutation.projectId !== scope.projectId ||
    mutation.userId !== scope.userId ||
    mutation.deviceId !== scope.deviceId
  ) {
    throw new Error("Pending mutation belongs to another local scope.");
  }
}

export function assertMutationTarget(
  mutation: PendingMutationEnvelope,
  record: CachedRecordEnvelope,
): void {
  if (
    mutation.entityId !== record.entityId ||
    mutation.entityType !== record.recordType
  ) {
    throw new Error("Pending mutation settlement target does not match.");
  }
}

function sameMutationScope(
  current: PendingMutationEnvelope,
  next: PendingMutationEnvelope,
): boolean {
  return (
    current.projectId === next.projectId &&
    current.userId === next.userId &&
    current.deviceId === next.deviceId
  );
}

function sameMutationTarget(
  current: PendingMutationEnvelope,
  next: PendingMutationEnvelope,
): boolean {
  return (
    current.operationId === next.operationId &&
    current.entityType === next.entityType &&
    current.entityId === next.entityId
  );
}

function sameMutationCommand(
  current: PendingMutationEnvelope,
  next: PendingMutationEnvelope,
): boolean {
  return (
    current.mutationType === next.mutationType &&
    current.baseRevision === next.baseRevision &&
    current.createdAt === next.createdAt &&
    current.priorityClass === next.priorityClass &&
    JSON.stringify(current.payload) === JSON.stringify(next.payload)
  );
}

function sameMutationIntent(
  current: PendingMutationEnvelope,
  next: PendingMutationEnvelope,
): boolean {
  return (
    sameMutationScope(current, next) &&
    sameMutationTarget(current, next) &&
    sameMutationCommand(current, next)
  );
}

export function validatePendingMutationUpdate(
  value: unknown,
  next: PendingMutationEnvelope,
  scope: LocalProjectScope,
): void {
  if (value === undefined) {
    throw new Error("Pending mutation update target is missing.");
  }
  const current = parsePendingMutationEnvelope(value);
  assertMutationScope(current, scope);
  if (!sameMutationIntent(current, next)) {
    throw new Error("Pending mutation update intent does not match.");
  }
}

export function validateSettlementMutation(
  value: unknown,
  operationId: string,
  record: CachedRecordEnvelope,
  scope: LocalProjectScope,
): void {
  if (value === undefined) {
    throw new Error("Pending mutation settlement target is missing.");
  }
  const mutation = parsePendingMutationEnvelope(value);
  assertMutationScope(mutation, scope);
  if (mutation.operationId !== operationId) {
    throw new Error("Pending mutation settlement target does not match.");
  }
  assertMutationTarget(mutation, record);
}

export function shouldWriteMutationCache(
  values: readonly unknown[],
  operationId: string,
  record: CachedRecordEnvelope,
  scope: LocalProjectScope,
): boolean {
  for (const value of values) {
    const mutation = parsePendingMutationEnvelope(value);
    assertMutationScope(mutation, scope);
    if (mutation.operationId === operationId) continue;
    if (
      mutation.entityType === record.recordType &&
      mutation.entityId === record.entityId
    ) {
      return false;
    }
  }
  return true;
}

function hasPendingRefreshTarget(
  values: readonly unknown[],
  record: CachedRecordEnvelope,
  scope: LocalProjectScope,
): boolean {
  let found = false;
  for (const value of values) {
    const mutation = parsePendingMutationEnvelope(value);
    assertMutationScope(mutation, scope);
    if (
      mutation.entityType === record.recordType &&
      mutation.entityId === record.entityId
    ) {
      found = true;
    }
  }
  return found;
}

function currentRefreshCacheIsSafe(
  currentValue: unknown,
  record: CachedRecordEnvelope,
  scope: LocalProjectScope,
): boolean {
  if (currentValue === undefined) return true;
  const current = parseCachedRecordEnvelope(currentValue);
  assertCachedRecordScope(current, scope);
  if (
    current.key !== record.key ||
    current.recordType !== record.recordType ||
    current.entityId !== record.entityId
  ) {
    throw new Error("Cached refresh target does not match.");
  }
  return current.syncMarker !== "pending" && current.syncMarker !== "conflict";
}

export function shouldWriteCloudRefreshCache(
  currentValue: unknown,
  values: readonly unknown[],
  record: CachedRecordEnvelope,
  scope: LocalProjectScope,
): boolean {
  const hasPendingTarget = hasPendingRefreshTarget(values, record, scope);
  const currentIsSafe = currentRefreshCacheIsSafe(currentValue, record, scope);
  return currentIsSafe && !hasPendingTarget;
}

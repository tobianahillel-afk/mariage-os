import { expect, it } from "vitest";

import { createLocalProjectScope } from "./local-project-scope";
import {
  createCachedRecordEnvelope,
  createPendingMutationEnvelope,
} from "./local-records";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const entityId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";
const timestamp = "2026-09-04T14:00:00.000Z";

it("creates a project-bound cached record", () => {
  const record = createCachedRecordEnvelope(scope, {
    recordType: "project_preferences",
    entityId,
    serverRevision: "rev-1",
    serverUpdatedAt: timestamp,
    syncMarker: "synced",
    payload: { density: "comfortable" },
  });

  expect(record).toEqual({
    key: `project_preferences:${entityId}`,
    recordType: "project_preferences",
    entityId,
    projectId: scope.projectId,
    serverRevision: "rev-1",
    serverUpdatedAt: timestamp,
    syncMarker: "synced",
    payload: { density: "comfortable" },
  });
  expect(Object.isFrozen(record)).toBe(true);
});

it("accepts a cached record without server acknowledgement metadata", () => {
  expect(
    createCachedRecordEnvelope(scope, {
      recordType: "project_preferences",
      entityId,
      serverRevision: null,
      serverUpdatedAt: null,
      syncMarker: "pending",
      payload: null,
    }).serverUpdatedAt,
  ).toBeNull();
});

it("rejects malformed cached record identity and timestamp", () => {
  expect(() =>
    createCachedRecordEnvelope(scope, {
      recordType: "Project Preferences",
      entityId,
      serverRevision: null,
      serverUpdatedAt: null,
      syncMarker: "synced",
      payload: null,
    }),
  ).toThrow("recordType");
  expect(() =>
    createCachedRecordEnvelope(scope, {
      recordType: "project_preferences",
      entityId: "not-an-id",
      serverRevision: null,
      serverUpdatedAt: null,
      syncMarker: "synced",
      payload: null,
    }),
  ).toThrow("entityId");
  expect(() =>
    createCachedRecordEnvelope(scope, {
      recordType: "project_preferences",
      entityId,
      serverRevision: null,
      serverUpdatedAt: "yesterday",
      syncMarker: "synced",
      payload: null,
    }),
  ).toThrow("serverUpdatedAt");
});

it("creates a pending mutation carrying immutable scope and retry metadata", () => {
  const mutation = createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "project_preferences",
    entityId,
    mutationType: "update_preferences",
    baseRevision: "rev-1",
    payload: { density: "compact" },
    createdAt: timestamp,
    priorityClass: "metadata",
  });

  expect(mutation).toEqual({
    operationId,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    entityType: "project_preferences",
    entityId,
    mutationType: "update_preferences",
    baseRevision: "rev-1",
    payload: { density: "compact" },
    createdAt: timestamp,
    attemptCount: 0,
    lastAttemptAt: null,
    status: "pending",
    lastErrorCode: null,
    priorityClass: "metadata",
  });
  expect(Object.isFrozen(mutation)).toBe(true);
});

it("allows a command without an entity id", () => {
  expect(
    createPendingMutationEnvelope(scope, {
      operationId,
      entityType: "project",
      entityId: null,
      mutationType: "refresh_metadata",
      baseRevision: null,
      payload: {},
      createdAt: timestamp,
      priorityClass: "essential_structured",
    }).entityId,
  ).toBeNull();
});

it("rejects malformed mutation identity, names and timestamp", () => {
  const base = {
    operationId,
    entityType: "project_preferences",
    entityId,
    mutationType: "update_preferences",
    baseRevision: null,
    payload: null,
    createdAt: timestamp,
    priorityClass: "metadata" as const,
  };

  expect(() =>
    createPendingMutationEnvelope(scope, {
      ...base,
      operationId: "bad",
    }),
  ).toThrow("operationId");
  expect(() =>
    createPendingMutationEnvelope(scope, {
      ...base,
      entityType: "Project Preferences",
    }),
  ).toThrow("entityType");
  expect(() =>
    createPendingMutationEnvelope(scope, {
      ...base,
      mutationType: "Update Preferences",
    }),
  ).toThrow("mutationType");
  expect(() =>
    createPendingMutationEnvelope(scope, {
      ...base,
      entityId: "bad",
    }),
  ).toThrow("entityId");
  expect(() =>
    createPendingMutationEnvelope(scope, {
      ...base,
      createdAt: "2026-09-04",
    }),
  ).toThrow("createdAt");
});

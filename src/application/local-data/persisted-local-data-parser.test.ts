import { expect, it } from "vitest";

import {
  parseCachedRecordEnvelope,
  parseLocalProjectMetadata,
  parsePendingMutationEnvelope,
} from "./persisted-local-data-parser";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const deviceId = "33333333-3333-4333-8333-333333333333";
const entityId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";
const instant = "2026-09-04T14:00:00.000Z";

const metadata = {
  key: "scope",
  localSchemaVersion: 1,
  appVersionLastOpened: "1.0.0",
  projectId,
  userId,
  deviceId,
  lastSuccessfulSyncAt: instant,
  backendSchemaVersionLastSeen: "12",
  serviceWorkerBuildLastSeen: "build-1",
};

const cached = {
  key: `project_preferences:${entityId}`,
  recordType: "project_preferences",
  entityId,
  projectId,
  serverRevision: "rev-1",
  serverUpdatedAt: instant,
  syncMarker: "synced",
  payload: { density: "compact", values: [1, true, null] },
};

const mutation = {
  operationId,
  projectId,
  userId,
  deviceId,
  entityType: "project_preferences",
  entityId,
  mutationType: "update_preferences",
  baseRevision: "rev-1",
  payload: { density: "compact" },
  createdAt: instant,
  attemptCount: 0,
  lastAttemptAt: instant,
  status: "pending",
  lastErrorCode: "retry_later",
  priorityClass: "metadata",
};

it("parses complete persisted local records", () => {
  expect(parseLocalProjectMetadata(metadata)).toEqual(metadata);
  expect(parseCachedRecordEnvelope(cached)).toEqual(cached);
  expect(parsePendingMutationEnvelope(mutation)).toEqual(mutation);
});

it("accepts nullable persisted metadata and mutation fields", () => {
  expect(
    parseLocalProjectMetadata({
      ...metadata,
      lastSuccessfulSyncAt: null,
      backendSchemaVersionLastSeen: null,
      serviceWorkerBuildLastSeen: null,
    }).lastSuccessfulSyncAt,
  ).toBeNull();
  expect(
    parsePendingMutationEnvelope({
      ...mutation,
      entityId: null,
      baseRevision: null,
      lastAttemptAt: null,
      lastErrorCode: null,
    }).entityId,
  ).toBeNull();
});

it.each([
  [null, "metadata"],
  [{ ...metadata, key: "other" }, "metadata key"],
  [{ ...metadata, localSchemaVersion: -1 }, "metadata schema version"],
  [{ ...metadata, appVersionLastOpened: 1 }, "metadata app version"],
  [{ ...metadata, projectId: "bad" }, "metadata project id"],
  [{ ...metadata, lastSuccessfulSyncAt: "yesterday" }, "metadata sync timestamp"],
  [{ ...metadata, backendSchemaVersionLastSeen: 12 }, "metadata backend schema"],
])("rejects malformed metadata %#", (value, message) => {
  expect(() => parseLocalProjectMetadata(value)).toThrow(message);
});

it.each([
  [{ ...cached, recordType: "Project Preferences" }, "cached record type"],
  [{ ...cached, key: `wrong:${entityId}` }, "cached record key"],
  [{ ...cached, syncMarker: "remote" }, "cached record sync marker"],
  [{ ...cached, serverUpdatedAt: "2026-09-04" }, "cached record server timestamp"],
])("rejects malformed cached envelope %#", (value, message) => {
  expect(() => parseCachedRecordEnvelope(value)).toThrow(message);
});

it.each([
  [{ ...mutation, entityId: "bad" }, "pending mutation entity id"],
  [{ ...mutation, mutationType: "Update Preferences" }, "pending mutation type"],
  [{ ...mutation, attemptCount: 0.5 }, "pending mutation attempt count"],
  [{ ...mutation, status: "done" }, "pending mutation status"],
  [{ ...mutation, lastAttemptAt: "later" }, "pending mutation last-attempt"],
  [{ ...mutation, lastErrorCode: 7 }, "pending mutation error code"],
  [{ ...mutation, priorityClass: "urgent" }, "pending mutation priority"],
])("rejects malformed pending envelope %#", (value, message) => {
  expect(() => parsePendingMutationEnvelope(value)).toThrow(message);
});

it("accepts JSON objects with a null prototype", () => {
  const payload = Object.assign(Object.create(null) as Record<string, unknown>, {
    value: 1,
  });
  expect(parseCachedRecordEnvelope({ ...cached, payload }).payload).toBe(payload);
});

it.each([
  [Number.POSITIVE_INFINITY, "JSON payload number"],
  [undefined, "JSON payload value"],
  [new Date(instant), "JSON payload object"],
])("rejects non-JSON payload %#", (payload, message) => {
  expect(() => parseCachedRecordEnvelope({ ...cached, payload })).toThrow(message);
});

it("rejects cyclic and symbol-keyed JSON payloads", () => {
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  expect(() => parseCachedRecordEnvelope({ ...cached, payload: cyclic })).toThrow(
    "JSON payload cycle",
  );

  const symbolKeyed = { value: 1 } as Record<PropertyKey, unknown>;
  symbolKeyed[Symbol("hidden")] = 2;
  expect(() =>
    parseCachedRecordEnvelope({ ...cached, payload: symbolKeyed }),
  ).toThrow("JSON payload symbol key");
});

it("bounds JSON payload traversal", () => {
  const payload = Array.from({ length: 10_001 }, () => null);
  expect(() => parseCachedRecordEnvelope({ ...cached, payload })).toThrow(
    "JSON payload size",
  );
});

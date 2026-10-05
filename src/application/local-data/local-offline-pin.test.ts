import { expect, it } from "vitest";

import {
  assertLocalOfflinePinScope,
  parseLocalOfflinePin,
  type LocalOfflinePin,
} from "./local-offline-pin";
import { scope } from "../../../tests/support/indexeddb-project-store-test-support";

const venueId = "a2111111-1111-4111-8111-111111111111";

function pin(overrides: Partial<LocalOfflinePin> = {}): LocalOfflinePin {
  return {
    key: `venue:${venueId}`,
    entityType: "venue",
    entityId: venueId,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    reason: "manual",
    preparedAt: "2026-10-05T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
    mediaPolicy: "thumbnails",
    packageRevision: 1,
    ...overrides,
  };
}

it("parses a bounded offline Venue pin", () => {
  const parsed = parseLocalOfflinePin(pin());
  expect(parsed).toEqual(pin());
  expect(() => assertLocalOfflinePinScope(parsed, scope)).not.toThrow();
});

it.each([
  ["record", null],
  ["array record", []],
  ["key type", { ...pin(), key: 42 }],
  ["key identity", { ...pin(), key: `venue:bad-${venueId}` }],
  ["entity type", { ...pin(), entityType: "vendor" }],
  ["entity id type", { ...pin(), entityId: 42 }],
  ["entity id", { ...pin(), entityId: "not-a-uuid" }],
  ["project id", { ...pin(), projectId: "not-a-uuid" }],
  ["reason", { ...pin(), reason: "automatic" }],
  ["prepared timestamp", { ...pin(), preparedAt: "not-a-date" }],
  ["updated timestamp", { ...pin(), updatedAt: "not-a-date" }],
  ["media policy", { ...pin(), mediaPolicy: "originals" }],
  ["package revision", { ...pin(), packageRevision: 0 }],
  ["fractional package revision", { ...pin(), packageRevision: 1.5 }],
])("rejects invalid offline pin %s", (_label, value) => {
  expect(() => parseLocalOfflinePin(value)).toThrow(
    "Invalid persisted offline pin",
  );
});

it.each([
  ["projectId", "b2111111-1111-4111-8111-111111111111"],
  ["userId", "c2111111-1111-4111-8111-111111111111"],
  ["deviceId", "d2111111-1111-4111-8111-111111111111"],
] as const)("fails closed on foreign %s", (field, value) => {
  const parsed = parseLocalOfflinePin({
    ...pin(),
    [field]: value,
  });
  expect(() => assertLocalOfflinePinScope(parsed, scope)).toThrow(
    "another local scope",
  );
});

it("accepts every frozen pin reason and media policy", () => {
  for (const reason of [
    "manual",
    "upcoming_visit",
    "favorite",
    "recent",
  ] as const) {
    expect(parseLocalOfflinePin(pin({ reason })).reason).toBe(reason);
  }
  expect(
    parseLocalOfflinePin(pin({ mediaPolicy: "none" })).mediaPolicy,
  ).toBe("none");
});

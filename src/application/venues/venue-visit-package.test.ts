import { expect, it } from "vitest";

import type { LocalOfflinePin } from "@application/local-data/local-offline-pin";
import {
  assertVenueVisitPackageMatchesPin,
  parseVenueVisitPackagePayload,
} from "./venue-visit-package";

const venueId = "a2111111-1111-4111-8111-111111111111";

function payload() {
  return {
    venue: { id: venueId, name: "Venue offline fixture" },
    checklist: ["capacity", "access"],
    preparedAt: "2026-10-05T00:00:00.000Z",
    mediaPolicy: "thumbnails",
    packageRevision: 1,
  } as const;
}

function pin(): LocalOfflinePin {
  return {
    key: `venue:${venueId}`,
    entityType: "venue",
    entityId: venueId,
    projectId: "22222222-2222-4222-8222-222222222222",
    userId: "11111111-1111-4111-8111-111111111111",
    deviceId: "33333333-3333-4333-8333-333333333333",
    reason: "manual",
    preparedAt: "2026-10-05T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
    mediaPolicy: "thumbnails",
    packageRevision: 1,
  };
}

it("parses the bounded local Venue visit package", () => {
  expect(parseVenueVisitPackagePayload(payload())).toEqual(payload());
});

it.each([
  ["record", null],
  ["Venue", { ...payload(), venue: null }],
  ["Venue id", { ...payload(), venue: { ...payload().venue, id: "bad" } }],
  ["Venue name", { ...payload(), venue: { ...payload().venue, name: "" } }],
  ["checklist", { ...payload(), checklist: "capacity" }],
  ["checklist item", { ...payload(), checklist: [""] }],
  ["prepared timestamp", { ...payload(), preparedAt: "bad" }],
  ["media policy", { ...payload(), mediaPolicy: "originals" }],
  ["package revision", { ...payload(), packageRevision: 0 }],
])("rejects invalid %s", (_label, value) => {
  expect(() => parseVenueVisitPackagePayload(value)).toThrow(
    "Invalid persisted Venue visit package",
  );
});

it("accepts the no-media policy", () => {
  expect(
    parseVenueVisitPackagePayload({ ...payload(), mediaPolicy: "none" })
      .mediaPolicy,
  ).toBe("none");
});

it.each([
  ["Venue", { venue: { ...payload().venue, id: "a2222222-2222-4222-8222-222222222222" } }],
  ["preparedAt", { preparedAt: "2026-10-05T00:01:00.000Z" }],
  ["mediaPolicy", { mediaPolicy: "none" }],
  ["packageRevision", { packageRevision: 2 }],
])("rejects package metadata that disagrees with the pin: %s", (_label, override) => {
  const parsed = parseVenueVisitPackagePayload({
    ...payload(),
    ...override,
  });
  expect(() => assertVenueVisitPackageMatchesPin(parsed, pin())).toThrow(
    "metadata does not match",
  );
});

it("accepts package metadata that matches the pin", () => {
  expect(() =>
    assertVenueVisitPackageMatchesPin(
      parseVenueVisitPackagePayload(payload()),
      pin(),
    ),
  ).not.toThrow();
});

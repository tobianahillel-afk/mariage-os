import { expect, it } from "vitest";
import {
  isVenueAccessMode,
  isVenueAccessRouteType,
  normalizeVenueAccessRoute,
  selectVenueAccessRouteSummary,
  venueAccessRouteCallerPayloadEquals,
  venueAccessRouteMatchesCurrentOrigin,
  type VenueAccessRouteCallerPayload,
  type VenueAccessRouteRecord,
  type VenueReferenceOrigin,
} from "./venue-access-route";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const routeId = "33333333-3333-4333-8333-333333333333";
const originId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";

function draft(overrides: Record<string, unknown> = {}) {
  return {
    referenceOriginId: null,
    routeType: "custom",
    originLabel: "  Airport  ",
    destinationLabel: "  Venue  ",
    mode: "car",
    durationMinutes: 45,
    distanceMeters: 30_000,
    transfersCount: 0,
    observedAt: "2026-09-09T12:00:00+02:00",
    sourceId,
    notes: "  checked  ",
    ...overrides,
  };
}

function origin(
  overrides: Partial<VenueReferenceOrigin> = {},
): VenueReferenceOrigin {
  return {
    id: originId,
    projectId,
    label: "Paris",
    addressText: "1 Rue Test",
    latitude: 48.8566,
    longitude: 2.3522,
    isDefault: true,
    ...overrides,
  };
}

function record(
  overrides: Partial<VenueAccessRouteRecord> = {},
): VenueAccessRouteRecord {
  return {
    id: routeId,
    projectId,
    venueId,
    referenceOriginId: originId,
    routeType: "reference_to_venue",
    originLabel: "Paris",
    destinationLabel: "Venue",
    mode: "car",
    durationMinutes: 95,
    distanceMeters: 123_000,
    transfersCount: 0,
    observedAt: "2026-09-09T10:00:00.000Z",
    sourceId,
    notes: "checked",
    referenceOriginAddressSnapshot: "1 Rue Test",
    referenceOriginLatitudeSnapshot: 48.8566,
    referenceOriginLongitudeSnapshot: 2.3522,
    createdAt: "2026-09-09T10:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-09-09T10:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
    ...overrides,
  };
}

function payload(
  overrides: Partial<VenueAccessRouteCallerPayload> = {},
): VenueAccessRouteCallerPayload {
  return {
    projectId,
    venueId,
    referenceOriginId: originId,
    routeType: "reference_to_venue",
    originLabel: null,
    destinationLabel: "Venue",
    mode: "car",
    durationMinutes: 95,
    distanceMeters: 123_000,
    transfersCount: 0,
    observedAt: "2026-09-09T10:00:00.000Z",
    sourceId,
    notes: "checked",
    ...overrides,
  };
}

it("recognizes exactly the frozen route types and modes", () => {
  for (const value of [
    "reference_to_venue",
    "reference_to_tgv_station",
    "tgv_station_to_venue",
    "airport_to_venue",
    "custom",
  ]) {
    expect(isVenueAccessRouteType(value)).toBe(true);
  }
  expect(isVenueAccessRouteType("other")).toBe(false);
  expect(isVenueAccessRouteType(null)).toBe(false);

  for (const value of [
    "car",
    "train",
    "public_transport",
    "taxi_vtc",
    "shuttle",
    "coach",
    "walk",
    "mixed",
    "other",
  ]) {
    expect(isVenueAccessMode(value)).toBe(true);
  }
  expect(isVenueAccessMode("teleport")).toBe(false);
  expect(isVenueAccessMode(null)).toBe(false);
});

it("normalizes caller-owned route evidence and nullables", () => {
  expect(normalizeVenueAccessRoute(draft())).toEqual({
    ok: true,
    value: {
      referenceOriginId: null,
      routeType: "custom",
      originLabel: "Airport",
      destinationLabel: "Venue",
      mode: "car",
      durationMinutes: 45,
      distanceMeters: 30_000,
      transfersCount: 0,
      observedAt: "2026-09-09T10:00:00.000Z",
      sourceId,
      notes: "checked",
    },
  });
  expect(
    normalizeVenueAccessRoute(
      draft({
        referenceOriginId: originId,
        routeType: "reference_to_venue",
        originLabel: undefined,
        destinationLabel: undefined,
        durationMinutes: undefined,
        distanceMeters: null,
        transfersCount: undefined,
        sourceId: undefined,
        notes: "   ",
      }),
    ),
  ).toEqual({
    ok: true,
    value: {
      referenceOriginId: originId,
      routeType: "reference_to_venue",
      originLabel: null,
      destinationLabel: null,
      mode: "car",
      durationMinutes: null,
      distanceMeters: null,
      transfersCount: null,
      observedAt: "2026-09-09T10:00:00.000Z",
      sourceId: null,
      notes: null,
    },
  });
  expect(
    normalizeVenueAccessRoute(
      draft({
        originLabel: null,
        destinationLabel: null,
        durationMinutes: null,
        sourceId: null,
        notes: null,
      }),
    ),
  ).toMatchObject({ ok: true });
  expect(
    normalizeVenueAccessRoute(
      draft({
        originLabel: "😀".repeat(160),
        destinationLabel: "😀".repeat(160),
        durationMinutes: 2_147_483_647,
      }),
    ),
  ).toMatchObject({ ok: true });
});

it("rejects each invalid route input boundary", () => {
  const cases: readonly [Record<string, unknown>, string][] = [
    [{ referenceOriginId: "bad" }, "invalid_reference_origin_id"],
    [{ routeType: "bad" }, "invalid_route_type"],
    [{ mode: "bad" }, "invalid_mode"],
    [{ originLabel: 12 }, "invalid_origin_label"],
    [{ originLabel: "😀".repeat(161) }, "invalid_origin_label"],
    [
      { referenceOriginId: originId, originLabel: "client snapshot" },
      "invalid_origin_label",
    ],
    [{ destinationLabel: 12 }, "invalid_destination_label"],
    [{ destinationLabel: "d".repeat(161) }, "invalid_destination_label"],
    [{ durationMinutes: -1 }, "invalid_duration_minutes"],
    [{ distanceMeters: 2_147_483_648 }, "invalid_distance_meters"],
    [{ transfersCount: 1.5 }, "invalid_transfers_count"],
    [{ observedAt: "bad" }, "invalid_observed_at"],
    [{ sourceId: "bad" }, "invalid_source_id"],
    [{ notes: 12 }, "invalid_notes"],
    [{ notes: "n".repeat(5_001) }, "invalid_notes"],
  ];
  for (const [overrides, error] of cases) {
    expect(normalizeVenueAccessRoute(draft(overrides))).toEqual({
      ok: false,
      error,
    });
  }
});

it("compares replay caller payloads while excluding referenced origin snapshots", () => {
  expect(venueAccessRouteCallerPayloadEquals(record(), payload())).toBe(true);
  expect(
    venueAccessRouteCallerPayloadEquals(
      record({
        originLabel: "Historical server label",
        referenceOriginAddressSnapshot: "Old address",
        referenceOriginLatitudeSnapshot: 1,
        referenceOriginLongitudeSnapshot: 2,
      }),
      payload(),
    ),
  ).toBe(true);

  const custom = record({
    referenceOriginId: null,
    routeType: "custom",
    originLabel: "Airport",
    referenceOriginAddressSnapshot: null,
    referenceOriginLatitudeSnapshot: null,
    referenceOriginLongitudeSnapshot: null,
  });
  expect(
    venueAccessRouteCallerPayloadEquals(
      custom,
      payload({
        referenceOriginId: null,
        routeType: "custom",
        originLabel: "Airport",
      }),
    ),
  ).toBe(true);
  expect(
    venueAccessRouteCallerPayloadEquals(
      custom,
      payload({
        referenceOriginId: null,
        routeType: "custom",
        originLabel: "Station",
      }),
    ),
  ).toBe(false);

  const changes: readonly Partial<VenueAccessRouteCallerPayload>[] = [
    { projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    { venueId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    { referenceOriginId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    { routeType: "reference_to_tgv_station" },
    { destinationLabel: "Other" },
    { mode: "train" },
    { durationMinutes: 96 },
    { distanceMeters: 124_000 },
    { transfersCount: 1 },
    { observedAt: "2026-09-09T10:00:01.000Z" },
    { sourceId: null },
    { notes: "other" },
  ];
  for (const change of changes) {
    expect(
      venueAccessRouteCallerPayloadEquals(record(), payload(change)),
    ).toBe(false);
  }
});

it("matches only current physical origin context for the requested mode", () => {
  expect(
    venueAccessRouteMatchesCurrentOrigin(record(), origin(), "car"),
  ).toBe(true);
  expect(
    venueAccessRouteMatchesCurrentOrigin(
      record({ referenceOriginId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      origin(),
      "car",
    ),
  ).toBe(false);
  expect(
    venueAccessRouteMatchesCurrentOrigin(
      record({ routeType: "reference_to_tgv_station" }),
      origin(),
      "car",
    ),
  ).toBe(false);
  expect(
    venueAccessRouteMatchesCurrentOrigin(record(), origin(), "train"),
  ).toBe(false);
  expect(
    venueAccessRouteMatchesCurrentOrigin(
      record({ referenceOriginAddressSnapshot: "Old" }),
      origin(),
      "car",
    ),
  ).toBe(false);
  expect(
    venueAccessRouteMatchesCurrentOrigin(
      record({ referenceOriginLatitudeSnapshot: 1 }),
      origin(),
      "car",
    ),
  ).toBe(false);
  expect(
    venueAccessRouteMatchesCurrentOrigin(
      record({ referenceOriginLongitudeSnapshot: 1 }),
      origin(),
      "car",
    ),
  ).toBe(false);
});

it("derives explicit summary states without reordering provider history", () => {
  expect(selectVenueAccessRouteSummary([record()], null, "car")).toEqual({
    status: "missing",
    reason: "no_default_origin",
  });
  expect(
    selectVenueAccessRouteSummary(
      [record({ referenceOriginAddressSnapshot: "Old" })],
      origin(),
      "car",
    ),
  ).toEqual({ status: "missing", reason: "no_current_observation" });

  const first = record({ id: "77777777-7777-4777-8777-777777777777" });
  const second = record({ id: "11111111-1111-4111-8111-111111111111" });
  expect(
    selectVenueAccessRouteSummary([first, second], origin(), "car"),
  ).toEqual({
    status: "ready",
    origin: origin(),
    route: first,
  });
});

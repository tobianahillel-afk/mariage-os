import { expect, it } from "vitest";
import { parseVenueAccessRouteRow } from "./parse-venue-access-route-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const routeId = "33333333-3333-4333-8333-333333333333";
const originId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";
const actorId = "66666666-6666-4666-8666-666666666666";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: routeId,
    project_id: projectId,
    venue_id: venueId,
    reference_origin_id: originId,
    route_type: "reference_to_venue",
    origin_label: "Paris",
    destination_label: "Venue",
    mode: "car",
    duration_minutes: 95,
    distance_meters: 123_000,
    transfers_count: 0,
    observed_at: "2026-09-09T10:00:00.000Z",
    source_id: sourceId,
    notes: "checked",
    reference_origin_address_snapshot: "1 Rue Test",
    reference_origin_latitude_snapshot: 48.8566,
    reference_origin_longitude_snapshot: 2.3522,
    created_at: "2026-09-09T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-09-09T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

it("parses referenced and custom canonical route rows", () => {
  expect(parseVenueAccessRouteRow(row(), projectId, venueId, routeId)).toEqual({
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
    createdBy: actorId,
    updatedAt: "2026-09-09T10:01:00.000Z",
    updatedBy: actorId,
    revision: 1,
  });

  expect(
    parseVenueAccessRouteRow(
      row({
        reference_origin_id: null,
        route_type: "custom",
        origin_label: "Airport",
        destination_label: null,
        duration_minutes: null,
        distance_meters: null,
        transfers_count: null,
        source_id: null,
        notes: null,
        reference_origin_address_snapshot: null,
        reference_origin_latitude_snapshot: null,
        reference_origin_longitude_snapshot: null,
      }),
    ),
  ).toMatchObject({
    referenceOriginId: null,
    routeType: "custom",
    originLabel: "Airport",
    destinationLabel: null,
    durationMinutes: null,
    distanceMeters: null,
    transfersCount: null,
    sourceId: null,
    notes: null,
    referenceOriginAddressSnapshot: null,
    referenceOriginLatitudeSnapshot: null,
    referenceOriginLongitudeSnapshot: null,
  });
});

it("rejects non-object, malformed identities and request substitution", () => {
  for (const value of [null, [], "row"]) {
    expect(() => parseVenueAccessRouteRow(value)).toThrow(
      "Invalid venue access route response.",
    );
  }
  for (const overrides of [
    { id: "bad" },
    { project_id: "bad" },
    { venue_id: "bad" },
    { reference_origin_id: "bad" },
    { source_id: "bad" },
    { created_by: "bad" },
    { updated_by: "bad" },
  ]) {
    expect(() => parseVenueAccessRouteRow(row(overrides))).toThrow(
      "Invalid venue access route response.",
    );
  }

  const other = "77777777-7777-4777-8777-777777777777";
  expect(() => parseVenueAccessRouteRow(row(), other, venueId, routeId)).toThrow();
  expect(() => parseVenueAccessRouteRow(row(), projectId, other, routeId)).toThrow();
  expect(() => parseVenueAccessRouteRow(row(), projectId, venueId, other)).toThrow();
});

it("rejects malformed or noncanonical caller-owned fields", () => {
  for (const overrides of [
    { route_type: "bad" },
    { destination_label: 12 },
    { destination_label: "  Venue  " },
    { mode: "bad" },
    { duration_minutes: -1 },
    { distance_meters: 2_147_483_648 },
    { transfers_count: 1.5 },
    { observed_at: "bad" },
    { notes: 12 },
    { notes: "  checked  " },
  ]) {
    expect(() => parseVenueAccessRouteRow(row(overrides))).toThrow(
      "Invalid venue access route response.",
    );
  }
});

it("rejects malformed server-owned snapshots and audit fields", () => {
  for (const overrides of [
    { origin_label: 12 },
    { origin_label: "  Paris  " },
    { reference_origin_address_snapshot: 12 },
    { reference_origin_address_snapshot: "  1 Rue Test  " },
    { reference_origin_latitude_snapshot: "48" },
    { reference_origin_latitude_snapshot: 91 },
    { reference_origin_longitude_snapshot: 181 },
    { reference_origin_longitude_snapshot: null },
    { created_at: "bad" },
    { updated_at: "bad" },
    { revision: 2 },
  ]) {
    expect(() => parseVenueAccessRouteRow(row(overrides))).toThrow(
      "Invalid venue access route response.",
    );
  }
});

it("rejects snapshots on custom routes without a reference origin", () => {
  const custom = {
    reference_origin_id: null,
    route_type: "custom",
    origin_label: "Airport",
    reference_origin_address_snapshot: null,
    reference_origin_latitude_snapshot: null,
    reference_origin_longitude_snapshot: null,
  };
  expect(() =>
    parseVenueAccessRouteRow(
      row({ ...custom, reference_origin_address_snapshot: "Address" }),
    ),
  ).toThrow();
  expect(() =>
    parseVenueAccessRouteRow(
      row({
        ...custom,
        reference_origin_latitude_snapshot: 48,
        reference_origin_longitude_snapshot: 2,
      }),
    ),
  ).toThrow();
});

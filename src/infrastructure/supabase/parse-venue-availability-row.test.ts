import { expect, it } from "vitest";
import { parseVenueAvailabilityRow } from "./parse-venue-availability-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const availabilityId = "33333333-3333-4333-8333-333333333333";
const dateOptionId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";
const actorId = "66666666-6666-4666-8666-666666666666";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: availabilityId,
    project_id: projectId,
    venue_id: venueId,
    date_option_id: dateOptionId,
    event_date: "2027-06-12",
    status: "option_held",
    option_expires_at: "2026-09-10T16:00:00.000Z",
    observed_at: "2026-09-08T10:00:00.000Z",
    source_id: sourceId,
    notes: "checked",
    created_at: "2026-09-08T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-09-08T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

it("parses canonical provider rows and optional null relationships", () => {
  expect(
    parseVenueAvailabilityRow(row(), projectId, venueId, availabilityId),
  ).toEqual({
    id: availabilityId,
    projectId,
    venueId,
    dateOptionId,
    eventDate: "2027-06-12",
    status: "option_held",
    optionExpiresAt: "2026-09-10T16:00:00.000Z",
    observedAt: "2026-09-08T10:00:00.000Z",
    sourceId,
    notes: "checked",
    createdAt: "2026-09-08T10:01:00.000Z",
    createdBy: actorId,
    updatedAt: "2026-09-08T10:01:00.000Z",
    updatedBy: actorId,
    revision: 1,
  });
  expect(
    parseVenueAvailabilityRow(
      row({
        date_option_id: null,
        source_id: null,
        option_expires_at: null,
        status: "available",
        notes: null,
      }),
    ),
  ).toMatchObject({
    dateOptionId: null,
    sourceId: null,
    optionExpiresAt: null,
    notes: null,
  });
});

it("rejects non-object and malformed identity provider rows", () => {
  for (const value of [null, [], "row"]) {
    expect(() => parseVenueAvailabilityRow(value)).toThrow(
      "Invalid venue availability response.",
    );
  }
  for (const overrides of [
    { id: "bad" },
    { project_id: "bad" },
    { venue_id: "bad" },
    { date_option_id: "bad" },
    { source_id: "bad" },
  ]) {
    expect(() => parseVenueAvailabilityRow(row(overrides))).toThrow(
      "Invalid venue availability response.",
    );
  }
});

it("rejects request-identity substitution", () => {
  const other = "77777777-7777-4777-8777-777777777777";
  expect(() =>
    parseVenueAvailabilityRow(row(), other, venueId, availabilityId),
  ).toThrow();
  expect(() =>
    parseVenueAvailabilityRow(row(), projectId, other, availabilityId),
  ).toThrow();
  expect(() =>
    parseVenueAvailabilityRow(row(), projectId, venueId, other),
  ).toThrow();
});

it("rejects malformed or noncanonical commercial payloads", () => {
  for (const overrides of [
    { event_date: "2027-02-29" },
    { status: "pending" },
    { option_expires_at: "bad" },
    { observed_at: "bad" },
    { notes: 12 },
    { notes: "  checked  " },
    { observed_at: "2026-09-08T12:00:00+02:00" },
    { option_expires_at: "2026-09-10T18:00:00+02:00" },
  ]) {
    expect(() => parseVenueAvailabilityRow(row(overrides))).toThrow(
      "Invalid venue availability response.",
    );
  }
});

it("rejects malformed audit identities, timestamps and revisions", () => {
  for (const overrides of [
    { created_by: "bad" },
    { updated_by: "bad" },
    { created_at: "bad" },
    { created_at: "2026-09-08T12:01:00+02:00" },
    { updated_at: "bad" },
    { updated_at: "2026-09-08T12:01:00+02:00" },
    { revision: 0 },
    { revision: 1.5 },
  ]) {
    expect(() => parseVenueAvailabilityRow(row(overrides))).toThrow(
      "Invalid venue availability response.",
    );
  }
});

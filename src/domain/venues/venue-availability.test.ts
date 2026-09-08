import { expect, it } from "vitest";
import {
  compareVenueAvailabilityRecency,
  effectiveVenueAvailabilityStatus,
  isVenueAvailabilityStatus,
  latestVenueAvailability,
  normalizeVenueAvailability,
  venueAvailabilityPayloadEquals,
  type VenueAvailabilityRecord,
} from "./venue-availability";

const sourceId = "11111111-1111-4111-8111-111111111111";

function draft(overrides: Record<string, unknown> = {}) {
  return {
    eventDate: "2027-06-12",
    status: "available",
    optionExpiresAt: null,
    observedAt: "2026-09-08T12:00:00+02:00",
    sourceId: null,
    notes: null,
    ...overrides,
  };
}

function record(overrides: Partial<VenueAvailabilityRecord> = {}): VenueAvailabilityRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    projectId: "22222222-2222-4222-8222-222222222222",
    venueId: "33333333-3333-4333-8333-333333333333",
    dateOptionId: null,
    eventDate: "2027-06-12",
    status: "available",
    optionExpiresAt: null,
    observedAt: "2026-09-08T10:00:00.000Z",
    sourceId: null,
    notes: null,
    createdAt: "2026-09-08T10:01:00.000Z",
    createdBy: "44444444-4444-4444-8444-444444444444",
    updatedAt: "2026-09-08T10:01:00.000Z",
    updatedBy: "44444444-4444-4444-8444-444444444444",
    revision: 1,
    ...overrides,
  };
}

it("recognizes exactly the frozen availability statuses", () => {
  for (const status of ["unknown", "available", "unavailable", "option_held", "expired"]) {
    expect(isVenueAvailabilityStatus(status)).toBe(true);
  }
  expect(isVenueAvailabilityStatus("pending")).toBe(false);
  expect(isVenueAvailabilityStatus(null)).toBe(false);
});

it("normalizes canonical availability evidence", () => {
  expect(
    normalizeVenueAvailability(
      draft({
        status: "option_held",
        optionExpiresAt: "2026-09-10T18:00:00+02:00",
        sourceId,
        notes: "  held until Thursday  ",
      }),
    ),
  ).toEqual({
    ok: true,
    value: {
      eventDate: "2027-06-12",
      status: "option_held",
      optionExpiresAt: "2026-09-10T16:00:00.000Z",
      observedAt: "2026-09-08T10:00:00.000Z",
      sourceId,
      notes: "held until Thursday",
    },
  });
  expect(normalizeVenueAvailability(draft({ notes: "   " }))).toMatchObject({
    ok: true,
    value: { notes: null },
  });
});

it("rejects invalid dates, statuses, instants, sources and notes", () => {
  expect(normalizeVenueAvailability(draft({ eventDate: "2027-02-29" }))).toEqual({ ok: false, error: "invalid_event_date" });
  expect(normalizeVenueAvailability(draft({ status: "maybe" }))).toEqual({ ok: false, error: "invalid_status" });
  expect(normalizeVenueAvailability(draft({ observedAt: "tomorrow" }))).toEqual({ ok: false, error: "invalid_observed_at" });
  expect(normalizeVenueAvailability(draft({ optionExpiresAt: "bad" }))).toEqual({ ok: false, error: "invalid_option_expires_at" });
  expect(normalizeVenueAvailability(draft({ optionExpiresAt: "2026-09-10T16:00:00Z" }))).toEqual({ ok: false, error: "invalid_option_expires_at" });
  expect(normalizeVenueAvailability(draft({ sourceId: "not-a-uuid" }))).toEqual({ ok: false, error: "invalid_source_id" });
  expect(normalizeVenueAvailability(draft({ notes: 12 }))).toEqual({ ok: false, error: "invalid_notes" });
  expect(normalizeVenueAvailability(draft({ notes: "x".repeat(5_001) }))).toEqual({ ok: false, error: "invalid_notes" });
});

it("allows an option hold without an expiry and nullable source values", () => {
  expect(normalizeVenueAvailability(draft({ status: "option_held", optionExpiresAt: undefined, sourceId: undefined }))).toMatchObject({
    ok: true,
    value: { optionExpiresAt: null, sourceId: null },
  });
});

it("compares canonical replay payloads independently of audit fields", () => {
  const first = record();
  expect(venueAvailabilityPayloadEquals(first, record({ revision: 7 }))).toBe(true);
  expect(venueAvailabilityPayloadEquals(first, record({ notes: "changed" }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ projectId: "55555555-5555-4555-8555-555555555555" }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ venueId: "55555555-5555-4555-8555-555555555555" }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ dateOptionId: sourceId }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ eventDate: "2027-06-13" }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ status: "unknown" }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ optionExpiresAt: "2026-09-09T10:00:00.000Z" }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ observedAt: "2026-09-09T10:00:00.000Z" }))).toBe(false);
  expect(venueAvailabilityPayloadEquals(first, record({ sourceId }))).toBe(false);
});

it("selects latest deterministically by observedAt, createdAt, then id", () => {
  const oldest = record({ id: "33333333-3333-4333-8333-333333333333", observedAt: "2026-09-08T09:00:00.000Z" });
  const laterCreated = record({ id: "22222222-2222-4222-8222-222222222222", createdAt: "2026-09-08T10:02:00.000Z" });
  const idWinner = record({ id: "11111111-1111-4111-8111-111111111111", createdAt: "2026-09-08T10:02:00.000Z" });
  expect(compareVenueAvailabilityRecency(idWinner, idWinner)).toBe(0);
  expect(compareVenueAvailabilityRecency(oldest, idWinner)).toBe(1);
  expect(compareVenueAvailabilityRecency(idWinner, oldest)).toBe(-1);
  expect(compareVenueAvailabilityRecency(laterCreated, record())).toBe(-1);
  expect(compareVenueAvailabilityRecency(record(), laterCreated)).toBe(1);
  expect(compareVenueAvailabilityRecency(idWinner, laterCreated)).toBe(-1);
  expect(compareVenueAvailabilityRecency(laterCreated, idWinner)).toBe(1);
  expect(latestVenueAvailability([oldest, laterCreated, idWinner])).toEqual(idWinner);
  expect(latestVenueAvailability([])).toBeNull();
});

it("derives elapsed option holds as expired without rewriting stored status", () => {
  const held = record({ status: "option_held", optionExpiresAt: "2026-09-09T10:00:00.000Z" });
  expect(effectiveVenueAvailabilityStatus(held, "2026-09-09T09:59:59.999Z")).toBe("option_held");
  expect(effectiveVenueAvailabilityStatus(held, "2026-09-09T10:00:00.000Z")).toBe("expired");
  expect(effectiveVenueAvailabilityStatus(record(), "2026-09-10T10:00:00.000Z")).toBe("available");
  expect(effectiveVenueAvailabilityStatus(record({ status: "option_held", optionExpiresAt: null }), "2026-09-10T10:00:00.000Z")).toBe("option_held");
});

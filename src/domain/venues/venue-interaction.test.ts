import { expect, it } from "vitest";
import {
  normalizeVenueInteraction,
  venueInteractionPayloadEquals,
  type VenueInteractionRecord,
} from "./venue-interaction";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const interactionId = "33333333-3333-4333-8333-333333333333";
const contactId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";

function draft(overrides: Record<string, unknown> = {}) {
  return {
    interactionType: "phone_call",
    occurredAt: "2026-09-08T12:00:00+02:00",
    summary: "  Venue confirmed the quote.  ",
    nextFollowUpAt: null,
    ...overrides,
  };
}

function record(
  overrides: Partial<VenueInteractionRecord> = {},
): VenueInteractionRecord {
  return {
    id: interactionId,
    projectId,
    parentType: "venue",
    venueId,
    contactId,
    interactionType: "phone_call",
    occurredAt: "2026-09-08T10:00:00.000Z",
    summary: "Venue confirmed the quote.",
    nextFollowUpAt: null,
    sourceId,
    createdAt: "2026-09-08T10:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-09-08T10:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
    ...overrides,
  };
}

it("normalizes the frozen interaction text and instant boundaries", () => {
  expect(
    normalizeVenueInteraction(
      draft({ nextFollowUpAt: "2026-09-09T18:00:00+02:00" }),
    ),
  ).toEqual({
    ok: true,
    value: {
      interactionType: "phone_call",
      occurredAt: "2026-09-08T10:00:00.000Z",
      summary: "Venue confirmed the quote.",
      nextFollowUpAt: "2026-09-09T16:00:00.000Z",
    },
  });
  expect(
    normalizeVenueInteraction(draft({ nextFollowUpAt: undefined })),
  ).toMatchObject({ ok: true, value: { nextFollowUpAt: null } });
});

it("keeps follow-up metadata independent from historical ordering semantics", () => {
  expect(
    normalizeVenueInteraction(
      draft({ nextFollowUpAt: "2026-09-07T10:00:00Z" }),
    ),
  ).toMatchObject({
    ok: true,
    value: { nextFollowUpAt: "2026-09-07T10:00:00.000Z" },
  });
});

it("rejects invalid required text and instant boundaries", () => {
  for (const interactionType of [null, "   ", "x".repeat(81)]) {
    expect(normalizeVenueInteraction(draft({ interactionType }))).toEqual({
      ok: false,
      error: "invalid_interaction_type",
    });
  }
  expect(normalizeVenueInteraction(draft({ occurredAt: "tomorrow" }))).toEqual({
    ok: false,
    error: "invalid_occurred_at",
  });
  for (const summary of [null, "   ", "x".repeat(5_001)]) {
    expect(normalizeVenueInteraction(draft({ summary }))).toEqual({
      ok: false,
      error: "invalid_summary",
    });
  }
  expect(
    normalizeVenueInteraction(draft({ nextFollowUpAt: "later" })),
  ).toEqual({ ok: false, error: "invalid_next_follow_up_at" });
});

it("compares replay payloads independently of audit fields", () => {
  const first = record();
  expect(venueInteractionPayloadEquals(first, record({ revision: 7 }))).toBe(
    true,
  );
  for (const changed of [
    record({ projectId: sourceId }),
    record({ venueId: sourceId }),
    record({ contactId: null }),
    record({ interactionType: "email" }),
    record({ occurredAt: "2026-09-08T11:00:00.000Z" }),
    record({ summary: "changed" }),
    record({ nextFollowUpAt: "2026-09-09T10:00:00.000Z" }),
    record({ sourceId: null }),
  ]) {
    expect(venueInteractionPayloadEquals(first, changed)).toBe(false);
  }
});

import { expect, it } from "vitest";
import { parseVenueInteractionRow } from "./parse-venue-interaction-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const interactionId = "33333333-3333-4333-8333-333333333333";
const contactId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";
const actorId = "66666666-6666-4666-8666-666666666666";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: interactionId,
    project_id: projectId,
    parent_type: "venue",
    parent_id: venueId,
    contact_id: contactId,
    interaction_type: "phone_call",
    occurred_at: "2026-09-08T10:00:00.000Z",
    summary: "Quote confirmed.",
    next_follow_up_at: "2026-09-09T10:00:00.000Z",
    source_id: sourceId,
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
    parseVenueInteractionRow(row(), projectId, venueId, interactionId),
  ).toEqual({
    id: interactionId,
    projectId,
    parentType: "venue",
    venueId,
    contactId,
    interactionType: "phone_call",
    occurredAt: "2026-09-08T10:00:00.000Z",
    summary: "Quote confirmed.",
    nextFollowUpAt: "2026-09-09T10:00:00.000Z",
    sourceId,
    createdAt: "2026-09-08T10:01:00.000Z",
    createdBy: actorId,
    updatedAt: "2026-09-08T10:01:00.000Z",
    updatedBy: actorId,
    revision: 1,
  });
  expect(
    parseVenueInteractionRow(
      row({ contact_id: null, source_id: null, next_follow_up_at: null }),
    ),
  ).toMatchObject({ contactId: null, sourceId: null, nextFollowUpAt: null });
});

it("canonicalizes provider microseconds without claiming they are safe to re-sort", () => {
  expect(
    parseVenueInteractionRow(
      row({
        occurred_at: "2026-09-08T10:00:00.000999Z",
        created_at: "2026-09-08T10:01:00.000999Z",
      }),
    ),
  ).toMatchObject({
    occurredAt: "2026-09-08T10:00:00.000Z",
    createdAt: "2026-09-08T10:01:00.000Z",
  });
});

it("rejects non-object, malformed identity and unsupported parent rows", () => {
  for (const value of [null, [], "row"]) {
    expect(() => parseVenueInteractionRow(value)).toThrow(
      "Invalid venue interaction response.",
    );
  }
  for (const overrides of [
    { id: "bad" },
    { project_id: "bad" },
    { parent_id: "bad" },
    { contact_id: "bad" },
    { source_id: "bad" },
    { parent_type: "vendor" },
  ]) {
    expect(() => parseVenueInteractionRow(row(overrides))).toThrow(
      "Invalid venue interaction response.",
    );
  }
});

it("rejects request-identity substitution", () => {
  const other = "77777777-7777-4777-8777-777777777777";
  expect(() =>
    parseVenueInteractionRow(row(), other, venueId, interactionId),
  ).toThrow();
  expect(() =>
    parseVenueInteractionRow(row(), projectId, other, interactionId),
  ).toThrow();
  expect(() =>
    parseVenueInteractionRow(row(), projectId, venueId, other),
  ).toThrow();
});

it("rejects malformed or noncanonical interaction payloads", () => {
  for (const overrides of [
    { interaction_type: "" },
    { interaction_type: " phone_call " },
    { occurred_at: "bad" },
    { summary: "" },
    { summary: " Quote confirmed. " },
    { next_follow_up_at: "bad" },
  ]) {
    expect(() => parseVenueInteractionRow(row(overrides))).toThrow(
      "Invalid venue interaction response.",
    );
  }
});

it("rejects malformed audit identities, timestamps and revisions", () => {
  for (const overrides of [
    { created_by: "bad" },
    { updated_by: "bad" },
    { created_at: "bad" },
    { updated_at: "bad" },
    { revision: 0 },
    { revision: 1.5 },
  ]) {
    expect(() => parseVenueInteractionRow(row(overrides))).toThrow(
      "Invalid venue interaction response.",
    );
  }
});

import { expect, it } from "vitest";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";
import {
  retryableVenueMutation,
  retryableVenueVisitMutation,
  venueReplayCommand,
  VENUE_VISIT_FACT_OBSERVATION_MUTATION,
  VENUE_VISIT_MEMBER_RATING_MUTATION,
  VENUE_VISIT_NOTE_MUTATION,
} from "@application/venues/venue-local-mutation";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const venueId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";
const createdAt = "2026-09-29T17:30:00.000Z";

function visitMutation(
  mutationType: string,
  baseRevision: string | null,
  payload: PendingMutationEnvelope["payload"],
  id = operationId,
): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId: id,
    entityType: "venue",
    entityId: venueId,
    mutationType,
    baseRevision,
    payload,
    createdAt,
    priorityClass: "essential_structured",
  });
}

function notePayload(id = operationId) {
  return {
    interactionId: id,
    contactId: "64444444-4444-4444-8444-444444444444",
    interactionType: "in_person_visit_note",
    occurredAt: createdAt,
    summary: "Accès traiteur à confirmer.",
    nextFollowUpAt: "2026-09-30T17:30:00.000Z",
    sourceId: "65555555-5555-4555-8555-555555555555",
  };
}

function factPayload(id = operationId) {
  return {
    factId: "66666666-6666-4666-8666-666666666666",
    observationId: id,
    value: 12.5,
    rawValueText: "12.5 m",
    evidenceLevel: "observed",
    confidence: "high",
    observedAt: createdAt,
    note: "Mesuré sur place.",
    supersedesObservationId: "67777777-7777-4777-8777-777777777777",
  };
}

function ratingPayload(expectedRevision = 0, rating: number = 8.5) {
  return {
    dimensionKey: "love_score",
    rating,
    expectedRevision,
  };
}

it("reconstructs a replay-safe visit note command", () => {
  const mutation = visitMutation(
    VENUE_VISIT_NOTE_MUTATION,
    null,
    notePayload(),
  );

  expect(venueReplayCommand(mutation, scope)).toEqual({
    kind: "visit_note",
    input: {
      projectId: scope.projectId,
      venueId,
      interactionId: operationId,
      contactId: "64444444-4444-4444-8444-444444444444",
      interactionType: "in_person_visit_note",
      occurredAt: createdAt,
      summary: "Accès traiteur à confirmer.",
      nextFollowUpAt: "2026-09-30T17:30:00.000Z",
      sourceId: "65555555-5555-4555-8555-555555555555",
    },
  });
});

it("reconstructs a replay-safe fact observation command", () => {
  const mutation = visitMutation(
    VENUE_VISIT_FACT_OBSERVATION_MUTATION,
    null,
    factPayload(),
  );

  expect(venueReplayCommand(mutation, scope)).toEqual({
    kind: "fact_observation",
    venueId,
    input: {
      projectId: scope.projectId,
      factId: "66666666-6666-4666-8666-666666666666",
      observationId: operationId,
      value: 12.5,
      rawValueText: "12.5 m",
      evidenceLevel: "observed",
      confidence: "high",
      observedAt: createdAt,
      note: "Mesuré sur place.",
      supersedesObservationId: "67777777-7777-4777-8777-777777777777",
    },
  });
});

it("reconstructs a replay-safe personal rating command", () => {
  const mutation = visitMutation(
    VENUE_VISIT_MEMBER_RATING_MUTATION,
    "0",
    ratingPayload(),
  );

  expect(venueReplayCommand(mutation, scope)).toEqual({
    kind: "member_rating",
    input: {
      projectId: scope.projectId,
      venueId,
      dimensionKey: "love_score",
      rating: 8.5,
      expectedRevision: 0,
      operationId,
      deviceId: scope.deviceId,
    },
  });
});

const invalidCases = [
  [
    "note base revision",
    visitMutation(VENUE_VISIT_NOTE_MUTATION, "1", notePayload()),
  ],
  [
    "note identity mismatch",
    visitMutation(
      VENUE_VISIT_NOTE_MUTATION,
      null,
      notePayload("69999999-9999-4999-8999-999999999999"),
    ),
  ],
  [
    "fact identity mismatch",
    visitMutation(
      VENUE_VISIT_FACT_OBSERVATION_MUTATION,
      null,
      factPayload("69999999-9999-4999-8999-999999999999"),
    ),
  ],
  [
    "rating revision mismatch",
    visitMutation(VENUE_VISIT_MEMBER_RATING_MUTATION, "1", ratingPayload()),
  ],
  [
    "rating missing base revision",
    visitMutation(VENUE_VISIT_MEMBER_RATING_MUTATION, null, ratingPayload()),
  ],
  [
    "rating malformed base revision",
    visitMutation(VENUE_VISIT_MEMBER_RATING_MUTATION, "01", ratingPayload()),
  ],
  [
    "rating non-finite",
    visitMutation(
      VENUE_VISIT_MEMBER_RATING_MUTATION,
      "0",
      ratingPayload(0, Number.NaN),
    ),
  ],
  [
    "rating invalid expected revision",
    visitMutation(VENUE_VISIT_MEMBER_RATING_MUTATION, "0", ratingPayload(-1)),
  ],
] as const;

it.each(invalidCases)("rejects invalid visit %s", (_label, mutation) => {
  expect(() => venueReplayCommand(mutation, scope)).toThrow(
    "Invalid persisted Venue mutation",
  );
});

it.each([
  [VENUE_VISIT_NOTE_MUTATION, null, notePayload()],
  [VENUE_VISIT_FACT_OBSERVATION_MUTATION, null, factPayload()],
  [VENUE_VISIT_MEMBER_RATING_MUTATION, "0", ratingPayload()],
] as const)(
  "keeps %s isolated from core/status replay",
  (mutationType, revision, payload) => {
    const candidate = visitMutation(mutationType, revision, payload);
    expect(retryableVenueMutation(candidate)).toBe(false);
    expect(retryableVenueVisitMutation(candidate)).toBe(true);
    expect(
      retryableVenueVisitMutation({ ...candidate, status: "conflict" }),
    ).toBe(false);
  },
);

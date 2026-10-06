import { describe, expect, it } from "vitest";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import { createPendingMutationEnvelope } from "@application/local-data/local-records";
import { venueReplayCommand } from "@application/venues/venue-local-mutation";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const venueId = "44444444-4444-4444-8444-444444444444";
const factId = "55555555-5555-4555-8555-555555555555";
const observedAt = "2026-10-06T12:00:00.000Z";

function queuedVisitMutation(
  operationId: string,
  mutationType: string,
  baseRevision: string | null,
  payload: Parameters<typeof createPendingMutationEnvelope>[1]["payload"],
) {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType,
    baseRevision,
    payload,
    createdAt: observedAt,
    priorityClass: "essential_structured",
  });
}

describe("WP-2.12 structured visit replay RED", () => {
  it("reconstructs a replay-safe Venue interaction for a visit note", () => {
    const operationId = "61111111-1111-4111-8111-111111111111";

    expect(
      venueReplayCommand(
        queuedVisitMutation(operationId, "append_venue_interaction", null, {
          interactionId: operationId,
          contactId: null,
          interactionType: "in_person_visit_note",
          occurredAt: observedAt,
          summary: "Accès traiteur à confirmer sur place.",
          nextFollowUpAt: null,
          sourceId: null,
        }),
        scope,
      ),
    ).toEqual({
      kind: "visit_note",
      input: {
        projectId: scope.projectId,
        venueId,
        interactionId: operationId,
        contactId: null,
        interactionType: "in_person_visit_note",
        occurredAt: observedAt,
        summary: "Accès traiteur à confirmer sur place.",
        nextFollowUpAt: null,
        sourceId: null,
      },
    });
  });

  it("reconstructs a replay-safe Fact Observation for a visit measurement", () => {
    const operationId = "62222222-2222-4222-8222-222222222222";

    expect(
      venueReplayCommand(
        queuedVisitMutation(
          operationId,
          "append_venue_fact_observation",
          null,
          {
            factId,
            observationId: operationId,
            value: 12.5,
            rawValueText: "12.5 m",
            evidenceLevel: "observed",
            confidence: "high",
            observedAt,
            note: "Mesure prise pendant la visite.",
            supersedesObservationId: null,
          },
        ),
        scope,
      ),
    ).toEqual({
      kind: "fact_observation",
      input: {
        projectId: scope.projectId,
        factId,
        observationId: operationId,
        value: 12.5,
        rawValueText: "12.5 m",
        evidenceLevel: "observed",
        confidence: "high",
        observedAt,
        note: "Mesure prise pendant la visite.",
        supersedesObservationId: null,
      },
    });
  });

  it("reconstructs a replay-safe personal Venue rating", () => {
    const operationId = "63333333-3333-4333-8333-333333333333";

    expect(
      venueReplayCommand(
        queuedVisitMutation(operationId, "set_venue_member_rating", "0", {
          dimensionKey: "love_score",
          rating: 8.5,
          expectedRevision: 0,
        }),
        scope,
      ),
    ).toEqual({
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
});

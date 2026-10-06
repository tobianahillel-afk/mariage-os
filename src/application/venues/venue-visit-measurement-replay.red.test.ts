import { expect, it } from "vitest";
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
const operationId = "62222222-2222-4222-8222-222222222222";
const observedAt = "2026-10-06T12:00:00.000Z";

it("reconstructs a replay-safe Fact Observation for a visit measurement", () => {
  const mutation = createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: "append_venue_fact_observation",
    baseRevision: null,
    payload: {
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
    createdAt: observedAt,
    priorityClass: "essential_structured",
  });

  expect(venueReplayCommand(mutation, scope)).toMatchObject({
    kind: "fact_observation",
    input: {
      projectId: scope.projectId,
      factId,
      observationId: operationId,
    },
  });
});

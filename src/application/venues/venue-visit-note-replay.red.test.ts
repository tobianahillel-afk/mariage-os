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
const operationId = "61111111-1111-4111-8111-111111111111";
const occurredAt = "2026-10-06T12:00:00.000Z";

it("reconstructs a replay-safe Venue interaction for a visit note", () => {
  const mutation = createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: "append_venue_interaction",
    baseRevision: null,
    payload: {
      interactionId: operationId,
      contactId: null,
      interactionType: "in_person_visit_note",
      occurredAt,
      summary: "Accès traiteur à confirmer sur place.",
      nextFollowUpAt: null,
      sourceId: null,
    },
    createdAt: occurredAt,
    priorityClass: "essential_structured",
  });

  expect(venueReplayCommand(mutation, scope)).toMatchObject({
    kind: "visit_note",
    input: {
      projectId: scope.projectId,
      venueId,
      interactionId: operationId,
    },
  });
});

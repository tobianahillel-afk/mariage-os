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
const operationId = "63333333-3333-4333-8333-333333333333";
const createdAt = "2026-10-06T12:00:00.000Z";

it("reconstructs a replay-safe personal Venue rating", () => {
  const mutation = createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: "set_venue_member_rating",
    baseRevision: "0",
    payload: {
      dimensionKey: "love_score",
      rating: 8.5,
      expectedRevision: 0,
    },
    createdAt,
    priorityClass: "essential_structured",
  });

  expect(venueReplayCommand(mutation, scope)).toMatchObject({
    kind: "member_rating",
    input: {
      projectId: scope.projectId,
      venueId,
      operationId,
      deviceId: scope.deviceId,
    },
  });
});

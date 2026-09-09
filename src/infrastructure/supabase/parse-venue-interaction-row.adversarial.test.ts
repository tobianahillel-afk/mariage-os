import { expect, it } from "vitest";
import { parseVenueInteractionRow } from "./parse-venue-interaction-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const interactionId = "33333333-3333-4333-8333-333333333333";
const actorId = "66666666-6666-4666-8666-666666666666";

it("rejects provider rows that omit nullable next_follow_up_at", () => {
  const providerRow: Record<string, unknown> = {
    id: interactionId,
    project_id: projectId,
    parent_type: "venue",
    parent_id: venueId,
    contact_id: null,
    interaction_type: "phone_call",
    occurred_at: "2026-09-08T10:00:00.000Z",
    summary: "Quote confirmed.",
    next_follow_up_at: null,
    source_id: null,
    created_at: "2026-09-08T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-09-08T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
  };
  delete providerRow.next_follow_up_at;

  expect(() => parseVenueInteractionRow(providerRow)).toThrow(
    "Invalid venue interaction response.",
  );
});

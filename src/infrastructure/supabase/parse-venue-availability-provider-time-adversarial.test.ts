import { expect, it } from "vitest";
import { parseVenueAvailabilityRow } from "./parse-venue-availability-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const availabilityId = "33333333-3333-4333-8333-333333333333";
const actorId = "44444444-4444-4444-8444-444444444444";

it("normalizes strict PostgreSQL timestamptz provider representations", () => {
  expect(
    parseVenueAvailabilityRow(
      {
        id: availabilityId,
        project_id: projectId,
        venue_id: venueId,
        date_option_id: null,
        event_date: "2027-06-12",
        status: "option_held",
        option_expires_at: "2026-09-10T16:00:00.123456+00:00",
        observed_at: "2026-09-08T10:00:00+00:00",
        source_id: null,
        notes: "checked",
        created_at: "2026-09-08T10:01:00.987654+00:00",
        created_by: actorId,
        updated_at: "2026-09-08T10:01:00+00:00",
        updated_by: actorId,
        revision: 1,
      },
      projectId,
      venueId,
      availabilityId,
    ),
  ).toMatchObject({
    optionExpiresAt: "2026-09-10T16:00:00.123Z",
    observedAt: "2026-09-08T10:00:00.000Z",
    createdAt: "2026-09-08T10:01:00.987Z",
    updatedAt: "2026-09-08T10:01:00.000Z",
  });
});

import { expect, it } from "vitest";
import type { VenueCompatibilityInputs } from "@application/venues/venue-compatibility-query-port";
import { getVenueCompatibility } from "./venue-compatibility-service";

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const VENUE_ID = "22222222-2222-4222-8222-222222222222";

function portFor(input: VenueCompatibilityInputs) {
  return {
    async loadVenueCompatibilityInputs() {
      return input;
    },
  };
}

it("rejects project identity drift before compatibility evaluation", async () => {
  const input: VenueCompatibilityInputs = {
    projectId: "33333333-3333-4333-8333-333333333333",
    venueId: VENUE_ID,
    projectTargetGuestCount: 160,
    snapshots: [],
  };
  await expect(
    getVenueCompatibility(portFor(input), {
      projectId: PROJECT_ID,
      venueId: VENUE_ID,
      evaluatedAt: "2026-09-07T18:00:00Z",
    }),
  ).rejects.toThrow("Venue compatibility query failed.");
});

import { describe, expect, it } from "vitest";
import { parseVenueWorkspaceRoute } from "./venue-workspace-route";

const venueId = "91111111-1111-4111-8111-111111111111";

describe("WP-2.12 RED — Venue visit route", () => {
  it("recognizes the canonical protected Venue visit route", () => {
    expect(parseVenueWorkspaceRoute(`/venues/${venueId}/visit`)).toEqual({
      kind: "visit",
      venueId,
    });
  });
});

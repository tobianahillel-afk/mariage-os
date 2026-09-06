import { describe, expect, it } from "vitest";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "./venue-repository-port";
import { updateVenueCore } from "./update-venue-core";

const venue: VenueCoreRecord = {
  id: "a1000000-0000-4000-8000-000000000001",
  projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  code: "P2",
  name: "Venue Alpha",
  status: "research",
  rejectionReason: null,
  websiteUrl: "https://example.invalid",
  city: "Paris",
  revision: 2,
};

function repository(
  updateVenueCore: VenueRepositoryPort["updateVenueCore"],
): VenueRepositoryPort {
  return {
    async listVenues() {
      return [];
    },
    async getVenue() {
      return null;
    },
    updateVenueCore,
  };
}

describe("updateVenueCore", () => {
  it("normalizes ordinary fields before persistence", async () => {
    const calls: unknown[] = [];
    const port = repository(async (input) => {
      calls.push(input);
      return venue;
    });

    const result = await updateVenueCore(port, {
      projectId: venue.projectId,
      venueId: venue.id,
      name: "  Venue Alpha  ",
      code: " P2 ",
      websiteUrl: " https://example.invalid ",
      city: " Paris ",
    });

    expect(result).toEqual({ ok: true, venue });
    expect(calls[0]).toEqual({
      projectId: venue.projectId,
      venueId: venue.id,
      name: "Venue Alpha",
      code: "P2",
      websiteUrl: "https://example.invalid",
      city: "Paris",
    });
  });

  it("fails validation before persistence", async () => {
    let calls = 0;
    const port = repository(async () => {
      calls += 1;
      return venue;
    });

    const result = await updateVenueCore(port, {
      projectId: venue.projectId,
      venueId: venue.id,
      name: "   ",
    });

    expect(result).toEqual({ ok: false, error: "name_required" });
    expect(calls).toBe(0);
  });

  it("converts persistence errors into a stable result", async () => {
    const port = repository(async () => {
      throw new Error("provider detail");
    });

    const result = await updateVenueCore(port, {
      projectId: venue.projectId,
      venueId: venue.id,
      name: "Venue Alpha",
    });

    expect(result).toEqual({ ok: false, error: "persistence_failed" });
  });
});

import { describe, expect, it } from "vitest";
import type {
  VenueCommandPort,
  VenueQuickAddInput,
} from "./venue-command-port";
import { quickAddVenue } from "./quick-add-venue";

function commandPort(
  createVenue: VenueCommandPort["createVenue"],
): VenueCommandPort {
  return {
    createVenue,
    async transitionVenue() {
      return 1;
    },
  };
}

describe("quickAddVenue", () => {
  it("normalizes input before sending the canonical create command", async () => {
    const calls: VenueQuickAddInput[] = [];
    const port = commandPort(async (input) => {
      calls.push(input);
      return {
        id: "a1000000-0000-4000-8000-000000000001",
        projectId: input.projectId,
        status: "research",
        revision: 1,
      };
    });

    const result = await quickAddVenue(port, "project-a", {
      name: " Venue Alpha ",
      code: " P2 ",
      websiteUrl: " https://example.invalid ",
      city: " Paris ",
    });

    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      {
        projectId: "project-a",
        name: "Venue Alpha",
        code: "P2",
        websiteUrl: "https://example.invalid",
        city: "Paris",
      },
    ]);
  });

  it("returns validation failure without touching persistence", async () => {
    let calls = 0;
    const port = commandPort(async () => {
      calls += 1;
      throw new Error("unexpected");
    });

    expect(await quickAddVenue(port, "project-a", { name: "   " })).toEqual({
      ok: false,
      error: "name_required",
    });
    expect(calls).toBe(0);
  });

  it("converts persistence failures into a stable application error", async () => {
    const port = commandPort(async () => {
      throw new Error("provider details must not escape");
    });

    expect(await quickAddVenue(port, "project-a", { name: "Venue" })).toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });
});

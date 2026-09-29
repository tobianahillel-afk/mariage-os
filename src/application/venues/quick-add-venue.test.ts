import { describe, expect, it, vi } from "vitest";
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

type FutureQuickAdd = (
  port: VenueCommandPort,
  projectId: string,
  draft: {
    readonly name: string;
    readonly code?: string;
    readonly websiteUrl?: string;
    readonly city?: string;
  },
  cache: {
    cacheCloudVenue(venue: unknown): Promise<void>;
  },
) => Promise<{ readonly ok: boolean; readonly localCache?: string }>;

const futureQuickAddVenue = quickAddVenue as unknown as FutureQuickAdd;

describe("quickAddVenue canonical create", () => {
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

describe("quickAddVenue local cache RED", () => {
  it("caches the normalized cloud-confirmed Venue locally", async () => {
    const cacheCloudVenue = vi.fn().mockResolvedValue(undefined);
    const port = commandPort(async (input) => ({
      id: "a1000000-0000-4000-8000-000000000001",
      projectId: input.projectId,
      status: "research",
      revision: 1,
    }));

    const result = await futureQuickAddVenue(
      port,
      "project-a",
      {
        name: " Venue Alpha ",
        code: " P2 ",
        websiteUrl: " https://example.invalid ",
        city: " Paris ",
      },
      { cacheCloudVenue },
    );

    expect(result).toMatchObject({ ok: true, localCache: "synced" });
    expect(cacheCloudVenue).toHaveBeenCalledWith({
      id: "a1000000-0000-4000-8000-000000000001",
      projectId: "project-a",
      status: "research",
      rejectionReason: null,
      revision: 1,
      name: "Venue Alpha",
      code: "P2",
      websiteUrl: "https://example.invalid",
      city: "Paris",
    });
  });

  it("keeps cloud creation successful when local quick-add caching is unavailable", async () => {
    const port = commandPort(async (input) => ({
      id: "a1000000-0000-4000-8000-000000000001",
      projectId: input.projectId,
      status: "research",
      revision: 1,
    }));

    const result = await futureQuickAddVenue(
      port,
      "project-a",
      { name: "Venue" },
      {
        cacheCloudVenue: async () => {
          throw new Error("synthetic local durability failure");
        },
      },
    );

    expect(result).toMatchObject({ ok: true, localCache: "unavailable" });
  });

});

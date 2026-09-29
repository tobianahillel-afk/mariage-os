import { describe, expect, it, vi } from "vitest";
import type {
  VenueCommandPort,
  VenueQuickAddInput,
} from "./venue-command-port";
import {
  quickAddVenue,
  type VenueQuickAddCachePort,
} from "./quick-add-venue";

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

function cachePort(
  cacheCloudVenue: VenueQuickAddCachePort["cacheCloudVenue"] = async () => {},
): VenueQuickAddCachePort {
  return { cacheCloudVenue };
}

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

    const result = await quickAddVenue(
      port,
      "project-a",
      {
        name: " Venue Alpha ",
        code: " P2 ",
        websiteUrl: " https://example.invalid ",
        city: " Paris ",
      },
      cachePort(),
    );

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

  it("returns validation failure without persistence or cache work", async () => {
    const createVenue = vi.fn().mockRejectedValue(new Error("unexpected"));
    const cacheCloudVenue = vi.fn().mockResolvedValue(undefined);

    expect(
      await quickAddVenue(
        commandPort(createVenue),
        "project-a",
        { name: "   " },
        cachePort(cacheCloudVenue),
      ),
    ).toEqual({ ok: false, error: "name_required" });
    expect(createVenue).not.toHaveBeenCalled();
    expect(cacheCloudVenue).not.toHaveBeenCalled();
  });
});

describe("quickAddVenue confirmed local cache", () => {
  it("caches the normalized cloud-confirmed Venue locally", async () => {
    const cacheCloudVenue = vi.fn().mockResolvedValue(undefined);
    const port = commandPort(async (input) => ({
      id: "a1000000-0000-4000-8000-000000000001",
      projectId: input.projectId,
      status: "research",
      revision: 1,
    }));

    const result = await quickAddVenue(
      port,
      "project-a",
      {
        name: " Venue Alpha ",
        code: " P2 ",
        websiteUrl: " https://example.invalid ",
        city: " Paris ",
      },
      cachePort(cacheCloudVenue),
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

  it("keeps cloud success when local caching is unavailable", async () => {
    const port = commandPort(async (input) => ({
      id: "a1000000-0000-4000-8000-000000000001",
      projectId: input.projectId,
      status: "research",
      revision: 1,
    }));
    const cache = cachePort(async () => {
      throw new Error("synthetic local durability failure");
    });

    const result = await quickAddVenue(
      port,
      "project-a",
      { name: "Venue" },
      cache,
    );

    expect(result).toMatchObject({ ok: true, localCache: "unavailable" });
  });

  it("does not cache a failed cloud creation", async () => {
    const cacheCloudVenue = vi.fn().mockResolvedValue(undefined);
    const port = commandPort(async () => {
      throw new Error("provider details must not escape");
    });

    expect(
      await quickAddVenue(
        port,
        "project-a",
        { name: "Venue" },
        cachePort(cacheCloudVenue),
      ),
    ).toEqual({ ok: false, error: "persistence_failed" });
    expect(cacheCloudVenue).not.toHaveBeenCalled();
  });
});

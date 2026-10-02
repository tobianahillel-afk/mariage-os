import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalProjectStore } from "@application/local-data/local-project-store";
import { venueCachedRecord } from "@application/venues/venue-local-cache";
import type { VenueCoreRecord } from "@application/venues/venue-repository-port";
import { createBrowserShellRuntime } from "./browser-shell-runtime";

const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";
const deviceId = "61111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";
const publishableKey = "sb_publishable_synthetic-browser-key";

function localVenue(): VenueCoreRecord {
  return {
    id: venueId,
    projectId,
    code: "S1",
    name: "Synthetic local Venue",
    status: "research",
    rejectionReason: null,
    websiteUrl: null,
    city: null,
    revision: 1,
  };
}

it("exercises the composed Venue read service with local working state", async () => {
  const venue = localVenue();
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    venue,
    "pending",
  );
  const local = {
    scope: { projectId, userId, deviceId },
    listCachedRecords: vi.fn().mockResolvedValue([record]),
  } as unknown as LocalProjectStore;
  const factory = vi.fn().mockReturnValue({} as SupabaseClient);

  const runtime = createBrowserShellRuntime(
    {
      VITE_SUPABASE_URL: "https://project.example/",
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    },
    factory,
  );

  if (runtime.venueWorkspaceRead === null) {
    throw new Error("Expected composed Venue workspace read service.");
  }
  const result = await runtime.venueWorkspaceRead.list(projectId, local);

  expect(result).toHaveLength(1);
  expect(result[0]?.venue).toEqual(venue);
  expect(result[0]?.syncState).toBe("pending");
});

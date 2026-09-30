import { describe, expect, it } from "vitest";

import type { LocalProjectStore } from "@application/local-data/local-project-store";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";
import { venueCachedRecord } from "@application/venues/venue-local-cache";
import {
  currentDurableVenueResult,
  failureResult,
} from "@application/venues/venue-local-sync-durable-result";
import type { VenueCoreRecord } from "@application/venues/venue-repository-port";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const venueId = "44444444-4444-4444-8444-444444444444";
const otherVenueId = "45555555-5555-4555-8555-555555555555";
const operationId = "55555555-5555-4555-8555-555555555555";
const otherOperationId = "56666666-6666-4666-8666-666666666666";

const venue: VenueCoreRecord = {
  id: venueId,
  projectId: scope.projectId,
  code: null,
  name: "Venue Local",
  status: "research",
  rejectionReason: null,
  websiteUrl: null,
  city: "Paris",
  revision: 1,
};

function mutation(
  target = venueId,
  operation = otherOperationId,
): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId: operation,
    entityType: "venue",
    entityId: target,
    mutationType: "update_venue_core",
    baseRevision: "1",
    payload: { name: "Local" },
    createdAt: "2026-09-30T15:00:00.000Z",
    priorityClass: "essential_structured",
  });
}

function local(
  options: {
    readonly marker?: "synced" | "pending" | "conflict";
    readonly missing?: boolean;
    readonly cacheFailure?: boolean;
    readonly queueFailure?: boolean;
    readonly mutations?: readonly PendingMutationEnvelope[];
  } = {},
): LocalProjectStore {
  const marker = options.marker ?? "synced";
  return {
    scope,
    getCachedRecord: async () => {
      if (options.cacheFailure === true) throw new Error("cache unavailable");
      if (options.missing === true) return null;
      return venueCachedRecord(scope, venue, marker);
    },
    listPendingMutations: async () => {
      if (options.queueFailure === true) throw new Error("queue unavailable");
      return options.mutations ?? [];
    },
  } as unknown as LocalProjectStore;
}

describe("currentDurableVenueResult", () => {
  it("returns the durable cached Venue and marker", async () => {
    await expect(
      currentDurableVenueResult(local({ marker: "conflict" }), venueId),
    ).resolves.toEqual({ state: "conflict", venue });
  });

  it("fails closed when cache is absent or unreadable", async () => {
    await expect(
      currentDurableVenueResult(local({ missing: true }), venueId),
    ).resolves.toEqual({ state: "pending", venue: null });
    await expect(
      currentDurableVenueResult(local({ cacheFailure: true }), venueId),
    ).resolves.toEqual({ state: "pending", venue: null });
  });
});

describe("failureResult", () => {
  it("returns requested failure when no later same-target intent exists", async () => {
    await expect(
      failureResult(
        local({ mutations: [mutation(otherVenueId)] }),
        operationId,
        venueId,
        "failed_permanent",
      ),
    ).resolves.toEqual({ state: "failed_permanent", venue });
  });

  it("does not treat the same operation as a later target", async () => {
    await expect(
      failureResult(
        local({ mutations: [mutation(venueId, operationId)] }),
        operationId,
        venueId,
        "conflict",
      ),
    ).resolves.toEqual({ state: "conflict", venue });
  });

  it("preserves pending/conflict state when another same-target intent exists", async () => {
    await expect(
      failureResult(
        local({ marker: "synced", mutations: [mutation()] }),
        operationId,
        venueId,
        "failed_permanent",
      ),
    ).resolves.toEqual({ state: "pending", venue });
    await expect(
      failureResult(
        local({ marker: "conflict", mutations: [mutation()] }),
        operationId,
        venueId,
        "pending",
      ),
    ).resolves.toEqual({ state: "conflict", venue });
  });

  it("fails closed when queue or durable cache cannot be read", async () => {
    await expect(
      failureResult(
        local({ queueFailure: true }),
        operationId,
        venueId,
        "conflict",
      ),
    ).resolves.toEqual({ state: "pending", venue: null });
    await expect(
      failureResult(local({ missing: true }), operationId, venueId, "conflict"),
    ).resolves.toEqual({ state: "pending", venue: null });
  });
});

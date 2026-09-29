import { describe, expect, it } from "vitest";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  venueCachedRecord,
  venueFromCachedRecord,
} from "@application/venues/venue-local-cache";
import type { VenueCoreRecord } from "@application/venues/venue-repository-port";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);

const venue: VenueCoreRecord = {
  id: "44444444-4444-4444-8444-444444444444",
  projectId: scope.projectId,
  code: "P2",
  name: "Venue Alpha",
  status: "shortlist",
  rejectionReason: null,
  websiteUrl: "https://example.invalid",
  city: "Paris",
  revision: 3,
};

describe("Venue local cache codec", () => {
  it.each(["synced", "pending", "conflict"] as const)(
    "round-trips a %s Venue",
    (syncMarker) => {
      const record = venueCachedRecord(scope, venue, syncMarker);
      expect(record).toMatchObject({
        recordType: "venue",
        entityId: venue.id,
        projectId: venue.projectId,
        serverRevision: "3",
        syncMarker,
      });
      expect(venueFromCachedRecord(record)).toEqual(venue);
    },
  );

  it("rejects cross-project cache writes", () => {
    expect(() =>
      venueCachedRecord(
        scope,
        {
          ...venue,
          projectId: "99999999-9999-4999-8999-999999999999",
        },
        "pending",
      ),
    ).toThrow("another project");
  });

  it("rejects malformed cached Venue payloads", () => {
    const record = venueCachedRecord(scope, venue, "synced");
    expect(() =>
      venueFromCachedRecord({
        ...record,
        payload: { ...record.payload, revision: 0 },
      }),
    ).toThrow("Invalid cached Venue");
    expect(() =>
      venueFromCachedRecord({
        ...record,
        serverRevision: "4",
      }),
    ).toThrow("Invalid cached Venue");
  });
});

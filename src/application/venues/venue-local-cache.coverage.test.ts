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
  code: null,
  name: "Venue Alpha",
  status: "shortlist",
  rejectionReason: null,
  websiteUrl: null,
  city: null,
  revision: 3,
};

function cached() {
  return venueCachedRecord(scope, venue, "synced");
}

describe("Venue cache malformed envelope coverage", () => {
  it.each([
    [
      "wrong record type",
      (record: ReturnType<typeof cached>) => ({
        ...record,
        recordType: "other",
      }),
    ],
    [
      "number payload",
      (record: ReturnType<typeof cached>) => ({ ...record, payload: 7 }),
    ],
    [
      "null payload",
      (record: ReturnType<typeof cached>) => ({ ...record, payload: null }),
    ],
    [
      "array payload",
      (record: ReturnType<typeof cached>) => ({ ...record, payload: [] }),
    ],
    [
      "non-string status",
      (record: ReturnType<typeof cached>) => ({
        ...record,
        payload: { ...(record.payload as object), status: 3 },
      }),
    ],
    [
      "unknown status",
      (record: ReturnType<typeof cached>) => ({
        ...record,
        payload: { ...(record.payload as object), status: "unknown" },
      }),
    ],
    [
      "fractional revision",
      (record: ReturnType<typeof cached>) => ({
        ...record,
        payload: { ...(record.payload as object), revision: 1.5 },
      }),
    ],
    [
      "non-string name",
      (record: ReturnType<typeof cached>) => ({
        ...record,
        payload: { ...(record.payload as object), name: 4 },
      }),
    ],
    [
      "non-string nullable value",
      (record: ReturnType<typeof cached>) => ({
        ...record,
        payload: { ...(record.payload as object), code: 4 },
      }),
    ],
  ] as const)("rejects %s", (_label, mutate) => {
    expect(() => venueFromCachedRecord(mutate(cached()))).toThrow(
      "Invalid cached Venue",
    );
  });

  it("rejects rejected status without a rejection reason", () => {
    const record = cached();
    expect(() =>
      venueFromCachedRecord({
        ...record,
        payload: {
          ...(record.payload as object),
          status: "rejected",
          rejectionReason: null,
        },
      }),
    ).toThrow("Invalid cached Venue");
  });

  it("rejects non-rejected status carrying a rejection reason", () => {
    const record = cached();
    expect(() =>
      venueFromCachedRecord({
        ...record,
        payload: {
          ...(record.payload as object),
          status: "shortlist",
          rejectionReason: "unexpected",
        },
      }),
    ).toThrow("Invalid cached Venue");
  });
});

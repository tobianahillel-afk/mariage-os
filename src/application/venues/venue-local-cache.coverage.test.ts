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

type CachedVenueEnvelope = ReturnType<typeof cached>;
type CachedVenueMutation = (record: CachedVenueEnvelope) => unknown;

const envelopeCases: readonly [
  string,
  CachedVenueMutation,
][] = [
  [
    "wrong record type",
    (record) => ({
      ...record,
      recordType: "other",
    }),
  ],
  ["number payload", (record) => ({ ...record, payload: 7 })],
  ["null payload", (record) => ({ ...record, payload: null })],
  ["array payload", (record) => ({ ...record, payload: [] })],
];

const payloadCases: readonly [string, CachedVenueMutation][] = [
  [
    "non-string status",
    (record) => ({
      ...record,
      payload: { ...(record.payload as object), status: 3 },
    }),
  ],
  [
    "unknown status",
    (record) => ({
      ...record,
      payload: { ...(record.payload as object), status: "unknown" },
    }),
  ],
  [
    "fractional revision",
    (record) => ({
      ...record,
      payload: { ...(record.payload as object), revision: 1.5 },
    }),
  ],
  [
    "non-string name",
    (record) => ({
      ...record,
      payload: { ...(record.payload as object), name: 4 },
    }),
  ],
  [
    "non-string nullable value",
    (record) => ({
      ...record,
      payload: { ...(record.payload as object), code: 4 },
    }),
  ],
];

function expectInvalid(mutate: CachedVenueMutation): void {
  expect(() => venueFromCachedRecord(mutate(cached()) as CachedVenueEnvelope)).toThrow(
    "Invalid cached Venue",
  );
}

describe("Venue cache malformed envelope coverage", () => {
  it.each(envelopeCases)("rejects %s", (_label, mutate) => {
    expectInvalid(mutate);
  });
});

describe("Venue cache malformed payload coverage", () => {
  it.each(payloadCases)("rejects %s", (_label, mutate) => {
    expectInvalid(mutate);
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

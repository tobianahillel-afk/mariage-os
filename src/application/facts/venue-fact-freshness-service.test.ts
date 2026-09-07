import { expect, it } from "vitest";
import {
  setVenueFactFreshness,
  type VenueFactFreshnessPort,
  type VenueFactFreshnessRecord,
} from "./venue-fact-freshness-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";

const record: VenueFactFreshnessRecord = {
  id: factId,
  projectId,
  venueId,
  definitionId,
  lastVerifiedAt: "2026-09-07T08:00:00.000Z",
  staleAt: "2026-10-07T08:00:00.000Z",
  revision: 2,
};

function makePort(
  override?: VenueFactFreshnessPort["setFreshness"],
): VenueFactFreshnessPort {
  return { setFreshness: override ?? (async () => record) };
}

it("normalizes explicit freshness timestamps before persistence", async () => {
  let received: unknown;
  const result = await setVenueFactFreshness(
    makePort(async (input) => {
      received = input;
      return record;
    }),
    {
      projectId,
      factId,
      expectedRevision: 1,
      lastVerifiedAt: "2026-09-07T10:00:00+02:00",
      staleAt: "2026-10-07T10:00:00+02:00",
    },
  );
  expect(result).toEqual({ ok: true, fact: record });
  expect(received).toEqual({
    projectId,
    factId,
    expectedRevision: 1,
    lastVerifiedAt: "2026-09-07T08:00:00.000Z",
    staleAt: "2026-10-07T08:00:00.000Z",
  });
});

it("rejects invalid freshness revision before persistence", async () => {
  let calls = 0;
  const port = makePort(async () => {
    calls += 1;
    return record;
  });
  await expect(
    setVenueFactFreshness(port, {
      projectId,
      factId,
      expectedRevision: 0,
      lastVerifiedAt: null,
      staleAt: null,
    }),
  ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
  expect(calls).toBe(0);
});

it("rejects staleAt without verification before persistence", async () => {
  let calls = 0;
  const port = makePort(async () => {
    calls += 1;
    return record;
  });
  await expect(
    setVenueFactFreshness(port, {
      projectId,
      factId,
      expectedRevision: 1,
      lastVerifiedAt: null,
      staleAt: "2026-10-07T08:00:00Z",
    }),
  ).resolves.toEqual({
    ok: false,
    error: "stale_without_last_verified_at",
  });
  expect(calls).toBe(0);
});

it("maps freshness persistence failures without leaking provider details", async () => {
  const result = await setVenueFactFreshness(
    makePort(async () => {
      throw new Error("secret provider detail");
    }),
    {
      projectId,
      factId,
      expectedRevision: 1,
      lastVerifiedAt: null,
      staleAt: null,
    },
  );
  expect(result).toEqual({ ok: false, error: "persistence_failed" });
});

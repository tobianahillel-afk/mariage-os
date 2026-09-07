import { describe, expect, it } from "vitest";
import { parseVenueFactFreshnessRow } from "./parse-venue-fact-freshness-row";

const projectId = "81111111-1111-4111-8111-111111111111";
const otherProjectId = "91111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";

const row = {
  id: factId,
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
  last_verified_at: "2026-09-07T10:00:00+02:00",
  stale_at: "2026-10-07T10:00:00+02:00",
  revision: 2,
};

describe("venue fact freshness provider parsing", () => {
  it("parses explicit freshness timestamps without deriving state", () => {
    expect(parseVenueFactFreshnessRow(row, projectId, factId)).toEqual({
      id: factId,
      projectId,
      venueId,
      definitionId,
      lastVerifiedAt: "2026-09-07T08:00:00.000Z",
      staleAt: "2026-10-07T08:00:00.000Z",
      revision: 2,
    });
  });

  it("accepts explicit unknown freshness", () => {
    expect(
      parseVenueFactFreshnessRow(
        { ...row, last_verified_at: null, stale_at: null },
        projectId,
        factId,
      ),
    ).toMatchObject({ lastVerifiedAt: null, staleAt: null });
  });

  it("rejects cross-project and non-venue rows", () => {
    for (const candidate of [
      { ...row, project_id: otherProjectId },
      { ...row, target_type: "vendor" },
    ]) {
      expect(() =>
        parseVenueFactFreshnessRow(candidate, projectId, factId),
      ).toThrow("Invalid venue fact freshness response.");
    }
  });

  it("rejects malformed revision and freshness relationships", () => {
    for (const candidate of [
      { ...row, revision: 0 },
      { ...row, last_verified_at: null },
      {
        ...row,
        last_verified_at: "2026-10-07T08:00:00Z",
        stale_at: "2026-09-07T08:00:00Z",
      },
      { ...row, stale_at: "not-an-instant" },
    ]) {
      expect(() =>
        parseVenueFactFreshnessRow(candidate, projectId, factId),
      ).toThrow("Invalid venue fact freshness response.");
    }
  });
});

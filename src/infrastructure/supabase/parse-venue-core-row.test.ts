import { describe, expect, it } from "vitest";
import { parseVenueCoreRow } from "./parse-venue-core-row";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const validRow = {
  id: "a1000000-0000-4000-8000-000000000001",
  project_id: projectId,
  code: "P2",
  name: "Venue Alpha",
  status: "research",
  rejection_reason: null,
  website_url: "https://example.invalid",
  city: "Paris",
  revision: 2,
};

const malformedRows: readonly unknown[] = [
  42,
  null,
  [],
  { ...validRow, project_id: 7 },
  { ...validRow, project_id: "not-a-uuid" },
  { ...validRow, project_id: otherProjectId },
  { ...validRow, status: 7 },
  { ...validRow, status: "mystery" },
  { ...validRow, rejection_reason: "stale" },
  { ...validRow, status: "rejected", rejection_reason: null },
  { ...validRow, id: 7 },
  { ...validRow, id: "not-a-uuid" },
  { ...validRow, code: 7 },
  { ...validRow, name: 7 },
  { ...validRow, website_url: 7 },
  { ...validRow, city: 7 },
  { ...validRow, revision: "2" },
  { ...validRow, revision: 1.5 },
  { ...validRow, revision: 0 },
];

describe("parseVenueCoreRow valid rows", () => {
  it("maps a venue row into the application contract", () => {
    expect(parseVenueCoreRow(validRow, projectId)).toEqual({
      id: validRow.id,
      projectId,
      code: "P2",
      name: "Venue Alpha",
      status: "research",
      rejectionReason: null,
      websiteUrl: "https://example.invalid",
      city: "Paris",
      revision: 2,
    });
  });

  it("accepts a consistent rejected venue", () => {
    const rejected = {
      ...validRow,
      status: "rejected",
      rejection_reason: "Too small",
    };

    expect(parseVenueCoreRow(rejected, projectId).rejectionReason).toBe(
      "Too small",
    );
  });
});

describe("parseVenueCoreRow invalid rows", () => {
  it.each(malformedRows)("fails closed for malformed row %#", (row) => {
    expect(() => parseVenueCoreRow(row, projectId)).toThrow(
      "Invalid venue response.",
    );
  });
});

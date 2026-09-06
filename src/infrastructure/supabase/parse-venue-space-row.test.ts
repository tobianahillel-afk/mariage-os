import { describe, expect, it } from "vitest";
import { parseVenueSpaceRow } from "./parse-venue-space-row";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const venueId = "a1000000-0000-4000-8000-000000000001";
const otherVenueId = "a1000000-0000-4000-8000-000000000002";

const validRow = {
  id: "a2000000-0000-4000-8000-000000000001",
  project_id: projectId,
  venue_id: venueId,
  name: "Orangerie",
  space_type: "reception_room",
  indoor: true,
  area_m2: 300,
  length_m: 20,
  width_m: 15,
  height_m: 4,
  capacity_seated: 180,
  capacity_cocktail: 240,
  sort_order: 1,
  notes: "Main room",
  revision: 2,
};

describe("parseVenueSpaceRow", () => {
  it("maps a project-bound Venue space response", () => {
    expect(parseVenueSpaceRow(validRow, projectId, venueId)).toEqual({
      id: validRow.id,
      projectId,
      venueId,
      name: "Orangerie",
      spaceType: "reception_room",
      indoor: true,
      areaM2: 300,
      lengthM: 20,
      widthM: 15,
      heightM: 4,
      capacitySeated: 180,
      capacityCocktail: 240,
      sortOrder: 1,
      notes: "Main room",
      revision: 2,
    });
  });

  it("accepts legitimate unknown nullable physical fields", () => {
    const row = {
      ...validRow,
      indoor: null,
      area_m2: null,
      length_m: null,
      width_m: null,
      height_m: null,
      capacity_seated: null,
      capacity_cocktail: null,
      notes: null,
    };
    const parsed = parseVenueSpaceRow(row, projectId, venueId);
    expect(parsed.indoor).toBeNull();
    expect(parsed.areaM2).toBeNull();
    expect(parsed.capacitySeated).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it.each([
    42,
    null,
    [],
    { ...validRow, project_id: 7 },
    { ...validRow, project_id: "not-a-uuid" },
    { ...validRow, project_id: otherProjectId },
    { ...validRow, venue_id: "not-a-uuid" },
    { ...validRow, venue_id: otherVenueId },
    { ...validRow, id: "not-a-uuid" },
    { ...validRow, name: 7 },
    { ...validRow, name: "   " },
    { ...validRow, name: "x".repeat(161) },
    { ...validRow, space_type: "   " },
    { ...validRow, space_type: "x".repeat(81) },
    { ...validRow, indoor: "yes" },
    { ...validRow, area_m2: "300" },
    { ...validRow, area_m2: Number.NaN },
    { ...validRow, area_m2: 0 },
    { ...validRow, capacity_seated: 1.5 },
    { ...validRow, capacity_seated: -1 },
    { ...validRow, sort_order: 1.5 },
    { ...validRow, notes: 7 },
    { ...validRow, notes: "x".repeat(5_001) },
    { ...validRow, revision: 1.5 },
    { ...validRow, revision: 0 },
  ] as const)("fails closed for malformed response %#", (row) => {
    expect(() => parseVenueSpaceRow(row, projectId, venueId)).toThrow(
      "Invalid venue space response.",
    );
  });
});

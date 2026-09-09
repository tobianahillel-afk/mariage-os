import { expect, it } from "vitest";
import { parseVenueReferenceOriginRow } from "./parse-venue-reference-origin-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const originId = "22222222-2222-4222-8222-222222222222";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: originId,
    project_id: projectId,
    label: "Paris",
    address_text: "1 Rue Test",
    latitude: 48.8566,
    longitude: 2.3522,
    is_default: true,
    ...overrides,
  };
}

it("parses canonical default origins with and without location", () => {
  expect(parseVenueReferenceOriginRow(row(), projectId)).toEqual({
    id: originId,
    projectId,
    label: "Paris",
    addressText: "1 Rue Test",
    latitude: 48.8566,
    longitude: 2.3522,
    isDefault: true,
  });
  expect(
    parseVenueReferenceOriginRow(
      row({ address_text: null, latitude: null, longitude: null }),
    ),
  ).toMatchObject({
    addressText: null,
    latitude: null,
    longitude: null,
  });
});

it("rejects malformed rows, identities and non-default origins", () => {
  for (const value of [null, [], "row"]) {
    expect(() => parseVenueReferenceOriginRow(value)).toThrow(
      "Invalid venue reference origin response.",
    );
  }
  for (const overrides of [
    { id: "bad" },
    { project_id: "bad" },
    { is_default: false },
  ]) {
    expect(() => parseVenueReferenceOriginRow(row(overrides))).toThrow(
      "Invalid venue reference origin response.",
    );
  }
  expect(() =>
    parseVenueReferenceOriginRow(row(), "33333333-3333-4333-8333-333333333333"),
  ).toThrow();
});

it("rejects malformed or noncanonical labels and addresses", () => {
  for (const overrides of [
    { label: 12 },
    { label: "" },
    { label: "  Paris  " },
    { address_text: 12 },
    { address_text: "  1 Rue Test  " },
  ]) {
    expect(() => parseVenueReferenceOriginRow(row(overrides))).toThrow(
      "Invalid venue reference origin response.",
    );
  }
});

it("rejects malformed coordinates and incomplete coordinate pairs", () => {
  for (const overrides of [
    { latitude: "48" },
    { longitude: "2" },
    { latitude: 91 },
    { longitude: 181 },
    { latitude: null },
    { longitude: null },
  ]) {
    expect(() => parseVenueReferenceOriginRow(row(overrides))).toThrow(
      "Invalid venue reference origin response.",
    );
  }
});

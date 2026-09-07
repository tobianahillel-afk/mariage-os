import { expect, it } from "vitest";
import { parseVenueCompatibilityInputs } from "./parse-venue-compatibility-inputs";

const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_PROJECT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VENUE_ID = "a1000000-0000-4000-8000-000000000001";

function parseProject(project: unknown) {
  return parseVenueCompatibilityInputs(
    {
      project,
      venue: { id: VENUE_ID, project_id: PROJECT_ID },
      definitions: [],
      facts: [],
      observations: [],
    },
    PROJECT_ID,
    VENUE_ID,
  );
}

it("rejects non-numeric project target guest counts", () => {
  expect(() =>
    parseProject({ id: PROJECT_ID, target_guest_count: "160" }),
  ).toThrow("Invalid venue compatibility response.");
});

it("rejects a valid project identifier from another project", () => {
  expect(() =>
    parseProject({ id: OTHER_PROJECT_ID, target_guest_count: 160 }),
  ).toThrow("Invalid venue compatibility response.");
});

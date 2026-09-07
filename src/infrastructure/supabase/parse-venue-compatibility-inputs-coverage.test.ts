import { expect, it } from "vitest";
import { parseVenueCompatibilityInputs } from "./parse-venue-compatibility-inputs";

const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VENUE_ID = "a1000000-0000-4000-8000-000000000001";

it("rejects non-numeric project target guest counts", () => {
  expect(() =>
    parseVenueCompatibilityInputs(
      {
        project: { id: PROJECT_ID, target_guest_count: "160" },
        venue: { id: VENUE_ID, project_id: PROJECT_ID },
        definitions: [],
        facts: [],
        observations: [],
      },
      PROJECT_ID,
      VENUE_ID,
    ),
  ).toThrow("Invalid venue compatibility response.");
});

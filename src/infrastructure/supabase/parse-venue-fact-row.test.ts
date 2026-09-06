import { describe, expect, it } from "vitest";
import type { VenueFactDefinitionRecord } from "@application/facts/venue-fact-service";
import {
  parseRetainedVenueFactRow,
  parseVenueFactDefinitionRow,
} from "./parse-venue-fact-row";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";

const definitionRow = {
  id: definitionId,
  project_id: projectId,
  key: "external_caterer_allowed",
  label: "External caterer allowed",
  entity_type: "venue",
  value_type: "boolean",
  unit: null,
  priority: "blocking",
  weight: 3,
  freshness_policy: null,
  system_defined: false,
  options_json: null,
  evaluation_rule_json: { type: "boolean_equals", expected: true },
  revision: 1,
} as const;

const definition: VenueFactDefinitionRecord = {
  id: definitionId,
  projectId,
  key: "external_caterer_allowed",
  label: "External caterer allowed",
  entityType: "venue",
  valueType: "boolean",
  unit: null,
  priority: "blocking",
  weight: 3,
  freshnessPolicy: null,
  systemDefined: false,
  optionsJson: null,
  evaluationRuleJson: { type: "boolean_equals", expected: true },
  revision: 1,
};

const factRow = {
  id: factId,
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
  state: "known",
  retained_value: false,
  revision: 1,
} as const;

describe("parseVenueFactDefinitionRow", () => {
  it("parses and revalidates a canonical provider row", () => {
    expect(parseVenueFactDefinitionRow(definitionRow, projectId)).toEqual(
      definition,
    );
  });

  it.each([
    null,
    [],
    { ...definitionRow, project_id: "not-a-uuid" },
    { ...definitionRow, project_id: "85555555-5555-4555-8555-555555555555" },
    { ...definitionRow, entity_type: "vendor" },
    { ...definitionRow, system_defined: "false" },
    { ...definitionRow, key: "Bad Key" },
    { ...definitionRow, id: 1 },
    { ...definitionRow, id: "bad" },
    { ...definitionRow, revision: 0 },
    { ...definitionRow, revision: 1.5 },
  ])("rejects malformed definition response %#", (row) => {
    expect(() => parseVenueFactDefinitionRow(row, projectId)).toThrow(
      "Invalid venue fact response.",
    );
  });
});

describe("parseRetainedVenueFactRow", () => {
  it("parses a canonical retained fact without collapsing false", () => {
    expect(
      parseRetainedVenueFactRow(factRow, projectId, venueId, definition),
    ).toEqual({
      id: factId,
      projectId,
      venueId,
      definitionId,
      state: "known",
      retainedValue: false,
      revision: 1,
    });
  });

  it.each([
    null,
    { ...factRow, project_id: "85555555-5555-4555-8555-555555555555" },
    { ...factRow, target_id: "85555555-5555-4555-8555-555555555555" },
    { ...factRow, target_type: "vendor" },
    { ...factRow, definition_id: "85555555-5555-4555-8555-555555555555" },
    { ...factRow, state: "known", retained_value: "false" },
    { ...factRow, id: "bad" },
    { ...factRow, revision: 0 },
  ])("rejects malformed retained fact response %#", (row) => {
    expect(() =>
      parseRetainedVenueFactRow(row, projectId, venueId, definition),
    ).toThrow("Invalid venue fact response.");
  });
});

import { expect, it } from "vitest";
import type { VenueFactDefinitionRecord } from "@application/facts/venue-fact-service";
import { parseVenueFactFreshnessRow } from "./parse-venue-fact-freshness-row";
import { parseWithdrawnVenueFactObservationRow } from "./parse-venue-fact-observation-lifecycle-row";
import { venueFactContextFromIdentity } from "./parse-venue-fact-evidence-row";

const projectId = "81111111-1111-4111-8111-111111111111";
const otherProjectId = "91111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";
const sourceId = "85555555-5555-4555-8555-555555555555";
const observationId = "86666666-6666-4666-8666-666666666666";

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

const identity = { factId, projectId, venueId, definitionId };
const freshnessRow = {
  id: factId,
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
  last_verified_at: "2026-09-07T08:00:00.000Z",
  stale_at: "2026-10-07T08:00:00.000Z",
  revision: 2,
};
const withdrawalRow = {
  id: observationId,
  project_id: projectId,
  fact_id: factId,
  observation_status: "withdrawn",
  superseded_by_observation_id: null,
};

it("rejects definitions inconsistent with a parsed fact identity", () => {
  for (const candidate of [
    { ...definition, id: factId },
    { ...definition, projectId: otherProjectId },
  ]) {
    expect(() => venueFactContextFromIdentity(identity, candidate)).toThrow(
      "Invalid venue fact evidence response.",
    );
  }
});

it("rejects malformed freshness provider shapes and scalar fields", () => {
  for (const candidate of [42, null, []]) {
    expect(() =>
      parseVenueFactFreshnessRow(candidate, projectId, factId),
    ).toThrow("Invalid venue fact freshness response.");
  }
  for (const candidate of [
    { ...freshnessRow, id: definitionId },
    { ...freshnessRow, target_id: 42 },
    { ...freshnessRow, target_id: "not-a-uuid" },
    { ...freshnessRow, revision: "2" },
  ]) {
    expect(() =>
      parseVenueFactFreshnessRow(candidate, projectId, factId),
    ).toThrow("Invalid venue fact freshness response.");
  }
});

it("rejects every malformed withdrawal identity and provider shape", () => {
  for (const candidate of [42, null, []]) {
    expect(() =>
      parseWithdrawnVenueFactObservationRow(
        candidate,
        projectId,
        factId,
        observationId,
      ),
    ).toThrow("Invalid venue fact observation lifecycle response.");
  }
  for (const candidate of [
    { ...withdrawalRow, id: sourceId },
    { ...withdrawalRow, project_id: otherProjectId },
    { ...withdrawalRow, fact_id: definitionId },
    { ...withdrawalRow, observation_status: "active" },
    { ...withdrawalRow, superseded_by_observation_id: observationId },
    { ...withdrawalRow, id: 42 },
    { ...withdrawalRow, id: "not-a-uuid" },
  ]) {
    expect(() =>
      parseWithdrawnVenueFactObservationRow(
        candidate,
        projectId,
        factId,
        observationId,
      ),
    ).toThrow("Invalid venue fact observation lifecycle response.");
  }
});

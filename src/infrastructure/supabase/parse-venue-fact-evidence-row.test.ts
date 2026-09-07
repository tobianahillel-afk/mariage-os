import { describe, expect, it } from "vitest";
import type { VenueFactContext } from "@application/facts/venue-fact-evidence-service";
import type { VenueFactDefinitionRecord } from "@application/facts/venue-fact-service";
import {
  parseObservationSourceLinkRow,
  parseResolvedVenueFactEvidenceRow,
  parseVenueFactContextIdentity,
  parseVenueFactObservationRow,
  parseVenueFactSourceRow,
  venueFactContextFromIdentity,
} from "./parse-venue-fact-evidence-row";

const projectId = "81111111-1111-4111-8111-111111111111";
const otherProjectId = "91111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";
const sourceId = "85555555-5555-4555-8555-555555555555";
const observationId = "86666666-6666-4666-8666-666666666666";
const actorId = "87777777-7777-4777-8777-777777777777";

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

const context: VenueFactContext = {
  factId,
  projectId,
  venueId,
  definition,
};

const sourceRow = {
  id: sourceId,
  project_id: projectId,
  source_type: "written_confirmation",
  title: "Venue email",
  url: "https://venue.example/confirmation",
  evidence_level: "confirmed_for_event",
  observed_at: "2026-09-07T08:20:00+02:00",
  notes: null,
  status: "active",
  revision: 1,
};

const observationRow = {
  id: observationId,
  project_id: projectId,
  fact_id: factId,
  value: false,
  raw_value_text: "No",
  evidence_level: "confirmed_for_event",
  confidence: "high",
  observation_status: "active",
  superseded_by_observation_id: null,
  observed_at: "2026-09-07T08:30:00+02:00",
  note: null,
  created_by: actorId,
};

const resolvedRow = {
  id: factId,
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
  state: "known",
  retained_value: false,
  retained_observation_id: observationId,
  resolution_note: null,
  resolved_by: actorId,
  resolved_at: "2026-09-07T08:40:00+02:00",
  last_verified_at: null,
  stale_at: null,
  revision: 2,
};

describe("venue fact evidence provider parsing", () => {
  it("parses fact context identity and binds the expected definition", () => {
    const identity = parseVenueFactContextIdentity(
      {
        id: factId,
        project_id: projectId,
        target_type: "venue",
        target_id: venueId,
        definition_id: definitionId,
      },
      projectId,
      factId,
    );
    expect(venueFactContextFromIdentity(identity, definition)).toEqual(context);
  });

  it("rejects cross-project or non-venue fact context responses", () => {
    expect(() =>
      parseVenueFactContextIdentity(
        {
          id: factId,
          project_id: otherProjectId,
          target_type: "venue",
          target_id: venueId,
          definition_id: definitionId,
        },
        projectId,
        factId,
      ),
    ).toThrow("Invalid venue fact evidence response.");
    expect(() =>
      parseVenueFactContextIdentity(
        {
          id: factId,
          project_id: projectId,
          target_type: "vendor",
          target_id: venueId,
          definition_id: definitionId,
        },
        projectId,
        factId,
      ),
    ).toThrow("Invalid venue fact evidence response.");
  });

  it("parses source metadata without deriving evidence or confidence", () => {
    expect(parseVenueFactSourceRow(sourceRow, projectId, sourceId)).toEqual({
      id: sourceId,
      projectId,
      sourceType: "written_confirmation",
      title: "Venue email",
      url: "https://venue.example/confirmation",
      evidenceLevel: "confirmed_for_event",
      observedAt: "2026-09-07T06:20:00.000Z",
      notes: null,
      status: "active",
      revision: 1,
    });
  });

  it("rejects malformed source project, status and revision responses", () => {
    for (const row of [
      { ...sourceRow, project_id: otherProjectId },
      { ...sourceRow, status: "deleted" },
      { ...sourceRow, revision: 0 },
    ]) {
      expect(() => parseVenueFactSourceRow(row, projectId, sourceId)).toThrow(
        "Invalid venue fact evidence response.",
      );
    }
  });

  it("parses an explicit known-false observation with independent confidence", () => {
    expect(
      parseVenueFactObservationRow(observationRow, context, observationId),
    ).toEqual({
      id: observationId,
      projectId,
      factId,
      value: false,
      rawValueText: "No",
      evidenceLevel: "confirmed_for_event",
      confidence: "high",
      observedAt: "2026-09-07T06:30:00.000Z",
      note: null,
      status: "active",
      supersededByObservationId: null,
      createdBy: actorId,
    });
  });

  it("rejects cross-fact, malformed typed value and invalid status observations", () => {
    for (const row of [
      { ...observationRow, fact_id: definitionId },
      { ...observationRow, value: "false" },
      { ...observationRow, observation_status: "deleted" },
    ]) {
      expect(() =>
        parseVenueFactObservationRow(row, context, observationId),
      ).toThrow("Invalid venue fact evidence response.");
    }
  });

  it("parses same-project many-to-many evidence links", () => {
    expect(
      parseObservationSourceLinkRow(
        {
          project_id: projectId,
          observation_id: observationId,
          source_id: sourceId,
          is_primary: true,
        },
        projectId,
        observationId,
        sourceId,
      ),
    ).toEqual({ projectId, observationId, sourceId, isPrimary: true });
  });

  it("rejects malformed or cross-project evidence links", () => {
    expect(() =>
      parseObservationSourceLinkRow(
        {
          project_id: otherProjectId,
          observation_id: observationId,
          source_id: sourceId,
          is_primary: true,
        },
        projectId,
        observationId,
        sourceId,
      ),
    ).toThrow("Invalid venue fact evidence response.");
    expect(() =>
      parseObservationSourceLinkRow(
        {
          project_id: projectId,
          observation_id: observationId,
          source_id: sourceId,
          is_primary: "true",
        },
        projectId,
        observationId,
        sourceId,
      ),
    ).toThrow("Invalid venue fact evidence response.");
  });

  it("parses explicit retained-observation resolution audit safely", () => {
    expect(
      parseResolvedVenueFactEvidenceRow(resolvedRow, context, observationId),
    ).toEqual({
      id: factId,
      projectId,
      venueId,
      definitionId,
      state: "known",
      retainedValue: false,
      retainedObservationId: observationId,
      resolutionNote: null,
      revision: 2,
    });
  });

  it("rejects mismatched retained evidence and malformed resolution audit", () => {
    for (const row of [
      { ...resolvedRow, retained_observation_id: sourceId },
      { ...resolvedRow, retained_value: "false" },
      { ...resolvedRow, resolved_by: null },
      { ...resolvedRow, resolved_at: "yesterday" },
      { ...resolvedRow, stale_at: "not-an-instant" },
    ]) {
      expect(() =>
        parseResolvedVenueFactEvidenceRow(row, context, observationId),
      ).toThrow("Invalid venue fact evidence response.");
    }
  });
});

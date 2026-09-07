import { expect, it } from "vitest";
import type { VenueFactContext } from "@application/facts/venue-fact-evidence-service";
import {
  parseResolvedVenueFactEvidenceRow,
  parseVenueFactObservationRow,
  parseVenueFactSourceRow,
} from "./parse-venue-fact-evidence-row";
import { parseVenueFactFreshnessRow } from "./parse-venue-fact-freshness-row";

const projectId = "91111111-1111-4111-8111-111111111111";
const venueId = "92222222-2222-4222-8222-222222222222";
const definitionId = "93333333-3333-4333-8333-333333333333";
const factId = "94444444-4444-4444-8444-444444444444";
const observationId = "95555555-5555-4555-8555-555555555555";
const sourceId = "96666666-6666-4666-8666-666666666666";
const actorId = "97777777-7777-4777-8777-777777777777";

const context: VenueFactContext = {
  factId,
  projectId,
  venueId,
  definition: {
    id: definitionId,
    projectId,
    entityType: "venue",
    systemDefined: false,
    revision: 1,
    key: "timestamp_parity",
    label: "Timestamp parity",
    valueType: "boolean",
    unit: null,
    priority: "important",
    weight: null,
    freshnessPolicy: null,
    optionsJson: null,
    evaluationRuleJson: null,
  },
};

it("parses PostgreSQL microsecond evidence and server resolution timestamps", () => {
  expect(
    parseVenueFactSourceRow(
      {
        id: sourceId,
        project_id: projectId,
        source_type: "written_confirmation",
        title: "Venue email",
        url: null,
        evidence_level: "confirmed_for_event",
        observed_at: "2026-09-07T10:10:11.123456+00:00",
        notes: null,
        status: "active",
        revision: 1,
      },
      projectId,
      sourceId,
    ).observedAt,
  ).toBe("2026-09-07T10:10:11.123Z");

  expect(
    parseVenueFactObservationRow(
      {
        id: observationId,
        project_id: projectId,
        fact_id: factId,
        value: true,
        raw_value_text: null,
        evidence_level: "confirmed_for_event",
        confidence: "high",
        observation_status: "active",
        superseded_by_observation_id: null,
        observed_at: "2026-09-07T10:11:12.654321+00:00",
        note: null,
        created_by: actorId,
      },
      context,
      observationId,
    ).observedAt,
  ).toBe("2026-09-07T10:11:12.654Z");

  expect(() =>
    parseResolvedVenueFactEvidenceRow(
      {
        id: factId,
        project_id: projectId,
        target_type: "venue",
        target_id: venueId,
        definition_id: definitionId,
        state: "known",
        retained_value: true,
        retained_observation_id: observationId,
        resolution_note: null,
        resolved_by: actorId,
        resolved_at: "2026-09-07T10:12:13.987654+00:00",
        last_verified_at: null,
        stale_at: null,
        revision: 2,
      },
      context,
      observationId,
    ),
  ).not.toThrow();
});

it("parses PostgreSQL microsecond freshness fields to canonical milliseconds", () => {
  expect(
    parseVenueFactFreshnessRow(
      {
        id: factId,
        project_id: projectId,
        target_type: "venue",
        target_id: venueId,
        definition_id: definitionId,
        revision: 3,
        last_verified_at: "2026-09-07T10:13:14.123456+00:00",
        stale_at: "2026-10-07T10:13:14.654321+00:00",
      },
      projectId,
      factId,
    ),
  ).toMatchObject({
    lastVerifiedAt: "2026-09-07T10:13:14.123Z",
    staleAt: "2026-10-07T10:13:14.654Z",
  });
});

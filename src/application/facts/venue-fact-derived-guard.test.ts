import { expect, it } from "vitest";
import {
  appendVenueFactObservation,
  resolveVenueFactFromObservation,
  type VenueFactContext,
  type VenueFactEvidencePort,
} from "./venue-fact-evidence-service";
import {
  createVenueFactDefinition,
  setRetainedVenueFact,
  type VenueFactDefinitionRecord,
  type VenueFactPort,
} from "./venue-fact-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";
const observationId = "85555555-5555-4555-8555-555555555555";

const derivedDefinition: VenueFactDefinitionRecord = {
  id: definitionId,
  projectId,
  entityType: "venue",
  systemDefined: true,
  revision: 1,
  key: "target_guest_count_supported",
  label: "Target guest count supported",
  valueType: "boolean",
  unit: null,
  priority: "blocking",
  weight: null,
  freshnessPolicy: null,
  optionsJson: null,
  evaluationRuleJson: { type: "project_target_guest_count_supported" },
};

function factPort(): VenueFactPort {
  return {
    getDefinition: async () => derivedDefinition,
    createDefinition: async () => derivedDefinition,
    updateDefinition: async () => derivedDefinition,
    setRetainedFact: async () => {
      throw new Error("must not mutate");
    },
  };
}

function evidencePort(): VenueFactEvidencePort {
  const context: VenueFactContext = {
    factId,
    projectId,
    venueId,
    definition: derivedDefinition,
  };
  return {
    getFactContext: async () => context,
    createSource: async () => Promise.reject(new Error("unused")),
    updateSource: async () => Promise.reject(new Error("unused")),
    appendObservation: async () => Promise.reject(new Error("must not mutate")),
    linkObservationSource: async () => Promise.reject(new Error("unused")),
    resolveFromObservation: async () =>
      Promise.reject(new Error("must not mutate")),
  };
}

it("rejects ordinary creation of the reserved dynamic rule", async () => {
  await expect(
    createVenueFactDefinition(factPort(), {
      projectId,
      key: "target_guest_count_supported",
      label: "Target support",
      valueType: "boolean",
      unit: null,
      priority: "blocking",
      weight: null,
      freshnessPolicy: null,
      optionsJson: null,
      evaluationRuleJson: { type: "project_target_guest_count_supported" },
    }),
  ).resolves.toEqual({ ok: false, error: "invalid_evaluation_rule" });
});

it("rejects retained writes for the derived target-support criterion", async () => {
  await expect(
    setRetainedVenueFact(factPort(), {
      projectId,
      venueId,
      definitionId,
      expectedRevision: null,
      state: "known",
      retainedValue: true,
    }),
  ).resolves.toEqual({ ok: false, error: "derived_fact_read_only" });
});

it("rejects observation append and resolution for the derived criterion", async () => {
  const port = evidencePort();
  await expect(
    appendVenueFactObservation(port, {
      projectId,
      factId,
      supersedesObservationId: null,
      value: true,
      rawValueText: null,
      evidenceLevel: "confirmed_for_event",
      confidence: "high",
      observedAt: "2026-09-07T17:00:00Z",
      note: null,
    }),
  ).resolves.toEqual({ ok: false, error: "derived_fact_read_only" });

  await expect(
    resolveVenueFactFromObservation(port, {
      projectId,
      factId,
      observationId,
      expectedRevision: 1,
      state: "known",
      resolutionNote: null,
    }),
  ).resolves.toEqual({ ok: false, error: "derived_fact_read_only" });
});

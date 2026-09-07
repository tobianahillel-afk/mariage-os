import { describe, expect, it } from "vitest";
import type { NormalizedFactDefinition } from "@domain/facts/fact-definition";
import {
  appendVenueFactObservation,
  createVenueFactSource,
  linkVenueFactObservationSource,
  resolveVenueFactFromObservation,
  updateVenueFactSource,
  type ObservationSourceLinkRecord,
  type ResolvedVenueFactRecord,
  type VenueFactContext,
  type VenueFactEvidencePort,
  type VenueFactObservationRecord,
  type VenueFactSourceRecord,
} from "./venue-fact-evidence-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";
const sourceId = "85555555-5555-4555-8555-555555555555";
const observationId = "86666666-6666-4666-8666-666666666666";

const definition: NormalizedFactDefinition = {
  key: "external_caterer_allowed",
  label: "External caterer allowed",
  valueType: "boolean",
  unit: null,
  priority: "blocking",
  weight: 3,
  freshnessPolicy: null,
  optionsJson: null,
  evaluationRuleJson: { type: "boolean_equals", expected: true },
};

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
    ...definition,
  },
};

const sourceDraft = {
  projectId,
  sourceType: "written_confirmation",
  title: " Venue email ",
  url: "https://venue.example/confirmation",
  evidenceLevel: "confirmed_for_event",
  observedAt: "2026-09-07T08:20:00+02:00",
  notes: null,
  status: "active",
} as const;

const sourceRecord: VenueFactSourceRecord = {
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
};

const observationRecord: VenueFactObservationRecord = {
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
  createdBy: "87777777-7777-4777-8777-777777777777",
};

const linkRecord: ObservationSourceLinkRecord = {
  projectId,
  observationId,
  sourceId,
  isPrimary: true,
};

const resolvedFact: ResolvedVenueFactRecord = {
  id: factId,
  projectId,
  venueId,
  definitionId,
  state: "known",
  retainedValue: false,
  retainedObservationId: observationId,
  resolutionNote: null,
  revision: 2,
};

function makePort(
  overrides: Partial<VenueFactEvidencePort> = {},
): VenueFactEvidencePort {
  return {
    getFactContext: async () => context,
    createSource: async () => sourceRecord,
    updateSource: async () => ({ ...sourceRecord, revision: 2 }),
    appendObservation: async () => observationRecord,
    linkObservationSource: async () => linkRecord,
    resolveFromObservation: async () => resolvedFact,
    ...overrides,
  };
}

describe("Venue fact evidence source service", () => {
  it("normalizes source creation and updates with optimistic revision", async () => {
    let created: unknown;
    let updated: unknown;
    const port = makePort({
      createSource: async (input) => {
        created = input;
        return sourceRecord;
      },
      updateSource: async (input) => {
        updated = input;
        return { ...sourceRecord, revision: 2 };
      },
    });
    await expect(createVenueFactSource(port, sourceDraft)).resolves.toMatchObject({
      ok: true,
      source: sourceRecord,
    });
    await expect(
      updateVenueFactSource(port, {
        ...sourceDraft,
        sourceId,
        expectedRevision: 1,
        status: "broken",
      }),
    ).resolves.toMatchObject({ ok: true, source: { revision: 2 } });
    expect(created).toMatchObject({ title: "Venue email" });
    expect(updated).toMatchObject({ sourceId, status: "broken" });
  });

  it("returns source validation, revision and persistence failures safely", async () => {
    await expect(
      createVenueFactSource(makePort(), { ...sourceDraft, sourceType: "email" }),
    ).resolves.toEqual({ ok: false, error: "invalid_source_type" });
    await expect(
      updateVenueFactSource(makePort(), {
        ...sourceDraft,
        sourceId,
        expectedRevision: 0,
      }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      updateVenueFactSource(makePort(), {
        ...sourceDraft,
        sourceId,
        expectedRevision: 1,
        status: "deleted",
      }),
    ).resolves.toEqual({ ok: false, error: "invalid_source_status" });
    const failing = makePort({
      createSource: async () => {
        throw new Error("hidden provider detail");
      },
    });
    await expect(createVenueFactSource(failing, sourceDraft)).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });
});

describe("Venue fact observation service", () => {
  const observationDraft = {
    projectId,
    factId,
    supersedesObservationId: null,
    value: false,
    rawValueText: "No",
    evidenceLevel: "confirmed_for_event",
    confidence: "high",
    observedAt: "2026-09-07T08:30:00+02:00",
    note: null,
  } as const;

  it("validates against the fact definition before appending", async () => {
    let received: unknown;
    const port = makePort({
      appendObservation: async (input) => {
        received = input;
        return observationRecord;
      },
    });
    await expect(
      appendVenueFactObservation(port, observationDraft),
    ).resolves.toEqual({ ok: true, observation: observationRecord });
    expect(received).toMatchObject({
      projectId,
      factId,
      value: false,
      evidenceLevel: "confirmed_for_event",
      confidence: "high",
      observedAt: "2026-09-07T06:30:00.000Z",
    });
  });

  it("fails before mutation for malformed typed values", async () => {
    await expect(
      appendVenueFactObservation(makePort(), {
        ...observationDraft,
        value: "false",
      }),
    ).resolves.toEqual({ ok: false, error: "invalid_observation_value" });
  });

  it("maps context lookup and append failures safely", async () => {
    const lookupFailure = makePort({
      getFactContext: async () => {
        throw new Error("hidden");
      },
    });
    await expect(
      appendVenueFactObservation(lookupFailure, observationDraft),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });

    const appendFailure = makePort({
      appendObservation: async () => {
        throw new Error("hidden");
      },
    });
    await expect(
      appendVenueFactObservation(appendFailure, observationDraft),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});

describe("Venue fact evidence linking and resolution", () => {
  it("links one observation to multiple source records without changing truth", async () => {
    await expect(
      linkVenueFactObservationSource(makePort(), {
        projectId,
        observationId,
        sourceId,
        isPrimary: true,
      }),
    ).resolves.toEqual({ ok: true, link: linkRecord });
    await expect(
      linkVenueFactObservationSource(makePort(), {
        projectId,
        observationId,
        sourceId,
        isPrimary: "yes",
      }),
    ).resolves.toEqual({ ok: false, error: "invalid_primary_flag" });
    const failing = makePort({
      linkObservationSource: async () => {
        throw new Error("hidden");
      },
    });
    await expect(
      linkVenueFactObservationSource(failing, {
        projectId,
        observationId,
        sourceId,
        isPrimary: false,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });

  it("resolves retained truth only through an explicit observation decision", async () => {
    await expect(
      resolveVenueFactFromObservation(makePort(), {
        projectId,
        factId,
        observationId,
        expectedRevision: 1,
        state: "known",
        resolutionNote: null,
      }),
    ).resolves.toEqual({ ok: true, fact: resolvedFact });
    await expect(
      resolveVenueFactFromObservation(makePort(), {
        projectId,
        factId,
        observationId,
        expectedRevision: 0,
        state: "known",
        resolutionNote: null,
      }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      resolveVenueFactFromObservation(makePort(), {
        projectId,
        factId,
        observationId,
        expectedRevision: 1,
        state: "conflict",
        resolutionNote: null,
      }),
    ).resolves.toEqual({
      ok: false,
      error: "conflict_resolution_note_required",
    });
  });

  it("maps resolution persistence failure without leaking provider details", async () => {
    const failing = makePort({
      resolveFromObservation: async () => {
        throw new Error("hidden");
      },
    });
    await expect(
      resolveVenueFactFromObservation(failing, {
        projectId,
        factId,
        observationId,
        expectedRevision: 1,
        state: "known",
        resolutionNote: null,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});

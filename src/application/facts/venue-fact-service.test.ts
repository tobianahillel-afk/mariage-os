import { describe, expect, it } from "vitest";
import type { NormalizedFactDefinition } from "@domain/facts/fact-definition";
import {
  createVenueFactDefinition,
  setRetainedVenueFact,
  updateVenueFactDefinition,
  type RetainedVenueFactRecord,
  type VenueFactDefinitionRecord,
  type VenueFactPort,
} from "./venue-fact-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";

const normalizedDefinition: NormalizedFactDefinition = {
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

const definitionRecord: VenueFactDefinitionRecord = {
  id: definitionId,
  projectId,
  entityType: "venue",
  systemDefined: false,
  revision: 1,
  ...normalizedDefinition,
};

const factRecord: RetainedVenueFactRecord = {
  id: "84444444-4444-4444-8444-444444444444",
  projectId,
  venueId,
  definitionId,
  state: "known",
  retainedValue: false,
  revision: 1,
};

const definitionDraft = {
  projectId,
  key: " external_caterer_allowed ",
  label: " External caterer allowed ",
  valueType: "boolean",
  unit: null,
  priority: "blocking",
  weight: 3,
  freshnessPolicy: null,
  optionsJson: null,
  evaluationRuleJson: { type: "boolean_equals", expected: true },
} as const;

function makePort(overrides: Partial<VenueFactPort> = {}): VenueFactPort {
  return {
    getDefinition: async () => definitionRecord,
    createDefinition: async () => definitionRecord,
    updateDefinition: async () => ({ ...definitionRecord, revision: 2 }),
    setRetainedFact: async () => factRecord,
    ...overrides,
  };
}

describe("Venue fact definition service", () => {
  it("normalizes and creates a definition", async () => {
    let received: unknown;
    const port = makePort({
      createDefinition: async (input) => {
        received = input;
        return definitionRecord;
      },
    });
    await expect(createVenueFactDefinition(port, definitionDraft)).resolves.toEqual({
      ok: true,
      definition: definitionRecord,
    });
    expect(received).toEqual({ projectId, ...normalizedDefinition });
  });

  it("returns domain validation errors before persistence", async () => {
    await expect(
      createVenueFactDefinition(makePort(), { ...definitionDraft, key: "Bad Key" }),
    ).resolves.toEqual({ ok: false, error: "invalid_key" });
  });

  it("maps create persistence failures safely", async () => {
    const port = makePort({
      createDefinition: async () => {
        throw new Error("provider detail");
      },
    });
    await expect(createVenueFactDefinition(port, definitionDraft)).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });
});

describe("Venue fact definition update service", () => {
  it("updates only mutable definition metadata with optimistic revision", async () => {
    let received: unknown;
    const port = makePort({
      updateDefinition: async (input) => {
        received = input;
        return { ...definitionRecord, revision: 2 };
      },
    });
    await expect(
      updateVenueFactDefinition(port, {
        ...definitionDraft,
        definitionId,
        expectedRevision: 1,
        label: " Updated label ",
      }),
    ).resolves.toEqual({
      ok: true,
      definition: { ...definitionRecord, revision: 2 },
    });
    expect(received).toEqual({
      projectId,
      definitionId,
      expectedRevision: 1,
      label: "Updated label",
      priority: "blocking",
      weight: 3,
      freshnessPolicy: null,
      optionsJson: null,
      evaluationRuleJson: { type: "boolean_equals", expected: true },
    });
  });
});

describe("Venue fact definition update failures", () => {
  it("rejects invalid update data and revision before persistence", async () => {
    await expect(
      updateVenueFactDefinition(makePort(), {
        ...definitionDraft,
        definitionId,
        expectedRevision: 1,
        priority: "critical",
      }),
    ).resolves.toEqual({ ok: false, error: "invalid_priority" });
    await expect(
      updateVenueFactDefinition(makePort(), {
        ...definitionDraft,
        definitionId,
        expectedRevision: 0,
      }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
  });

  it("maps update persistence failures safely", async () => {
    const port = makePort({
      updateDefinition: async () => {
        throw new Error("provider detail");
      },
    });
    await expect(
      updateVenueFactDefinition(port, {
        ...definitionDraft,
        definitionId,
        expectedRevision: 1,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});

describe("retained Venue fact service", () => {
  it("preserves known false and permits create semantics with null revision", async () => {
    let received: unknown;
    const port = makePort({
      setRetainedFact: async (input) => {
        received = input;
        return factRecord;
      },
    });
    await expect(
      setRetainedVenueFact(port, {
        projectId,
        venueId,
        definitionId,
        expectedRevision: null,
        state: "known",
        retainedValue: false,
      }),
    ).resolves.toEqual({ ok: true, fact: factRecord });
    expect(received).toEqual({
      projectId,
      venueId,
      definitionId,
      expectedRevision: null,
      state: "known",
      retainedValue: false,
    });
  });

  it("rejects invalid revision and typed values before mutation", async () => {
    await expect(
      setRetainedVenueFact(makePort(), {
        projectId,
        venueId,
        definitionId,
        expectedRevision: 0,
        state: "known",
        retainedValue: false,
      }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      setRetainedVenueFact(makePort(), {
        projectId,
        venueId,
        definitionId,
        expectedRevision: 1,
        state: "known",
        retainedValue: "false",
      }),
    ).resolves.toEqual({ ok: false, error: "invalid_fact_value" });
  });
});

describe("retained Venue fact failure mapping", () => {
  it("maps definition lookup and mutation failures safely", async () => {
    const lookupFailure = makePort({
      getDefinition: async () => {
        throw new Error("hidden");
      },
    });
    await expect(
      setRetainedVenueFact(lookupFailure, {
        projectId,
        venueId,
        definitionId,
        expectedRevision: null,
        state: "known",
        retainedValue: false,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });

    const mutationFailure = makePort({
      setRetainedFact: async () => {
        throw new Error("hidden");
      },
    });
    await expect(
      setRetainedVenueFact(mutationFailure, {
        projectId,
        venueId,
        definitionId,
        expectedRevision: null,
        state: "unknown",
        retainedValue: null,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});

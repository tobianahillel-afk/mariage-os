import { describe, expect, it } from "vitest";
import {
  VenueFactPersistenceError,
  type VenueFactPersistenceErrorCode,
} from "./venue-fact-persistence-error";
import {
  createVenueFactDefinition,
  type VenueFactDefinitionRecord,
  type VenueFactPort,
} from "./venue-fact-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const definitionRecord: VenueFactDefinitionRecord = {
  id: "83333333-3333-4333-8333-333333333333",
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

const draft = {
  projectId,
  key: "external_caterer_allowed",
  label: "External caterer allowed",
  valueType: "boolean",
  unit: null,
  priority: "blocking",
  weight: 3,
  freshnessPolicy: null,
  optionsJson: null,
  evaluationRuleJson: { type: "boolean_equals", expected: true },
} as const;

function failingPort(code: VenueFactPersistenceErrorCode): VenueFactPort {
  return {
    getDefinition: async () => definitionRecord,
    createDefinition: async () => {
      throw new VenueFactPersistenceError(code, "Safe persistence failure.");
    },
    updateDefinition: async () => definitionRecord,
    setRetainedFact: async () => {
      throw new Error("not used");
    },
  };
}

describe("Venue fact typed persistence errors", () => {
  it.each([
    "conflict",
    "authorization_failed",
    "backend_unavailable",
    "data_integrity_failed",
    "provider_response_invalid",
    "persistence_failed",
  ] as const)("preserves safe persistence code %s", async (code) => {
    const result = await createVenueFactDefinition(failingPort(code), draft);
    expect(result).toEqual({ ok: false, error: code });
  });
});

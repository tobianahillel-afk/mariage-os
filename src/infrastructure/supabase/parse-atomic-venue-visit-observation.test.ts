import { expect, it } from "vitest";
import type { AtomicVenueVisitObservationInput } from "@application/facts/venue-visit-atomic-observation";
import { parseVenueFactDefinitionRow } from "./parse-venue-fact-row";
import { parseAtomicVenueVisitObservationReceipt } from "./parse-atomic-venue-visit-observation";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";
const sourceId = "85555555-5555-4555-8555-555555555555";
const observationId = "86666666-6666-4666-8666-666666666666";
const actorId = "87777777-7777-4777-8777-777777777777";
const foreignId = "89999999-9999-4999-8999-999999999999";

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
};

function context(valueType = "boolean", optionsJson: unknown = null) {
  return {
    factId,
    projectId,
    venueId,
    definition: parseVenueFactDefinitionRow(
      {
        ...definitionRow,
        value_type: valueType,
        options_json: optionsJson,
        evaluation_rule_json: valueType === "boolean" ? definitionRow.evaluation_rule_json : null,
      },
      projectId,
      definitionId,
    ),
  };
}

const input: AtomicVenueVisitObservationInput = {
  projectId,
  factId,
  observationId,
  sourceId,
  actorId,
  expectedSourceRevision: 1,
  value: false,
  rawValueText: "No",
  evidenceLevel: "confirmed_for_event",
  confidence: "high",
  observedAt: "2026-09-07T06:30:00.000Z",
  note: null,
  supersedesObservationId: null,
};

const observation = {
  id: observationId,
  project_id: projectId,
  fact_id: factId,
  value: false,
  raw_value_text: "No",
  evidence_level: "confirmed_for_event",
  confidence: "high",
  observation_status: "active",
  superseded_by_observation_id: null,
  observed_at: "2026-09-07T06:30:00.000Z",
  note: null,
  created_by: actorId,
};

const link = {
  project_id: projectId,
  observation_id: observationId,
  source_id: sourceId,
  is_primary: true,
};

const checkedSource = {
  projectId,
  sourceId,
  sourceType: "in_person_visit",
  checkedRevision: 1,
  checkedBy: actorId,
};

const receipt = { observation, link, checkedSource };

it("accepts only a complete, actor-bound atomic receipt", () => {
  expect(parseAtomicVenueVisitObservationReceipt(receipt, context(), input)).toMatchObject({
    observation: { id: observationId, createdBy: actorId },
    link: { projectId, sourceId, isPrimary: true },
    checkedSource: { checkedRevision: 1, checkedBy: actorId },
  });
});

it.each([null, 17, [], "success"])(
  "rejects primitive or missing atomic receipt %s",
  (payload) => {
    expect(() => parseAtomicVenueVisitObservationReceipt(payload, context(), input)).toThrow();
  },
);

it.each([
  ["missing source proof", { ...receipt, checkedSource: null }],
  ["array source proof", { ...receipt, checkedSource: [] }],
  ["foreign project proof", { ...receipt, checkedSource: { ...checkedSource, projectId: foreignId } }],
  ["foreign source proof", { ...receipt, checkedSource: { ...checkedSource, sourceId: foreignId } }],
  ["wrong source type", { ...receipt, checkedSource: { ...checkedSource, sourceType: "official_website" } }],
  ["invalid checked revision", { ...receipt, checkedSource: { ...checkedSource, checkedRevision: 1.5 } }],
  ["stale checked revision", { ...receipt, checkedSource: { ...checkedSource, checkedRevision: 2 } }],
  ["foreign checker", { ...receipt, checkedSource: { ...checkedSource, checkedBy: foreignId } }],
  ["non-primary link", { ...receipt, link: { ...link, is_primary: false } }],
  ["substituted link", { ...receipt, link: { ...link, observation_id: foreignId } }],
  ["substituted observation", { ...receipt, observation: { ...observation, id: foreignId } }],
  ["foreign observation actor", { ...receipt, observation: { ...observation, created_by: foreignId } }],
  ["different fact value", { ...receipt, observation: { ...observation, value: true } }],
  ["different raw value", { ...receipt, observation: { ...observation, raw_value_text: "Yes" } }],
  ["different evidence", { ...receipt, observation: { ...observation, evidence_level: "estimated" } }],
  ["different confidence", { ...receipt, observation: { ...observation, confidence: "medium" } }],
  ["different instant", { ...receipt, observation: { ...observation, observed_at: "2026-09-07T06:31:00.000Z" } }],
  ["different note", { ...receipt, observation: { ...observation, note: "Different" } }],
] as const)("rejects %s even if provider claims success", (_case, payload) => {
  expect(() => parseAtomicVenueVisitObservationReceipt(payload, context(), input)).toThrow();
});

it("handles canonical multiselect arrays independently of initial order", () => {
  const selections = { options: [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
  ] };
  const multiselectInput = { ...input, value: ["b", "a"] };
  const multiselectReceipt = {
    ...receipt,
    observation: { ...observation, value: ["a", "b"] },
  };
  expect(
    parseAtomicVenueVisitObservationReceipt(
      multiselectReceipt, context("multiselect", selections), multiselectInput,
    ).observation.value,
  ).toEqual(["a", "b"]);
});

it("compares money JSON fields regardless of provider key ordering", () => {
  const moneyInput = { ...input, value: { currency: "EUR", minor: 10000 } };
  const moneyReceipt = {
    ...receipt,
    observation: { ...observation, value: { minor: 10000, currency: "EUR" } },
  };
  expect(
    parseAtomicVenueVisitObservationReceipt(moneyReceipt, context("money"), moneyInput)
      .observation.value,
  ).toEqual({ minor: 10000, currency: "EUR" });
});

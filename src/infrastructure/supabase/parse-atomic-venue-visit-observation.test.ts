import { expect, it } from "vitest";
import { parseVenueFactDefinitionRow } from "./parse-venue-fact-row";
import * as atomicVisit from "./parse-atomic-venue-visit-observation";

type AtomicInput = Parameters<
  typeof atomicVisit.parseAtomicVenueVisitObservationReceipt
>[2];

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
  const rule = valueType === "boolean" ? definitionRow.evaluation_rule_json : null;
  return {
    factId,
    projectId,
    venueId,
    definition: parseVenueFactDefinitionRow(
      {
        ...definitionRow,
        value_type: valueType,
        options_json: optionsJson,
        evaluation_rule_json: rule,
      },
      projectId,
      definitionId,
    ),
  };
}

const input: AtomicInput = {
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

function parse(
  payload: unknown,
  intent: AtomicInput = input,
  definition = context(),
) {
  return atomicVisit.parseAtomicVenueVisitObservationReceipt(
    payload,
    definition,
    intent,
  );
}

it("accepts a complete actor-bound atomic receipt", () => {
  const parsed = parse(receipt);
  expect(parsed).toMatchObject({
    observation: { id: observationId, createdBy: actorId },
    link: { projectId, sourceId, isPrimary: true },
    checkedSource: { checkedRevision: 1, checkedBy: actorId },
  });
});

it.each([null, 17, [], "success"])("rejects bad root %s", (payload) => {
  expect(() => parse(payload)).toThrow();
});

function badSource(fields: Record<string, unknown>) {
  return { ...receipt, checkedSource: { ...checkedSource, ...fields } };
}

function badLink(fields: Record<string, unknown>) {
  return { ...receipt, link: { ...link, ...fields } };
}

function badObservation(fields: Record<string, unknown>) {
  return { ...receipt, observation: { ...observation, ...fields } };
}

const badReceipts = [
  ["missing source proof", { ...receipt, checkedSource: null }],
  ["array source proof", { ...receipt, checkedSource: [] }],
  ["foreign project proof", badSource({ projectId: foreignId })],
  ["foreign source proof", badSource({ sourceId: foreignId })],
  ["wrong source type", badSource({ sourceType: "official_website" })],
  ["invalid checked revision", badSource({ checkedRevision: 1.5 })],
  ["stale checked revision", badSource({ checkedRevision: 2 })],
  ["foreign checker", badSource({ checkedBy: foreignId })],
  ["non-primary link", badLink({ is_primary: false })],
  ["substituted link", badLink({ observation_id: foreignId })],
  ["substituted observation", badObservation({ id: foreignId })],
  ["foreign observation actor", badObservation({ created_by: foreignId })],
  ["different fact value", badObservation({ value: true })],
  ["different raw value", badObservation({ raw_value_text: "Yes" })],
  ["different evidence", badObservation({ evidence_level: "estimated" })],
  ["different confidence", badObservation({ confidence: "medium" })],
  [
    "different instant",
    badObservation({ observed_at: "2026-09-07T06:31:00.000Z" }),
  ],
  ["different note", badObservation({ note: "Different" })],
] as const;

it.each(badReceipts)("rejects %s", (_name, payload) => {
  expect(() => parse(payload)).toThrow();
});

it("rejects invalid local fact intent", () => {
  expect(() => parse(receipt, { ...input, value: "invalid" })).toThrow();
});

it("normalizes multiselect order in receipts", () => {
  const selections = {
    options: [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ],
  };
  const intent = { ...input, value: ["b", "a"] };
  const server = badObservation({ value: ["a", "b"] });
  const parsed = parse(server, intent, context("multiselect", selections));
  expect(parsed.observation.value).toEqual(["a", "b"]);
});

it("compares money JSON regardless of provider key order", () => {
  const intent = { ...input, value: { currency: "EUR", minor: 10000 } };
  const server = badObservation({
    value: { minor: 10000, currency: "EUR" },
  });
  const parsed = parse(server, intent, context("money"));
  expect(parsed.observation.value).toEqual({ minor: 10000, currency: "EUR" });
});

it("accepts a properly attributed null fact observation", () => {
  const intent = { ...input, value: null };
  const server = badObservation({ value: null });
  expect(parse(server, intent).observation.value).toBeNull();
});

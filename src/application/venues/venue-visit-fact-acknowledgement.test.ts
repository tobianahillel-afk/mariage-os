import { expect, it } from "vitest";
import type {
  VenueFactContext,
  VenueFactObservationRecord,
} from "@application/facts/venue-fact-evidence-service";
import type { StructuredVenueReplayCommand } from "./venue-visit-replay-dependencies";
import { venueVisitFactAcknowledgementMatches } from "./venue-visit-fact-acknowledgement";

type FactReplayCommand = Extract<
  StructuredVenueReplayCommand,
  { readonly kind: "fact_observation" }
>;

const projectId = "71111111-1111-4111-8111-111111111111";
const venueId = "72222222-2222-4222-8222-222222222222";
const factId = "73333333-3333-4333-8333-333333333333";
const observationId = "74444444-4444-4444-8444-444444444444";
const sourceId = "75555555-5555-4555-8555-555555555555";
const userId = "76666666-6666-4666-8666-666666666666";

const context: VenueFactContext = {
  factId,
  projectId,
  venueId,
  definition: {
    id: "77777777-7777-4777-8777-777777777777",
    projectId,
    entityType: "venue",
    systemDefined: false,
    revision: 1,
    key: "visit_width",
    label: "Visit width",
    valueType: "number",
    unit: "m",
    priority: "important",
    weight: 1,
    freshnessPolicy: null,
    optionsJson: null,
    evaluationRuleJson: null,
  },
};

const observation: VenueFactObservationRecord = {
  id: observationId,
  projectId,
  factId,
  value: 12.5,
  rawValueText: "12.5 m",
  evidenceLevel: "observed",
  confidence: "high",
  observedAt: "2026-10-06T12:00:00.000Z",
  note: "Mesure sur place.",
  status: "active",
  supersededByObservationId: null,
  createdBy: userId,
};

it("fails closed when the queued Fact intent cannot be normalized", () => {
  const command: FactReplayCommand = {
    kind: "fact_observation",
    venueId,
    sourceId,
    sourceType: "in_person_visit",
    input: {
      projectId,
      factId,
      observationId,
      value: "not-a-number",
      rawValueText: "not-a-number",
      evidenceLevel: "observed",
      confidence: "high",
      observedAt: "2026-10-06T12:00:00.000Z",
      note: null,
      supersedesObservationId: null,
    },
  };

  expect(
    venueVisitFactAcknowledgementMatches(
      command,
      context,
      observation,
      userId,
    ),
  ).toBe(false);
});

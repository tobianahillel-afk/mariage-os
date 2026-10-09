import type {
  VenueFactContext,
  VenueFactObservationRecord,
} from "@application/facts/venue-fact-evidence-service";
import type { StructuredVenueReplayCommand } from "./venue-visit-replay-dependencies";
import { normalizeFactObservation } from "@domain/facts/fact-observation";

type FactReplayCommand = Extract<
  StructuredVenueReplayCommand,
  { readonly kind: "fact_observation" }
>;

function jsonValueMatches(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function identityMatches(
  command: FactReplayCommand,
  observation: VenueFactObservationRecord,
  expectedUserId: string,
): boolean {
  return [
    observation.id === command.input.observationId,
    observation.projectId === command.input.projectId,
    observation.factId === command.input.factId,
    observation.status === "active",
    observation.supersededByObservationId === null,
    observation.createdBy === expectedUserId,
  ].every(Boolean);
}

function payloadMatches(
  observation: VenueFactObservationRecord,
  expected: {
    readonly value: unknown;
    readonly rawValueText: string | null;
    readonly evidenceLevel: string;
    readonly confidence: string;
    readonly observedAt: string;
    readonly note: string | null;
  },
): boolean {
  return [
    jsonValueMatches(observation.value, expected.value),
    observation.rawValueText === expected.rawValueText,
    observation.evidenceLevel === expected.evidenceLevel,
    observation.confidence === expected.confidence,
    observation.observedAt === expected.observedAt,
    observation.note === expected.note,
  ].every(Boolean);
}

export function venueVisitFactAcknowledgementMatches(
  command: FactReplayCommand,
  context: VenueFactContext,
  observation: unknown,
  expectedUserId: string,
): boolean {
  if (typeof observation !== "object" || observation === null) return false;
  const acknowledged = observation as VenueFactObservationRecord;
  const normalized = normalizeFactObservation(
    context.definition,
    command.input,
  );
  if (!normalized.ok) return false;
  return [
    identityMatches(command, acknowledged, expectedUserId),
    payloadMatches(acknowledged, normalized.value),
  ].every(Boolean);
}

import type {
  AtomicVenueVisitObservationInput,
  AtomicVenueVisitObservationReceipt,
} from "@application/facts/venue-visit-atomic-observation";
import type { VenueFactContext } from "@application/facts/venue-fact-evidence-service";
import { normalizeFactObservation } from "@domain/facts/fact-observation";
import {
  parseObservationSourceLinkRow,
  parseVenueFactObservationRow,
} from "./parse-venue-fact-evidence-row";

type DataRecord = Record<string, unknown>;

function invalid(): never {
  throw new Error("Invalid atomic Venue visit receipt.");
}

function record(value: unknown): DataRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return invalid();
  }
  return value as DataRecord;
}

function stableJson(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const object = value as DataRecord;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseCheckedSource(
  value: unknown,
  input: AtomicVenueVisitObservationInput,
) {
  const source = record(value);
  if (
    source.projectId !== input.projectId ||
    source.sourceId !== input.sourceId ||
    source.sourceType !== "in_person_visit" ||
    !Number.isSafeInteger(source.checkedRevision) ||
    source.checkedRevision !== input.expectedSourceRevision ||
    source.checkedBy !== input.actorId
  ) {
    invalid();
  }
  return {
    projectId: input.projectId,
    sourceId: input.sourceId,
    sourceType: "in_person_visit" as const,
    checkedRevision: input.expectedSourceRevision,
    checkedBy: input.actorId,
  };
}

function sameObservationPayload(
  observation: {
    readonly value: unknown;
    readonly rawValueText: string | null;
    readonly evidenceLevel: string;
    readonly confidence: string;
  },
  expected: {
    readonly value: unknown;
    readonly rawValueText: string | null;
    readonly evidenceLevel: string;
    readonly confidence: string;
  },
): boolean {
  return (
    stableJson(observation.value) === stableJson(expected.value) &&
    observation.rawValueText === expected.rawValueText &&
    observation.evidenceLevel === expected.evidenceLevel &&
    observation.confidence === expected.confidence
  );
}

function verifiedObservationProof(
  value: unknown,
  input: AtomicVenueVisitObservationInput,
): DataRecord {
  const observation = record(value);
  const expected = input.supersedesObservationId?.toLowerCase() ?? null;
  if (observation.supersedes_observation_id !== expected) invalid();
  return observation;
}

export function parseAtomicVenueVisitObservationReceipt(
  value: unknown,
  context: VenueFactContext,
  input: AtomicVenueVisitObservationInput,
): AtomicVenueVisitObservationReceipt {
  const payload = record(value);
  const rawObservation = verifiedObservationProof(payload.observation, input);
  const observation = parseVenueFactObservationRow(
    rawObservation,
    context,
    input.observationId.toLowerCase(),
  );
  const link = parseObservationSourceLinkRow(
    payload.link,
    input.projectId,
    input.observationId.toLowerCase(),
    input.sourceId,
  );
  const checkedSource = parseCheckedSource(payload.checkedSource, input);
  const normalizedIntent = normalizeFactObservation(context.definition, input);
  if (!normalizedIntent.ok) invalid();
  const expected = normalizedIntent.value;

  if (
    !link.isPrimary ||
    observation.createdBy !== input.actorId ||
    !sameObservationPayload(observation, expected) ||
    observation.observedAt !== expected.observedAt ||
    observation.note !== expected.note
  ) {
    invalid();
  }

  return { observation, link, checkedSource };
}

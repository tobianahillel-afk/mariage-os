export const FACT_EVIDENCE_LEVELS = [
  "contractual",
  "confirmed_for_event",
  "official_general",
  "observed",
  "third_party",
  "estimated",
  "unknown_source",
] as const;

export const FACT_OBSERVATION_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;

export const FACT_OBSERVATION_STATUSES = [
  "active",
  "superseded",
  "withdrawn",
] as const;

export const FACT_SOURCE_TYPES = [
  "contract",
  "written_confirmation",
  "quote",
  "official_website",
  "phone_call_note",
  "in_person_visit",
  "specialized_directory",
  "public_third_party",
  "user_estimate",
  "import_without_primary_source",
  "other",
] as const;

export const FACT_SOURCE_STATUSES = [
  "active",
  "broken",
  "replaced",
  "superseded",
  "contradictory",
  "archived",
] as const;

export type FactEvidenceLevel = (typeof FACT_EVIDENCE_LEVELS)[number];
export type FactObservationConfidence =
  (typeof FACT_OBSERVATION_CONFIDENCE_LEVELS)[number];
export type FactObservationStatus = (typeof FACT_OBSERVATION_STATUSES)[number];
export type FactSourceType = (typeof FACT_SOURCE_TYPES)[number];
export type FactSourceStatus = (typeof FACT_SOURCE_STATUSES)[number];

export function isFactEvidenceLevel(value: unknown): value is FactEvidenceLevel {
  return FACT_EVIDENCE_LEVELS.some((candidate) => candidate === value);
}

export function isFactObservationConfidence(
  value: unknown,
): value is FactObservationConfidence {
  return FACT_OBSERVATION_CONFIDENCE_LEVELS.some(
    (candidate) => candidate === value,
  );
}

export function isFactObservationStatus(
  value: unknown,
): value is FactObservationStatus {
  return FACT_OBSERVATION_STATUSES.some((candidate) => candidate === value);
}

export function isFactSourceType(value: unknown): value is FactSourceType {
  return FACT_SOURCE_TYPES.some((candidate) => candidate === value);
}

export function isFactSourceStatus(value: unknown): value is FactSourceStatus {
  return FACT_SOURCE_STATUSES.some((candidate) => candidate === value);
}

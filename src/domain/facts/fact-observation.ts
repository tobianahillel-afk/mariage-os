import { normalizeFactValue, type FactValueDefinition } from "./fact-value";
import { hasCodePointLengthBetween } from "./fact-text-length";
import {
  isFactEvidenceLevel,
  isFactObservationConfidence,
  type FactEvidenceLevel,
  type FactObservationConfidence,
} from "./fact-evidence-types";

const INSTANT_PATTERN =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/;
const MIN_FACT_INSTANT_MS = Date.parse("0001-01-01T00:00:00.000Z");
const MAX_FACT_INSTANT_MS = Date.parse("9999-12-31T23:59:59.999Z");

export interface FactObservationDraft {
  readonly value: unknown;
  readonly rawValueText: unknown;
  readonly evidenceLevel: unknown;
  readonly confidence: unknown;
  readonly observedAt: unknown;
  readonly note: unknown;
}

export interface NormalizedFactObservation {
  readonly value: unknown;
  readonly rawValueText: string | null;
  readonly evidenceLevel: FactEvidenceLevel;
  readonly confidence: FactObservationConfidence;
  readonly observedAt: string;
  readonly note: string | null;
}

export type FactObservationError =
  | "invalid_observation_value"
  | "invalid_raw_value_text"
  | "invalid_evidence_level"
  | "invalid_confidence"
  | "invalid_observed_at"
  | "invalid_observation_note";

export type FactObservationResult =
  | { readonly ok: true; readonly value: NormalizedFactObservation }
  | { readonly ok: false; readonly error: FactObservationError };

function nullableBoundedText(
  value: unknown,
  maximum: number,
): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return hasCodePointLengthBetween(value, 0, maximum) ? value : undefined;
}

function localInstantMilliseconds(
  base: string,
  milliseconds: number,
): number | null {
  const year = Number(base.slice(0, 4));
  const month = Number(base.slice(5, 7));
  const day = Number(base.slice(8, 10));
  const hour = Number(base.slice(11, 13));
  const minute = Number(base.slice(14, 16));
  const second = Number(base.slice(17, 19));
  if (year < 1) return null;

  const candidate = new Date(0);
  candidate.setUTCFullYear(year, month - 1, day);
  candidate.setUTCHours(hour, minute, second, milliseconds);
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day ||
    candidate.getUTCHours() !== hour ||
    candidate.getUTCMinutes() !== minute ||
    candidate.getUTCSeconds() !== second
  ) {
    return null;
  }
  return candidate.getTime();
}

function parseOffsetMinutes(offset: string): number | null {
  if (offset === "Z") return 0;
  const hours = Number(offset.slice(1, 3));
  const minutes = Number(offset.slice(4, 6));
  if (minutes > 59 || hours > 14 || (hours === 14 && minutes !== 0)) {
    return null;
  }
  const absoluteMinutes = hours * 60 + minutes;
  return offset[0] === "-" ? -absoluteMinutes : absoluteMinutes;
}

export function normalizeFactInstant(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = INSTANT_PATTERN.exec(value);
  if (match === null) return null;
  const base = match[1] as string;
  const fraction = match[2] ?? "";
  const offset = match[3] as string;
  const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));
  const localMilliseconds = localInstantMilliseconds(base, milliseconds);
  if (localMilliseconds === null) return null;
  const offsetMinutes = parseOffsetMinutes(offset);
  if (offsetMinutes === null) return null;
  const parsed = localMilliseconds - offsetMinutes * 60_000;
  if (parsed < MIN_FACT_INSTANT_MS || parsed > MAX_FACT_INSTANT_MS) return null;
  return new Date(parsed).toISOString();
}

export function normalizeFactObservation(
  definition: FactValueDefinition,
  draft: FactObservationDraft,
): FactObservationResult {
  let normalizedValue: unknown = null;
  if (draft.value !== null) {
    const result = normalizeFactValue(definition, draft.value);
    if (!result.ok) return { ok: false, error: "invalid_observation_value" };
    normalizedValue = result.value;
  }

  const rawValueText = nullableBoundedText(draft.rawValueText, 5000);
  if (rawValueText === undefined) {
    return { ok: false, error: "invalid_raw_value_text" };
  }
  if (!isFactEvidenceLevel(draft.evidenceLevel)) {
    return { ok: false, error: "invalid_evidence_level" };
  }
  if (!isFactObservationConfidence(draft.confidence)) {
    return { ok: false, error: "invalid_confidence" };
  }
  const observedAt = normalizeFactInstant(draft.observedAt);
  if (observedAt === null) return { ok: false, error: "invalid_observed_at" };
  const note = nullableBoundedText(draft.note, 5000);
  if (note === undefined) {
    return { ok: false, error: "invalid_observation_note" };
  }

  return {
    ok: true,
    value: {
      value: normalizedValue,
      rawValueText,
      evidenceLevel: draft.evidenceLevel,
      confidence: draft.confidence,
      observedAt,
      note,
    },
  };
}

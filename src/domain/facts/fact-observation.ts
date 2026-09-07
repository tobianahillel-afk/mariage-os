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

export function normalizeFactInstant(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = INSTANT_PATTERN.exec(value);
  if (match === null) return null;
  const base = match[1];
  const fraction = match[2] ?? "";
  const offset = match[3];
  if (base === undefined || offset === undefined) return null;
  const milliseconds = fraction.padEnd(3, "0").slice(0, 3);
  const parsed = Date.parse(`${base}.${milliseconds}${offset}`);
  if (!Number.isFinite(parsed)) return null;
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

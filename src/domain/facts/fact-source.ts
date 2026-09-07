import { hasCodePointLengthBetween } from "./fact-text-length";
import { isCanonicalFactUrl } from "./fact-url";
import {
  isFactEvidenceLevel,
  isFactSourceStatus,
  isFactSourceType,
  type FactEvidenceLevel,
  type FactSourceStatus,
  type FactSourceType,
} from "./fact-evidence-types";
import { normalizeFactInstant } from "./fact-observation";

export interface FactSourceDraft {
  readonly sourceType: unknown;
  readonly title: unknown;
  readonly url: unknown;
  readonly evidenceLevel: unknown;
  readonly observedAt: unknown;
  readonly notes: unknown;
  readonly status: unknown;
}

export interface NormalizedFactSource {
  readonly sourceType: FactSourceType;
  readonly title: string | null;
  readonly url: string | null;
  readonly evidenceLevel: FactEvidenceLevel;
  readonly observedAt: string | null;
  readonly notes: string | null;
  readonly status: FactSourceStatus;
}

export type FactSourceError =
  | "invalid_source_type"
  | "invalid_source_title"
  | "invalid_source_url"
  | "invalid_evidence_level"
  | "invalid_source_observed_at"
  | "invalid_source_notes"
  | "invalid_source_status";

export type FactSourceResult =
  | { readonly ok: true; readonly value: NormalizedFactSource }
  | { readonly ok: false; readonly error: FactSourceError };

function normalizeTitle(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return hasCodePointLengthBetween(trimmed, 1, 240) ? trimmed : undefined;
}

function normalizeOptionalText(
  value: unknown,
  maximum: number,
): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return hasCodePointLengthBetween(value, 0, maximum) ? value : undefined;
}

function normalizeSourceUrl(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || !isCanonicalFactUrl(value)) return undefined;
  return value;
}

function normalizeObservedAt(value: unknown): string | null | undefined {
  if (value === null) return null;
  return normalizeFactInstant(value) ?? undefined;
}

export function normalizeFactSource(draft: FactSourceDraft): FactSourceResult {
  if (!isFactSourceType(draft.sourceType)) {
    return { ok: false, error: "invalid_source_type" };
  }
  const title = normalizeTitle(draft.title);
  if (title === undefined) return { ok: false, error: "invalid_source_title" };
  const url = normalizeSourceUrl(draft.url);
  if (url === undefined) return { ok: false, error: "invalid_source_url" };
  if (!isFactEvidenceLevel(draft.evidenceLevel)) {
    return { ok: false, error: "invalid_evidence_level" };
  }
  const observedAt = normalizeObservedAt(draft.observedAt);
  if (observedAt === undefined) {
    return { ok: false, error: "invalid_source_observed_at" };
  }
  const notes = normalizeOptionalText(draft.notes, 5000);
  if (notes === undefined) return { ok: false, error: "invalid_source_notes" };
  if (!isFactSourceStatus(draft.status)) {
    return { ok: false, error: "invalid_source_status" };
  }

  return {
    ok: true,
    value: {
      sourceType: draft.sourceType,
      title,
      url,
      evidenceLevel: draft.evidenceLevel,
      observedAt,
      notes,
      status: draft.status,
    },
  };
}

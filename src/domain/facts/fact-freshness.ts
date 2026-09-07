import { normalizeFactInstant } from "./fact-observation";

export interface FactFreshnessDraft {
  readonly lastVerifiedAt: unknown;
  readonly staleAt: unknown;
}

export interface NormalizedFactFreshness {
  readonly lastVerifiedAt: string | null;
  readonly staleAt: string | null;
}

export type FactFreshnessError =
  | "invalid_last_verified_at"
  | "invalid_stale_at"
  | "stale_without_last_verified_at"
  | "stale_before_last_verified_at";

export type FactFreshnessResult =
  | { readonly ok: true; readonly value: NormalizedFactFreshness }
  | { readonly ok: false; readonly error: FactFreshnessError };

function nullableInstant(
  value: unknown,
  invalidError: FactFreshnessError,
):
  | { readonly ok: true; readonly value: string | null }
  | {
      readonly ok: false;
      readonly error: FactFreshnessError;
    } {
  if (value === null) return { ok: true, value: null };
  const normalized = normalizeFactInstant(value);
  return normalized === null
    ? { ok: false, error: invalidError }
    : { ok: true, value: normalized };
}

export function normalizeFactFreshness(
  draft: FactFreshnessDraft,
): FactFreshnessResult {
  const lastVerifiedAt = nullableInstant(
    draft.lastVerifiedAt,
    "invalid_last_verified_at",
  );
  if (!lastVerifiedAt.ok) return lastVerifiedAt;
  const staleAt = nullableInstant(draft.staleAt, "invalid_stale_at");
  if (!staleAt.ok) return staleAt;
  if (staleAt.value !== null && lastVerifiedAt.value === null) {
    return { ok: false, error: "stale_without_last_verified_at" };
  }
  if (
    staleAt.value !== null &&
    lastVerifiedAt.value !== null &&
    Date.parse(staleAt.value) < Date.parse(lastVerifiedAt.value)
  ) {
    return { ok: false, error: "stale_before_last_verified_at" };
  }
  return {
    ok: true,
    value: {
      lastVerifiedAt: lastVerifiedAt.value,
      staleAt: staleAt.value,
    },
  };
}

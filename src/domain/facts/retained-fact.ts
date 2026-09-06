import { normalizeFactValue, type FactValueDefinition } from "./fact-value";
import { isFactState, type FactState } from "./fact-types";

export interface RetainedFactDraft {
  readonly state: unknown;
  readonly retainedValue: unknown;
}

interface NormalizedRetainedFact {
  readonly state: FactState;
  readonly retainedValue: unknown;
}

export type RetainedFactError =
  "invalid_fact_state" | "invalid_state_value" | "invalid_fact_value";
export type RetainedFactResult =
  | { readonly ok: true; readonly value: NormalizedRetainedFact }
  | { readonly ok: false; readonly error: RetainedFactError };

export function normalizeRetainedFact(
  definition: FactValueDefinition,
  draft: RetainedFactDraft,
): RetainedFactResult {
  if (!isFactState(draft.state))
    return { ok: false, error: "invalid_fact_state" };
  if (draft.state !== "known") {
    return draft.retainedValue === null
      ? { ok: true, value: { state: draft.state, retainedValue: null } }
      : { ok: false, error: "invalid_state_value" };
  }
  if (draft.retainedValue === null)
    return { ok: false, error: "invalid_state_value" };
  const normalized = normalizeFactValue(definition, draft.retainedValue);
  if (!normalized.ok) return normalized;
  return {
    ok: true,
    value: { state: draft.state, retainedValue: normalized.value },
  };
}

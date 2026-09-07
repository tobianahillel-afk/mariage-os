import { hasCodePointLengthBetween } from "./fact-text-length";

export type FactResolutionState = "known" | "conflict";

export interface FactResolutionDraft {
  readonly state: unknown;
  readonly resolutionNote: unknown;
}

export interface NormalizedFactResolution {
  readonly state: FactResolutionState;
  readonly resolutionNote: string | null;
}

export type FactResolutionError =
  | "invalid_resolution_state"
  | "invalid_resolution_note"
  | "conflict_resolution_note_required";

export type FactResolutionResult =
  | { readonly ok: true; readonly value: NormalizedFactResolution }
  | { readonly ok: false; readonly error: FactResolutionError };

function resolutionState(value: unknown): FactResolutionState | null {
  return value === "known" || value === "conflict" ? value : null;
}

function resolutionNote(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return hasCodePointLengthBetween(value, 0, 5000) ? value : undefined;
}

function conflictNeedsNote(
  state: FactResolutionState,
  note: string | null,
): boolean {
  return state === "conflict" && (note === null || note.trim().length === 0);
}

export function normalizeFactResolution(
  draft: FactResolutionDraft,
): FactResolutionResult {
  const state = resolutionState(draft.state);
  if (state === null) return { ok: false, error: "invalid_resolution_state" };
  const note = resolutionNote(draft.resolutionNote);
  if (note === undefined)
    return { ok: false, error: "invalid_resolution_note" };
  if (conflictNeedsNote(state, note)) {
    return { ok: false, error: "conflict_resolution_note_required" };
  }
  return { ok: true, value: { state, resolutionNote: note } };
}

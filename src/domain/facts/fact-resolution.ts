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

export function normalizeFactResolution(
  draft: FactResolutionDraft,
): FactResolutionResult {
  if (draft.state !== "known" && draft.state !== "conflict") {
    return { ok: false, error: "invalid_resolution_state" };
  }
  if (draft.resolutionNote !== null && typeof draft.resolutionNote !== "string") {
    return { ok: false, error: "invalid_resolution_note" };
  }
  const note = draft.resolutionNote;
  if (note !== null && !hasCodePointLengthBetween(note, 0, 5000)) {
    return { ok: false, error: "invalid_resolution_note" };
  }
  if (draft.state === "conflict" && (note === null || note.trim().length === 0)) {
    return { ok: false, error: "conflict_resolution_note_required" };
  }
  return { ok: true, value: { state: draft.state, resolutionNote: note } };
}

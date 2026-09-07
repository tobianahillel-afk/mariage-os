import { describe, expect, it } from "vitest";
import { normalizeFactResolution } from "./fact-resolution";

describe("fact retained-observation resolution", () => {
  it("accepts known resolution without forcing a rationale", () => {
    expect(
      normalizeFactResolution({ state: "known", resolutionNote: null }),
    ).toEqual({
      ok: true,
      value: { state: "known", resolutionNote: null },
    });
  });

  it("requires an explicit rationale when retaining one side of a conflict", () => {
    expect(
      normalizeFactResolution({
        state: "conflict",
        resolutionNote: "Commercial email is event-specific.",
      }),
    ).toMatchObject({ ok: true, value: { state: "conflict" } });
    for (const resolutionNote of [null, "   "] as const) {
      expect(
        normalizeFactResolution({ state: "conflict", resolutionNote }),
      ).toEqual({ ok: false, error: "conflict_resolution_note_required" });
    }
  });

  it("rejects unsupported states and invalid notes", () => {
    expect(
      normalizeFactResolution({ state: "unknown", resolutionNote: null }),
    ).toEqual({ ok: false, error: "invalid_resolution_state" });
    expect(
      normalizeFactResolution({ state: "known", resolutionNote: 42 }),
    ).toEqual({ ok: false, error: "invalid_resolution_note" });
    expect(
      normalizeFactResolution({
        state: "known",
        resolutionNote: "x".repeat(5001),
      }),
    ).toEqual({ ok: false, error: "invalid_resolution_note" });
    expect(
      normalizeFactResolution({ state: "known", resolutionNote: "\ud800" }),
    ).toEqual({ ok: false, error: "invalid_resolution_note" });
  });
});

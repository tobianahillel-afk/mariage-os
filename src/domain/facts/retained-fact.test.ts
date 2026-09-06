import { describe, expect, it } from "vitest";
import { normalizeRetainedFact } from "./retained-fact";

const booleanDefinition = { valueType: "boolean", optionsJson: null } as const;

describe("retained fact state/value semantics", () => {
  it("preserves known false as factual truth", () => {
    expect(
      normalizeRetainedFact(booleanDefinition, {
        state: "known",
        retainedValue: false,
      }),
    ).toEqual({
      ok: true,
      value: { state: "known", retainedValue: false },
    });
  });

  it.each(["unknown", "not_applicable", "conflict"] as const)(
    "keeps %s distinct and valueless in WP-2.3",
    (state) => {
      expect(
        normalizeRetainedFact(booleanDefinition, {
          state,
          retainedValue: null,
        }),
      ).toEqual({ ok: true, value: { state, retainedValue: null } });
      expect(
        normalizeRetainedFact(booleanDefinition, {
          state,
          retainedValue: false,
        }),
      ).toEqual({ ok: false, error: "invalid_state_value" });
    },
  );

  it("rejects unknown states, null known values and invalid typed known values", () => {
    expect(
      normalizeRetainedFact(booleanDefinition, {
        state: "missing",
        retainedValue: null,
      }),
    ).toEqual({ ok: false, error: "invalid_fact_state" });
    expect(
      normalizeRetainedFact(booleanDefinition, {
        state: "known",
        retainedValue: null,
      }),
    ).toEqual({ ok: false, error: "invalid_state_value" });
    expect(
      normalizeRetainedFact(booleanDefinition, {
        state: "known",
        retainedValue: "false",
      }),
    ).toEqual({ ok: false, error: "invalid_fact_value" });
  });
});

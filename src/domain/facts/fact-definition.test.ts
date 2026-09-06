import { describe, expect, it } from "vitest";
import { normalizeFactDefinition } from "./fact-definition";

const validDraft = {
  key: " capacity_seated_advertised ",
  label: " Advertised seated capacity ",
  valueType: "number",
  unit: " people ",
  priority: "important",
  weight: 3,
  freshnessPolicy: " quote_refresh ",
  optionsJson: { min: 0, max: 500, integer: true },
  evaluationRuleJson: { type: "number_min", minimum: 150 },
} as const;

describe("fact definition normalization", () => {
  it("normalizes stable custom Venue definition metadata", () => {
    expect(normalizeFactDefinition(validDraft)).toEqual({
      ok: true,
      value: {
        key: "capacity_seated_advertised",
        label: "Advertised seated capacity",
        valueType: "number",
        unit: "people",
        priority: "important",
        weight: 3,
        freshnessPolicy: "quote_refresh",
        optionsJson: { min: 0, max: 500, integer: true },
        evaluationRuleJson: { type: "number_min", minimum: 150 },
      },
    });
  });

  it("accepts nullable optional metadata and exact canonical units", () => {
    expect(
      normalizeFactDefinition({
        ...validDraft,
        key: "route_duration",
        valueType: "duration",
        unit: "minutes",
        weight: null,
        freshnessPolicy: null,
        optionsJson: null,
        evaluationRuleJson: null,
      }).ok,
    ).toBe(true);
    expect(
      normalizeFactDefinition({
        ...validDraft,
        key: "route_distance",
        valueType: "distance",
        unit: "meters",
        optionsJson: null,
        evaluationRuleJson: null,
      }).ok,
    ).toBe(true);
  });

  it("accepts the numeric storage boundary for weight", () => {
    expect(
      normalizeFactDefinition({ ...validDraft, weight: 99_999.999 }).ok,
    ).toBe(true);
  });

  it("counts label limits by Unicode code point", () => {
    const maximum = "😀".repeat(240);
    const oversized = "😀".repeat(241);
    const valid = normalizeFactDefinition({ ...validDraft, label: maximum });
    const invalid = normalizeFactDefinition({ ...validDraft, label: oversized });

    expect(valid.ok).toBe(true);
    expect(invalid.ok).toBe(false);
  });
});

describe("fact definition identity validation", () => {
  it.each([
    [{ ...validDraft, key: 1 }, "invalid_key"],
    [{ ...validDraft, key: "" }, "invalid_key"],
    [{ ...validDraft, key: "Bad-Key" }, "invalid_key"],
    [{ ...validDraft, key: "x".repeat(121) }, "invalid_key"],
    [{ ...validDraft, label: null }, "invalid_label"],
    [{ ...validDraft, label: " " }, "invalid_label"],
    [{ ...validDraft, label: "x".repeat(241) }, "invalid_label"],
    [{ ...validDraft, valueType: "object" }, "invalid_value_type"],
    [{ ...validDraft, unit: 1 }, "invalid_unit"],
    [{ ...validDraft, unit: " " }, "invalid_unit"],
    [{ ...validDraft, unit: "x".repeat(81) }, "invalid_unit"],
    [{ ...validDraft, valueType: "duration", unit: "hours" }, "invalid_unit"],
    [{ ...validDraft, valueType: "distance", unit: "km" }, "invalid_unit"],
  ] as const)("rejects invalid core metadata %#", (draft, error) => {
    expect(normalizeFactDefinition(draft)).toEqual({ ok: false, error });
  });
});

describe("fact definition configurable metadata validation", () => {
  it.each([
    [{ ...validDraft, priority: "critical" }, "invalid_priority"],
    [{ ...validDraft, weight: "3" }, "invalid_weight"],
    [{ ...validDraft, weight: Number.NaN }, "invalid_weight"],
    [{ ...validDraft, weight: -1 }, "invalid_weight"],
    [{ ...validDraft, weight: 100_000 }, "invalid_weight"],
    [{ ...validDraft, weight: 1.2345 }, "invalid_weight"],
    [{ ...validDraft, freshnessPolicy: 1 }, "invalid_freshness_policy"],
    [{ ...validDraft, freshnessPolicy: " " }, "invalid_freshness_policy"],
    [
      { ...validDraft, freshnessPolicy: "x".repeat(161) },
      "invalid_freshness_policy",
    ],
    [{ ...validDraft, optionsJson: { min: "zero" } }, "invalid_options"],
    [
      {
        ...validDraft,
        evaluationRuleJson: { type: "boolean_equals", expected: true },
      },
      "invalid_evaluation_rule",
    ],
  ] as const)("rejects invalid configurable metadata %#", (draft, error) => {
    expect(normalizeFactDefinition(draft)).toEqual({ ok: false, error });
  });
});

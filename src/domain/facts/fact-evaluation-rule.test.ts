import { describe, expect, it } from "vitest";
import { normalizeFactEvaluationRule } from "./fact-evaluation-rule";

const options = {
  options: [
    { key: "low", labelKey: "criteria.low" },
    { key: "high", labelKey: "criteria.high" },
  ],
} as const;

const validRules = [
  ["boolean", null, { type: "boolean_equals", expected: false }],
  ["number", null, { type: "number_min", minimum: 150 }],
  ["duration", null, { type: "number_max", maximum: 60 }],
  ["distance", null, { type: "number_range", minimum: 1, maximum: 5000 }],
  ["rating", null, { type: "rating_min", minimum: 7.5 }],
  ["select", options, { type: "select_in", accepted: ["low"] }],
  ["select", options, { type: "select_not_in", rejected: ["high"] }],
  ["time", null, { type: "time_at_or_after", time: "01:00", dayOffset: 1 }],
  ["time", null, { type: "time_at_or_before", time: "22:30", dayOffset: 0 }],
  [
    "money",
    null,
    { type: "money_max", maximum: { minor: 1_200_000, currency: "EUR" } },
  ],
  ["boolean", null, { type: "project_target_guest_count_supported" }],
  ["rating", null, { type: "custom_manual_assessment" }],
] as const;

describe("fact evaluation rule storage validation", () => {
  it("accepts null when no evaluation rule is configured", () => {
    expect(normalizeFactEvaluationRule("text", null, null)).toEqual({
      ok: true,
      value: null,
    });
  });

  it.each(validRules)("accepts supported rule %#", (type, metadata, rule) => {
    const result = normalizeFactEvaluationRule(type, metadata, rule);
    expect(result).toEqual({ ok: true, value: rule });
    expect(result.ok && Object.isFrozen(result.value)).toBe(true);
  });
});

describe("fact evaluation rule rejection", () => {
  it.each([
    ["boolean", null, []],
    ["boolean", null, {}],
    ["boolean", null, { type: 1 }],
    ["boolean", null, { type: "unknown" }],
    ["number", null, { type: "boolean_equals", expected: true }],
    ["boolean", null, { type: "boolean_equals", expected: "true" }],
    ["boolean", null, { type: "boolean_equals", expected: true, extra: 1 }],
    ["rating", null, { type: "number_min", minimum: 1 }],
    ["number", null, { type: "number_min", minimum: Number.NaN }],
    ["number", null, { type: "number_max", maximum: "1" }],
    ["number", null, { type: "number_range", minimum: 10, maximum: 1 }],
    ["rating", null, { type: "rating_min", minimum: "7" }],
    ["select", null, { type: "select_in", accepted: ["low"] }],
    ["select", { min: 0 }, { type: "select_in", accepted: ["low"] }],
    ["select", options, { type: "select_in", accepted: [] }],
    ["select", options, { type: "select_in", accepted: ["missing"] }],
    ["select", options, { type: "select_in", accepted: ["low", "low"] }],
    ["select", options, { type: "select_not_in", rejected: [1] }],
    ["text", null, { type: "select_in", accepted: ["low"] }],
    ["time", null, { type: "time_at_or_after", time: "25:00", dayOffset: 0 }],
    ["time", null, { type: "time_at_or_after", time: "22:00", dayOffset: 3 }],
    ["time", null, { type: "time_at_or_after", time: "22:00", dayOffset: 0.5 }],
    [
      "money",
      null,
      { type: "money_max", maximum: { minor: -1, currency: "EUR" } },
    ],
    [
      "money",
      null,
      { type: "money_max", maximum: { minor: 10.5, currency: "EUR" } },
    ],
    [
      "money",
      null,
      { type: "money_max", maximum: { minor: 10, currency: "eur" } },
    ],
    ["number", null, { type: "project_target_guest_count_supported" }],
    ["text", null, { type: "custom_manual_assessment" }],
    ["boolean", null, { type: "custom_manual_assessment", expected: true }],
  ] as const)(
    "rejects malformed or incompatible rule %#",
    (type, metadata, rule) => {
      expect(normalizeFactEvaluationRule(type, metadata, rule)).toEqual({
        ok: false,
        error: "invalid_evaluation_rule",
      });
    },
  );
});

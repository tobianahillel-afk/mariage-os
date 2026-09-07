import { describe, expect, it } from "vitest";
import type { FactEvaluationRule } from "./fact-evaluation-rule";
import { evaluateKnownRule } from "./criterion-rule-evaluators";

function evaluate(value: unknown, rule: FactEvaluationRule) {
  return evaluateKnownRule(value, rule);
}

describe("criterion numeric rule evaluators", () => {
  it.each([
    [3, { type: "number_min", minimum: 2 }, "PASS"],
    [3, { type: "number_max", maximum: 2 }, "FAIL"],
    [4, { type: "rating_min", minimum: 4 }, "PASS"],
  ] as const)("evaluates numeric rule %#", (value, rule, outcome) => {
    expect(evaluate(value, rule)).toMatchObject({ outcome });
  });

  it.each([
    [1, "FAIL"],
    [3, "PASS"],
    [5, "FAIL"],
  ] as const)("evaluates number range at %i", (value, outcome) => {
    expect(
      evaluate(value, { type: "number_range", minimum: 2, maximum: 4 }),
    ).toMatchObject({ outcome, target: { minimum: 2, maximum: 4 } });
  });
});

describe("criterion membership and manual evaluators", () => {
  it("evaluates boolean and exact manual values", () => {
    expect(evaluate(true, { type: "boolean_equals", expected: true })).toMatchObject({
      outcome: "PASS",
      target: true,
    });
    expect(
      evaluate("yes", { type: "custom_manual_assessment", accepted: "no" }),
    ).toMatchObject({ outcome: "FAIL", target: "no" });
  });

  it("evaluates accepted and rejected select memberships", () => {
    expect(
      evaluate("garden", { type: "select_in", accepted: ["garden", "hall"] }),
    ).toMatchObject({ outcome: "PASS" });
    expect(
      evaluate("barn", { type: "select_not_in", rejected: ["barn"] }),
    ).toMatchObject({ outcome: "FAIL" });
  });
});

describe("criterion temporal and money evaluators", () => {
  it("compares clock values including day offsets", () => {
    expect(
      evaluate(
        { time: "00:15", dayOffset: 1 },
        { type: "time_at_or_after", time: "23:45", dayOffset: 0 },
      ),
    ).toMatchObject({ outcome: "PASS" });
    expect(
      evaluate(
        { time: "23:30", dayOffset: 0 },
        { type: "time_at_or_before", time: "00:15", dayOffset: 1 },
      ),
    ).toMatchObject({ outcome: "PASS" });
  });

  it("handles money pass, fail and currency mismatch", () => {
    const maximum = { minor: 10000, currency: "EUR" };
    expect(evaluate({ minor: 9000, currency: "EUR" }, { type: "money_max", maximum })).toMatchObject({ outcome: "PASS" });
    expect(evaluate({ minor: 11000, currency: "EUR" }, { type: "money_max", maximum })).toMatchObject({ outcome: "FAIL" });
    expect(evaluate({ minor: 9000, currency: "USD" }, { type: "money_max", maximum })).toMatchObject({
      outcome: "UNKNOWN",
      reason: "currency_mismatch",
    });
  });
});

describe("criterion evaluator registry boundaries", () => {
  it("returns null for an unknown rule type", () => {
    expect(evaluate(true, { type: "unknown_rule" })).toBeNull();
  });

  it("exercises false boolean and inverse select branches", () => {
    expect(evaluate(false, { type: "boolean_equals", expected: true })).toMatchObject({ outcome: "FAIL" });
    expect(evaluate("other", { type: "select_in", accepted: ["garden"] })).toMatchObject({ outcome: "FAIL" });
    expect(evaluate("other", { type: "select_not_in", rejected: ["barn"] })).toMatchObject({ outcome: "PASS" });
  });
});

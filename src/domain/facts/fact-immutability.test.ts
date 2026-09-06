import { describe, expect, it } from "vitest";
import { normalizeFactEvaluationRule } from "./fact-evaluation-rule";
import { normalizeFactOptions } from "./fact-options";

describe("normalized fact JSON immutability", () => {
  it("detaches and freezes numeric and select option metadata", () => {
    const numeric = normalizeFactOptions("number", { min: 1, max: 2 });
    expect(numeric.ok).toBe(true);
    if (!numeric.ok || numeric.value === null || "options" in numeric.value) {
      throw new Error("Expected normalized numeric options.");
    }
    expect(Object.isFrozen(numeric.value)).toBe(true);

    const source = {
      options: [{ key: "low", labelKey: "criteria.low" }],
    };
    const select = normalizeFactOptions("select", source);
    expect(select.ok).toBe(true);
    if (!select.ok || select.value === null || !("options" in select.value)) {
      throw new Error("Expected normalized select options.");
    }

    source.options[0]!.key = "changed";
    source.options.push({ key: "high", labelKey: "criteria.high" });
    expect(select.value.options).toEqual([
      { key: "low", labelKey: "criteria.low" },
    ]);
    expect(Object.isFrozen(select.value)).toBe(true);
    expect(Object.isFrozen(select.value.options)).toBe(true);
    expect(Object.isFrozen(select.value.options[0])).toBe(true);
  });

  it("deep-copies and freezes nested evaluation-rule values", () => {
    const options = {
      options: [{ key: "low", labelKey: "criteria.low" }],
    } as const;
    const selectSource = { type: "select_in", accepted: ["low"] };
    const selectRule = normalizeFactEvaluationRule(
      "select",
      options,
      selectSource,
    );
    expect(selectRule.ok).toBe(true);
    if (!selectRule.ok || selectRule.value === null) {
      throw new Error("Expected normalized select rule.");
    }

    selectSource.accepted[0] = "changed";
    expect(selectRule.value.accepted).toEqual(["low"]);
    expect(Object.isFrozen(selectRule.value)).toBe(true);
    expect(Object.isFrozen(selectRule.value.accepted)).toBe(true);

    const moneySource = {
      type: "money_max",
      maximum: { minor: 5000, currency: "EUR" },
    };
    const moneyRule = normalizeFactEvaluationRule("money", null, moneySource);
    expect(moneyRule.ok).toBe(true);
    if (!moneyRule.ok || moneyRule.value === null) {
      throw new Error("Expected normalized money rule.");
    }

    moneySource.maximum.minor = 1;
    expect(moneyRule.value.maximum).toEqual({ minor: 5000, currency: "EUR" });
    expect(Object.isFrozen(moneyRule.value.maximum)).toBe(true);
  });
});

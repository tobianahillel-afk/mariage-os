import { describe, expect, it } from "vitest";
import { normalizeFactDefinition } from "./fact-definition";
import { normalizeFactOptions } from "./fact-options";
import { hasCodePointLengthBetween } from "./fact-text-length";
import { normalizeFactValue } from "./fact-value";

const LONE_HIGH_SURROGATE = JSON.parse('"\\ud800"') as string;
const LONE_LOW_SURROGATE = JSON.parse('"\\udc00"') as string;

describe("fact Unicode scalar validation", () => {
  it("counts valid surrogate pairs as one scalar and rejects isolated surrogates", () => {
    expect(hasCodePointLengthBetween("😀", 1, 1)).toBe(true);
    expect(hasCodePointLengthBetween(LONE_HIGH_SURROGATE, 1, 1)).toBe(false);
    expect(hasCodePointLengthBetween(LONE_LOW_SURROGATE, 1, 1)).toBe(false);
  });

  it("rejects malformed Unicode across persisted fact text boundaries", () => {
    expect(
      normalizeFactValue(
        { valueType: "text", optionsJson: null },
        LONE_HIGH_SURROGATE,
      ).ok,
    ).toBe(false);
    expect(
      normalizeFactOptions("select", {
        options: [{ key: "one", labelKey: LONE_LOW_SURROGATE }],
      }).ok,
    ).toBe(false);
    expect(
      normalizeFactDefinition({
        key: "unicode_boundary",
        label: LONE_HIGH_SURROGATE,
        valueType: "text",
        unit: null,
        priority: "important",
        weight: null,
        freshnessPolicy: null,
        optionsJson: null,
        evaluationRuleJson: null,
      }).ok,
    ).toBe(false);
  });
});

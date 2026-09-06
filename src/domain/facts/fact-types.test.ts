import { describe, expect, it } from "vitest";
import {
  FACT_PRIORITIES,
  FACT_STATES,
  FACT_VALUE_TYPES,
  isFactPriority,
  isFactState,
  isFactValueType,
} from "./fact-types";

describe("fact type registries", () => {
  it("exposes the frozen value types, priorities and retained states", () => {
    expect(FACT_VALUE_TYPES).toHaveLength(12);
    expect(FACT_PRIORITIES).toEqual([
      "blocking",
      "important",
      "bonus",
      "informational",
    ]);
    expect(FACT_STATES).toEqual([
      "known",
      "unknown",
      "not_applicable",
      "conflict",
    ]);
  });

  it.each(FACT_VALUE_TYPES)("accepts value type %s", (value) => {
    expect(isFactValueType(value)).toBe(true);
  });

  it.each(FACT_PRIORITIES)("accepts priority %s", (value) => {
    expect(isFactPriority(value)).toBe(true);
  });

  it.each(FACT_STATES)("accepts state %s", (value) => {
    expect(isFactState(value)).toBe(true);
  });

  it("fails closed for unknown registry values", () => {
    expect(isFactValueType("object")).toBe(false);
    expect(isFactPriority("blocking-negative")).toBe(false);
    expect(isFactState(null)).toBe(false);
  });
});

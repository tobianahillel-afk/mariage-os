import { describe, expect, it } from "vitest";
import { compareVenueCodes } from "./venue-code";

describe("compareVenueCodes", () => {
  it("sorts numeric suffixes naturally", () => {
    const values = ["P10", "P2", "P1"];
    expect(values.sort(compareVenueCodes)).toEqual(["P1", "P2", "P10"]);
  });

  it("normalizes whitespace and case", () => {
    expect(compareVenueCodes(" s02 ", "S2")).toBeGreaterThan(0);
    expect(compareVenueCodes("s2", "S2")).toBe(0);
  });

  it("orders numeric parts before textual parts at the same position", () => {
    expect(compareVenueCodes("P2", "PA")).toBeLessThan(0);
    expect(compareVenueCodes("PA", "P2")).toBeGreaterThan(0);
  });

  it("uses the remaining part count when a prefix is otherwise equal", () => {
    expect(compareVenueCodes("P", "P2")).toBeLessThan(0);
    expect(compareVenueCodes("P2", "P")).toBeGreaterThan(0);
  });

  it("sorts blank and missing codes last", () => {
    expect(compareVenueCodes(null, "P1")).toBeGreaterThan(0);
    expect(compareVenueCodes("P1", null)).toBeLessThan(0);
    expect(compareVenueCodes("   ", null)).toBe(0);
  });

  it("keeps prefix ordering deterministic", () => {
    expect(compareVenueCodes("P2", "S2")).toBeLessThan(0);
  });
});

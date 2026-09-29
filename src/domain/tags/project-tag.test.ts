import { describe, expect, it } from "vitest";
import {
  isCanonicalTagKey,
  isCanonicalTagLabel,
  normalizeTagKey,
  normalizeTagLabel,
} from "./project-tag";

describe("project tag boundaries", () => {
  it("normalizes an input key once and keeps its canonical identity strict", () => {
    expect(normalizeTagKey("  Garden_2026  ")).toBe("garden_2026");
    expect(isCanonicalTagKey("garden_2026")).toBe(true);
    expect(isCanonicalTagKey("Garden_2026")).toBe(false);
    expect(normalizeTagKey("-garden")).toBeNull();
    expect(normalizeTagKey("gar den")).toBeNull();
    expect(normalizeTagKey("école")).toBeNull();
    expect(normalizeTagKey("a".repeat(65))).toBeNull();
  });

  it("preserves safe Unicode labels within an 80-scalar boundary", () => {
    expect(normalizeTagLabel("  Jardin 🌿  ")).toBe("Jardin 🌿");
    expect(isCanonicalTagLabel("🌿".repeat(80))).toBe(true);
    expect(normalizeTagLabel("🌿".repeat(81))).toBeNull();
    expect(normalizeTagLabel("  ")).toBeNull();
    expect(normalizeTagLabel("good\nunsafe")).toBeNull();
    expect(normalizeTagLabel("good\u0085unsafe")).toBeNull();
    expect(normalizeTagLabel("\ud800")).toBeNull();
  });
});

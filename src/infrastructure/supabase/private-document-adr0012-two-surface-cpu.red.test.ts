import { describe, expect, it } from "vitest";

const evaluatorModules = import.meta.glob(
  "../../../scripts/private-document-ar006-two-surface-metrics.mjs",
  { eager: true },
);

describe("ADR 0012 two-surface CPU evaluator RED", () => {
  it("adds a dedicated evaluator module before provider evidence is enabled", () => {
    expect(Object.keys(evaluatorModules)).toHaveLength(1);
  });
});

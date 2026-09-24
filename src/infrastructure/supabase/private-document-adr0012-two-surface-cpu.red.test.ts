import { describe, expect, it } from "vitest";

const evaluatorModules = import.meta.glob(
  "../../../scripts/private-document-ar006-two-surface-metrics.mjs",
  { eager: true },
);
const pagesModules = import.meta.glob(
  "../../../functions/api/private-document-promote.ts",
  { eager: true, import: "default", query: "?raw" },
);
const workerModules = import.meta.glob(
  "../../../workers/private-document-promotion/src/worker.ts",
  { eager: true, import: "default", query: "?raw" },
);

describe("ADR 0012 two-surface CPU evaluator RED", () => {
  it("adds a dedicated evaluator module", () => {
    expect(Object.keys(evaluatorModules)).toHaveLength(1);
  });

  it("marks the Pages and Durable Object surfaces separately", () => {
    const pagesSource = Object.values(pagesModules)[0];
    const workerSource = Object.values(workerModules)[0];

    expect(pagesSource).toContain("pages-ingress");
    expect(workerSource).toContain("durable-object");
  });

  it("keeps the exact-size provider job disabled until evaluator review", async () => {
    const ci = await import("../../../.github/workflows/ci.yml?raw");
    expect(ci.default).toContain("[AR006-DO-EVIDENCE]");
    expect(ci.default).toContain("if: ${{ false }}");
  });
});

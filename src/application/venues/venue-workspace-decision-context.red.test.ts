import { describe, expect, it } from "vitest";
import readSource from "./venue-workspace-read-service.ts?raw";

describe("WP-2.11 decision-context application RED", () => {
  it("keeps critical decision facts in the application read model", () => {
    expect(readSource).toContain("missingCriticalCriteria");
    expect(readSource).toContain("targetGuestCount");
    expect(readSource).toContain("supportMaximumGuestCount");
    expect(readSource).toContain("externalCatererOutcome");
    expect(readSource).toContain("decisionContext");
  });
});

import { describe, expect, it } from "vitest";
import runtimeSource from "./browser-shell-runtime.ts?raw";

describe("WP-2.11 decision-context runtime RED", () => {
  it("composes accepted commercial, availability and access adapters", () => {
    expect(runtimeSource).toContain("VenueWorkspaceDecisionContextService");
    expect(runtimeSource).toContain("SupabaseVenueOfferAdapter");
    expect(runtimeSource).toContain("SupabaseVenueAvailabilityAdapter");
    expect(runtimeSource).toContain("SupabaseVenueAccessAdapter");
  });
});

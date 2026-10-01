import { describe, expect, it } from "vitest";
import bootstrapSource from "../../../app/bootstrap/start-application.ts?raw";
import runtimeSource from "../../../app/bootstrap/browser-shell-runtime.ts?raw";
import rendererSource from "../render-venue-workspace.ts?raw";

describe("WP-2.11 data-driven Venue workspace RED", () => {
  it("composes the accepted Venue read service in the browser runtime", () => {
    expect(runtimeSource).toContain("VenueWorkspaceReadService");
    expect(runtimeSource).toContain("SupabaseVenueRepositoryAdapter");
    expect(runtimeSource).toContain("SupabaseVenueCompatibilityQueryAdapter");
    expect(runtimeSource).toContain("SupabaseVenueMemberOpinionAdapter");
  });

  it("loads Venue workspace data at the bootstrap boundary", () => {
    expect(bootstrapSource).toContain("venueWorkspaceRead");
    expect(bootstrapSource).toContain("venueWorkspace");
  });

  it("renders real Gallery and controlled Table surfaces", () => {
    expect(rendererSource).toContain("data-venue-card");
    expect(rendererSource).toContain("data-venue-table");
    expect(rendererSource).not.toContain(
      "Les salles autorisées de ce projet apparaîtront ici",
    );
  });

  it("renders decision-first detail and practical comparison surfaces", () => {
    expect(rendererSource).toContain("data-venue-blocking-status");
    expect(rendererSource).toContain("data-venue-weighted-score");
    expect(rendererSource).toContain("data-venue-compare-grid");
    expect(rendererSource).toContain("data-only-differences");
    expect(rendererSource).not.toContain(
      "Le résumé de cette salle sera chargé",
    );
    expect(rendererSource).not.toContain(
      "Sélectionnez entre deux et cinq salles du même projet pour les comparer",
    );
  });
});

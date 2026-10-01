import { describe, expect, it } from "vitest";
import bootstrapSource from "./start-application.ts?raw";
import runtimeSource from "./browser-shell-runtime.ts?raw";
import collectionSource from "../../ui/venues/render-venue-collection.ts?raw";
import compareSource from "../../ui/venues/render-venue-compare.ts?raw";
import detailSource from "../../ui/venues/render-venue-detail.ts?raw";

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
    expect(collectionSource).toContain("data-venue-card");
    expect(collectionSource).toContain("data-venue-table");
    expect(collectionSource).not.toContain(
      "Les salles autorisées de ce projet apparaîtront ici",
    );
  });

  it("renders decision-first detail and practical comparison surfaces", () => {
    expect(detailSource).toContain("data-venue-blocking-status");
    expect(detailSource).toContain("data-venue-weighted-score");
    expect(compareSource).toContain("data-venue-compare-grid");
    expect(compareSource).toContain("data-only-differences");
    expect(detailSource).not.toContain("Le résumé de cette salle sera chargé");
    expect(compareSource).not.toContain(
      "Sélectionnez entre deux et cinq salles du même projet pour les comparer",
    );
  });
});

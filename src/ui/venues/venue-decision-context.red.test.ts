import { describe, expect, it } from "vitest";
import readSource from "../../../src/application/venues/venue-workspace-read-service.ts?raw";
import runtimeSource from "../../../src/app/bootstrap/browser-shell-runtime.ts?raw";
import collectionSource from "../../../src/ui/venues/render-venue-collection.ts?raw";
import detailSource from "../../../src/ui/venues/render-venue-detail.ts?raw";
import compareSource from "../../../src/ui/venues/render-venue-compare.ts?raw";

describe("WP-2.11 decision-context RED", () => {
  it("keeps critical decision facts in the application read model", () => {
    expect(readSource).toContain("missingCriticalCriteria");
    expect(readSource).toContain("targetGuestCount");
    expect(readSource).toContain("supportMaximumGuestCount");
    expect(readSource).toContain("externalCatererOutcome");
    expect(readSource).toContain("decisionContext");
  });

  it("composes accepted commercial, availability and access adapters", () => {
    expect(runtimeSource).toContain("VenueWorkspaceDecisionContextService");
    expect(runtimeSource).toContain("SupabaseVenueOfferAdapter");
    expect(runtimeSource).toContain("SupabaseVenueAvailabilityAdapter");
    expect(runtimeSource).toContain("SupabaseVenueAccessAdapter");
  });

  it("uses the frozen controlled table decision columns", () => {
    for (const label of [
      "Capacité",
      "Prix",
      "Traiteur externe",
      "Accès",
      "Devis",
      "Manquants critiques",
    ]) {
      expect(collectionSource).toContain(label);
    }
  });

  it("renders the summary-first detail decision context", () => {
    for (const label of [
      "Prix",
      "Disponibilité",
      "Accès",
      "Prochaine action",
      "Commercial",
      "Logistique",
      "Éléments de preuve",
    ]) {
      expect(detailSource).toContain(label);
    }
  });

  it("orders compare decision rows before partner opinions", () => {
    const labels = [
      "Blocage",
      "Capacité",
      "Prix",
      "Accès",
      "Disponibilité",
      "Devis",
      "Preuves",
      "Avis partenaires",
    ];
    let previous = -1;
    for (const label of labels) {
      const current = compareSource.indexOf(label);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });
});

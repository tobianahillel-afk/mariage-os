import { describe, expect, it } from "vitest";
import collectionSource from "./render-venue-collection.ts?raw";
import detailSource from "./render-venue-detail.ts?raw";
import compareSource from "./render-venue-compare.ts?raw";

describe("WP-2.11 decision-context UI RED", () => {
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

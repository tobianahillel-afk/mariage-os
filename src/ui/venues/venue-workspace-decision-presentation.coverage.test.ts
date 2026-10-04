import { describe, expect, it } from "vitest";
import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import {
  accessContext,
  accessDetails,
  availabilityContext,
  capacityContext,
  externalCatererContext,
  missingCriticalContext,
  nextAction,
  priceContext,
  quoteContext,
  strengthsContext,
} from "./venue-workspace-decision-presentation";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";

function baseItem(): VenueWorkspaceItem {
  return {
    venue: {
      id: venueId,
      projectId,
      code: "S1",
      name: "Synthetic",
      status: "shortlist",
      rejectionReason: null,
      websiteUrl: null,
      city: "Paris",
      revision: 1,
    },
    syncState: "synced",
    compatibility: {
      blockingStatus: "PASS",
      weightedScore: 0.9,
      evidenceReadiness: 1,
      unknownImportantCriteria: 0,
      conflictingCriteria: 0,
      missingCriticalCriteria: 0,
      targetGuestCount: 180,
      supportMaximumGuestCount: 200,
      targetGuestCountPasses: true,
      externalCatererOutcome: "PASS",
    },
    decisionContext: {
      commercial: {
        quoteState: "accepted",
        price: {
          kind: "known",
          currency: "EUR",
          minimumAmountMinor: 100_000,
          maximumAmountMinor: 120_000,
        },
      },
      availability: {
        eventDate: "2027-06-12",
        status: "available",
        optionExpiresAt: null,
        observedAt: "2026-10-02T12:00:00.000Z",
      },
      access: {
        car: {
          mode: "car",
          originLabel: "Paris",
          durationMinutes: 45,
          distanceMeters: null,
          transfersCount: null,
          observedAt: "2026-10-02T12:00:00.000Z",
        },
        publicTransport: null,
      },
    },
    opinions: { ownPreference: null, ratings: [] },
  };
}

function withCompatibility(
  overrides: Partial<NonNullable<VenueWorkspaceItem["compatibility"]>>,
): VenueWorkspaceItem {
  const item = baseItem();
  if (item.compatibility === null) throw new Error("Synthetic compatibility.");
  return { ...item, compatibility: { ...item.compatibility, ...overrides } };
}

function withCommercial(
  commercial: NonNullable<VenueWorkspaceItem["decisionContext"]>["commercial"],
): VenueWorkspaceItem {
  const item = baseItem();
  if (item.decisionContext === null) throw new Error("Synthetic context.");
  return { ...item, decisionContext: { ...item.decisionContext, commercial } };
}

describe("Venue decision capacity and commercial presentation", () => {
  it("renders every accepted capacity state", () => {
    expect(capacityContext({ ...baseItem(), compatibility: null })).toBe("—");
    expect(
      capacityContext(
        withCompatibility({
          targetGuestCount: null,
          supportMaximumGuestCount: null,
        }),
      ),
    ).toBe("—");
    expect(
      capacityContext(withCompatibility({ supportMaximumGuestCount: null })),
    ).toContain("à vérifier");
    expect(capacityContext(withCompatibility({ targetGuestCount: null }))).toBe(
      "Max estimé 200 pers.",
    );
    expect(
      capacityContext(withCompatibility({ targetGuestCountPasses: null })),
    ).toContain("à vérifier");
    expect(
      capacityContext(withCompatibility({ targetGuestCountPasses: false })),
    ).toContain("insuffisant");
    expect(capacityContext(baseItem())).toContain("compatible");
  });

  it("renders absent, mixed, equal and ranged prices safely", () => {
    const absent = { ...baseItem(), decisionContext: null };
    expect(priceContext(absent)).toBe("—");
    expect(quoteContext(absent)).toBe("—");

    const noPrice = withCommercial({ quoteState: "quoted", price: null });
    expect(priceContext(noPrice)).toBe("—");

    const mixed = withCommercial({
      quoteState: "draft",
      price: { kind: "mixed_currency" },
    });
    expect(priceContext(mixed)).toBe("Plusieurs devises");
    expect(quoteContext(mixed)).toBe("Brouillon");

    const equal = withCommercial({
      quoteState: "quoted",
      price: {
        kind: "known",
        currency: "EUR",
        minimumAmountMinor: 100_000,
        maximumAmountMinor: 100_000,
      },
    });
    expect(priceContext(equal)).not.toContain("–");

    const fallback = withCommercial({
      quoteState: "accepted",
      price: {
        kind: "known",
        currency: "INVALID",
        minimumAmountMinor: 100_000,
        maximumAmountMinor: 120_000,
      },
    });
    expect(priceContext(fallback)).toBe("1000.00 INVALID – 1200.00 INVALID");
  });
});

describe("Venue decision access and availability presentation", () => {
  it("renders absent and partial access without inventing routes", () => {
    const absent = { ...baseItem(), decisionContext: null };
    expect(accessDetails(absent)).toEqual([]);
    expect(accessContext(absent)).toBe("—");

    const item = baseItem();
    if (item.decisionContext === null) throw new Error("Synthetic context.");
    const partial = {
      ...item,
      decisionContext: {
        ...item.decisionContext,
        access: {
          car: {
            mode: "car" as const,
            originLabel: "Paris",
            durationMinutes: null,
            distanceMeters: null,
            transfersCount: null,
            observedAt: "2026-10-02T12:00:00.000Z",
          },
          publicTransport: {
            mode: "public_transport" as const,
            originLabel: "Paris",
            durationMinutes: 70,
            distanceMeters: null,
            transfersCount: 2,
            observedAt: "2026-10-02T12:00:00.000Z",
          },
        },
      },
    };
    expect(accessContext(partial)).toContain("durée inconnue");
    expect(accessContext(partial)).toContain("2 correspondances");
  });

  it("renders explicit availability and critical-data states", () => {
    const absent = { ...baseItem(), decisionContext: null };
    expect(availabilityContext(absent)).toBe("—");
    expect(availabilityContext(baseItem())).toBe("2027-06-12 · Disponible");
    expect(missingCriticalContext({ ...baseItem(), compatibility: null })).toBe(
      "—",
    );
    expect(missingCriticalContext(baseItem())).toBe("0");
    expect(externalCatererContext({ ...baseItem(), compatibility: null })).toBe(
      "—",
    );
    expect(
      externalCatererContext(
        withCompatibility({ externalCatererOutcome: null }),
      ),
    ).toBe("—");
    expect(externalCatererContext(baseItem())).toBe("Autorisé");
  });
});

describe("Venue decision next-action priority", () => {
  it("covers conflict, blocker and missing-critical priorities", () => {
    expect(nextAction({ ...baseItem(), syncState: "conflict" })).toBe(
      "Résoudre le conflit local",
    );
    expect(nextAction(withCompatibility({ blockingStatus: "FAIL" }))).toBe(
      "Vérifier les critères bloquants",
    );
    expect(nextAction(withCompatibility({ blockingStatus: "CONFLICT" }))).toBe(
      "Vérifier les critères bloquants",
    );
    expect(nextAction(withCompatibility({ missingCriticalCriteria: 2 }))).toBe(
      "Compléter les informations critiques",
    );
  });

  it("covers quote and availability priorities", () => {
    expect(nextAction({ ...baseItem(), decisionContext: null })).toBe(
      "Obtenir ou compléter le devis",
    );
    expect(
      nextAction(withCommercial({ quoteState: "none", price: null })),
    ).toBe("Obtenir ou compléter le devis");
    expect(
      nextAction(withCommercial({ quoteState: "draft", price: null })),
    ).toBe("Obtenir ou compléter le devis");

    const item = baseItem();
    if (item.decisionContext === null) throw new Error("Synthetic context.");
    expect(
      nextAction({
        ...item,
        decisionContext: { ...item.decisionContext, availability: null },
      }),
    ).toBe("Confirmer une disponibilité datée");
  });

  it("falls through only for a comparison-ready Venue", () => {
    expect(nextAction(baseItem())).toBe("Comparer avec les finalistes");
    expect(nextAction({ ...baseItem(), compatibility: null })).toBe(
      "Comparer avec les finalistes",
    );
    expect(strengthsContext(baseItem())).toBe(
      "Aucun critère bloquant en échec",
    );
    expect(
      strengthsContext(withCompatibility({ blockingStatus: "FAIL" })),
    ).toBe("—");
  });
});

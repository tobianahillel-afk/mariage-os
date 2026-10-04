import { expect, it } from "vitest";
import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import {
  accessContext,
  reservationsContext,
} from "./venue-workspace-decision-presentation";

function compatibilityOf(item: VenueWorkspaceItem) {
  if (item.compatibility === null) {
    throw new Error("Synthetic review item must include compatibility.");
  }
  return item.compatibility;
}

function item(blockingStatus: "PASS" | "FAIL" | "CONFLICT" | "UNKNOWN") {
  return {
    venue: {
      id: "91111111-1111-4111-8111-111111111111",
      projectId: "81111111-1111-4111-8111-111111111111",
      code: "S1",
      name: "Synthetic",
      status: "research",
      rejectionReason: null,
      websiteUrl: null,
      city: "Paris",
      revision: 1,
    },
    syncState: "synced",
    compatibility: {
      blockingStatus,
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
      commercial: null,
      availability: null,
      access: {
        car: {
          mode: "car",
          originLabel: "Paris",
          durationMinutes: 45,
          distanceMeters: null,
          transfersCount: null,
          observedAt: "2026-10-02T12:00:00.000Z",
        },
        publicTransport: {
          mode: "public_transport",
          originLabel: "Paris",
          durationMinutes: 70,
          distanceMeters: null,
          transfersCount: 1,
          observedAt: "2026-10-02T12:00:00.000Z",
        },
      },
    },
    opinions: { ownPreference: null, ratings: [] },
  } as VenueWorkspaceItem;
}

it("keeps car and public transport in compare access context", () => {
  expect(accessContext(item("PASS"))).toContain("Voiture");
  expect(accessContext(item("PASS"))).toContain("Transports");
});

it.each([
  ["FAIL", "Critère bloquant en échec"],
  ["CONFLICT", "Critère bloquant en conflit"],
  ["UNKNOWN", "Critère bloquant à vérifier"],
] as const)("surfaces %s blocking reservations", (status, expected) => {
  expect(reservationsContext(item(status))).toContain(expected);
});

it("only reports no critical reservation for a clean summary", () => {
  expect(reservationsContext(item("PASS"))).toBe(
    "Aucune réserve critique connue",
  );
  const base = item("PASS");
  expect(
    reservationsContext({
      ...base,
      compatibility: {
        ...compatibilityOf(base),
        missingCriticalCriteria: 2,
        conflictingCriteria: 1,
      },
    }),
  ).toBe("2 manquant(s) critique(s) · 1 conflit(s)");
  expect(reservationsContext({ ...base, compatibility: null })).toBe("—");
});

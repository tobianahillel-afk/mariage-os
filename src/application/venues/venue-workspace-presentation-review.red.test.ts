import { describe, expect, it } from "vitest";
import type { VenueWorkspaceItem } from "./venue-workspace-read-service";
import {
  accessContext,
  reservationsContext,
} from "../../ui/venues/venue-workspace-decision-presentation";

function item(): VenueWorkspaceItem {
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
      blockingStatus: "FAIL",
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
  };
}

describe("WP-2.11 decision review RED", () => {
  it("keeps both access modes in the comparison value", () => {
    expect(accessContext(item())).toContain("Voiture");
    expect(accessContext(item())).toContain("Transports");
  });

  it("never calls a failed blocker no critical reservation", () => {
    const value = reservationsContext(item());
    expect(value).toContain("bloquant");
    expect(value).not.toBe("Aucune réserve critique connue");
  });
});

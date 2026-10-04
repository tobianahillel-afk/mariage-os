import { describe, expect, it, vi } from "vitest";
import type { CriterionDefinition } from "@domain/facts/criterion-types";
import type { VenueCompatibilityInputs } from "./venue-compatibility-query-port";
import type { VenueMemberOpinionPort } from "./venue-member-opinion-service";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "./venue-repository-port";
import type { VenueWorkspaceDecisionContextReader } from "./venue-workspace-decision-context";
import { VenueWorkspaceReadService } from "./venue-workspace-read-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";

function venue(): VenueCoreRecord {
  return {
    id: venueId,
    projectId,
    code: "S1",
    name: "Synthetic",
    status: "research",
    rejectionReason: null,
    websiteUrl: null,
    city: "Paris",
    revision: 1,
  };
}

function importantUnknownInputs(): VenueCompatibilityInputs {
  const definition: CriterionDefinition = {
    key: "parking",
    valueType: "boolean",
    unit: null,
    optionsJson: null,
    priority: "important",
    weight: null,
    evaluationRuleJson: { type: "boolean_equals", expected: true },
    systemDefined: false,
  };
  return {
    projectId,
    venueId,
    projectTargetGuestCount: null,
    snapshots: [
      {
        definition,
        state: null,
        retainedValue: null,
        retainedObservationStatus: null,
        staleAt: null,
      },
    ],
  };
}

function workspace(
  decisionContext?: VenueWorkspaceDecisionContextReader,
): VenueWorkspaceReadService {
  const record = venue();
  const repository = {
    listVenues: vi.fn().mockResolvedValue([record]),
    getVenue: vi.fn().mockResolvedValue(record),
  } as unknown as VenueRepositoryPort;
  const opinions = {
    getOwnVenuePreference: vi.fn().mockResolvedValue(null),
    listVenueRatings: vi.fn().mockResolvedValue([]),
  } as unknown as VenueMemberOpinionPort;
  return new VenueWorkspaceReadService({
    repository,
    compatibility: {
      loadVenueCompatibilityInputs: vi
        .fn()
        .mockResolvedValue(importantUnknownInputs()),
    },
    opinions,
    ...(decisionContext === undefined ? {} : { decisionContext }),
    now: () => "2026-10-04T12:00:00.000Z",
  });
}

describe("VenueWorkspaceReadService decision summary coverage", () => {
  it("keeps important unknowns and absent dynamic/caterer context explicit", async () => {
    const item = await workspace().detail(projectId, venueId, null);
    expect(item?.compatibility).toMatchObject({
      missingCriticalCriteria: 1,
      targetGuestCount: null,
      supportMaximumGuestCount: null,
      targetGuestCountPasses: null,
      externalCatererOutcome: null,
    });
  });

  it("fails soft when the detail decision reader rejects", async () => {
    const reader = {
      read: vi.fn().mockRejectedValue(new Error("decision context")),
      readMany: vi.fn(),
    };
    const item = await workspace(reader).detail(projectId, venueId, null);
    expect(item?.decisionContext).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";
import type { VenueWorkspaceDecisionContextReader } from "./venue-workspace-decision-context";
import { VenueWorkspaceDecisionContextService } from "./venue-workspace-decision-context";
import { VenueWorkspaceReadService } from "./venue-workspace-read-service";
import type { VenueRepositoryPort } from "./venue-repository-port";
import type { VenueCompatibilityQueryPort } from "./venue-compatibility-query-port";
import type { VenueMemberOpinionPort } from "./venue-member-opinion-service";
import type { VenueOfferPort } from "./venue-offer-service";
import type { VenueAvailabilityPort } from "./venue-availability-service";
import type { VenueAccessPort } from "./venue-access-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const firstVenueId = "91111111-1111-4111-8111-111111111111";
const secondVenueId = "92111111-1111-4211-8211-111111111111";

function venue(id: string, code: string) {
  return {
    id,
    projectId,
    code,
    name: code,
    status: "research" as const,
    rejectionReason: null,
    websiteUrl: null,
    city: "Paris",
    revision: 1,
  };
}

describe("WP-2.11 decision-context review RED", () => {
  it("does not invent one current availability across candidate dates", async () => {
    const availability = {
      listVenueAvailabilityHistory: vi.fn().mockResolvedValue([
        {
          id: "a1111111-1111-4111-8111-111111111111",
          projectId,
          venueId: firstVenueId,
          dateOptionId: null,
          eventDate: "2027-07-10",
          status: "available",
          optionExpiresAt: null,
          observedAt: "2026-10-02T11:00:00.000Z",
          sourceId: null,
          notes: null,
          createdAt: "2026-10-02T11:01:00.000Z",
          createdBy: projectId,
          updatedAt: "2026-10-02T11:01:00.000Z",
          updatedBy: projectId,
          revision: 1,
        },
        {
          id: "a2111111-1111-4211-8211-111111111111",
          projectId,
          venueId: firstVenueId,
          dateOptionId: null,
          eventDate: "2027-06-12",
          status: "unavailable",
          optionExpiresAt: null,
          observedAt: "2026-10-01T11:00:00.000Z",
          sourceId: null,
          notes: null,
          createdAt: "2026-10-01T11:01:00.000Z",
          createdBy: projectId,
          updatedAt: "2026-10-01T11:01:00.000Z",
          updatedBy: projectId,
          revision: 1,
        },
      ]),
    } as unknown as VenueAvailabilityPort;
    const service = new VenueWorkspaceDecisionContextService({
      offers: {
        listVenueOffers: vi.fn().mockResolvedValue([]),
      } as unknown as VenueOfferPort,
      availability,
      access: {
        getDefaultReferenceOrigin: vi.fn().mockResolvedValue(null),
        listVenueAccessRouteHistory: vi.fn().mockResolvedValue([]),
      } as unknown as VenueAccessPort,
      now: () => "2026-10-04T12:00:00.000Z",
    });

    const result = await service.read(projectId, firstVenueId);
    expect(result.availability).toBeNull();
  });

  it("uses one bulk decision-context read for a collection", async () => {
    const bulk = vi.fn().mockResolvedValue(new Map());
    const perVenue = vi.fn().mockResolvedValue({
      commercial: null,
      availability: null,
      access: null,
    });
    const decisionReader = {
      read: perVenue,
      readMany: bulk,
    };
    const repository = {
      listVenues: vi
        .fn()
        .mockResolvedValue([venue(firstVenueId, "S1"), venue(secondVenueId, "S2")]),
    } as unknown as VenueRepositoryPort;
    const compatibility = {
      loadVenueCompatibilityInputs: vi.fn().mockResolvedValue(null),
    } as VenueCompatibilityQueryPort;
    const opinions = {
      getOwnVenuePreference: vi.fn().mockResolvedValue(null),
      listVenueRatings: vi.fn().mockResolvedValue([]),
    } as unknown as VenueMemberOpinionPort;
    const workspace = new VenueWorkspaceReadService({
      repository,
      compatibility,
      opinions,
      decisionContext: decisionReader as VenueWorkspaceDecisionContextReader,
      now: () => "2026-10-04T12:00:00.000Z",
    });

    await workspace.list(projectId, null);
    expect(bulk).toHaveBeenCalledTimes(1);
    expect(perVenue).not.toHaveBeenCalled();
  });
});

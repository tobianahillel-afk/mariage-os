import { expect, it, vi } from "vitest";
import type { VenueWorkspaceDecisionContextReader } from "./venue-workspace-decision-context";
import type { VenueCompatibilityQueryPort } from "./venue-compatibility-query-port";
import type { VenueMemberOpinionPort } from "./venue-member-opinion-service";
import type { VenueRepositoryPort } from "./venue-repository-port";
import { VenueWorkspaceReadService } from "./venue-workspace-read-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const ids = [
  "91111111-1111-4111-8111-111111111111",
  "92111111-1111-4211-8211-111111111111",
];

function workspace(decisionContext: VenueWorkspaceDecisionContextReader) {
  const venues = ids.map((id, index) => ({
    id,
    projectId,
    code: `S${index + 1}`,
    name: `Venue ${index + 1}`,
    status: "research" as const,
    rejectionReason: null,
    websiteUrl: null,
    city: null,
    revision: 1,
  }));
  const repository = {
    listVenues: vi.fn().mockResolvedValue(venues),
    getVenue: vi.fn().mockResolvedValue(venues[0]),
  } as unknown as VenueRepositoryPort;
  return {
    service: new VenueWorkspaceReadService({
      repository,
      compatibility: {
        loadVenueCompatibilityInputs: vi.fn().mockResolvedValue(null),
      } as VenueCompatibilityQueryPort,
      opinions: {
        getOwnVenuePreference: vi.fn().mockResolvedValue(null),
        listVenueRatings: vi.fn().mockResolvedValue([]),
      } as unknown as VenueMemberOpinionPort,
      decisionContext,
      now: () => "2026-10-04T12:00:00.000Z",
    }),
    repository,
  };
}

it("uses one decision batch for collection and one read for detail", async () => {
  const context = { commercial: null, availability: null, access: null };
  const readMany = vi.fn().mockResolvedValue(
    new Map(ids.map((id) => [id, context])),
  );
  const read = vi.fn().mockResolvedValue(context);
  const fixture = workspace({ read, readMany });

  await fixture.service.list(projectId, null);
  expect(readMany).toHaveBeenCalledTimes(1);
  expect(readMany).toHaveBeenCalledWith(projectId, ids);
  expect(read).not.toHaveBeenCalled();

  await fixture.service.detail(projectId, ids[0] as string, null);
  expect(read).toHaveBeenCalledTimes(1);
});

it("fails soft when collection decision batching is unavailable", async () => {
  const fixture = workspace({
    read: vi.fn(),
    readMany: vi.fn().mockRejectedValue(new Error("decision context")),
  });
  const result = await fixture.service.list(projectId, null);
  expect(result.every((item) => item.decisionContext === null)).toBe(true);
});

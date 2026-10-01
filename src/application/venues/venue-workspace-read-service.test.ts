import { expect, it, vi } from "vitest";
import type { LocalProjectStore } from "@application/local-data/local-project-store";
import type { CachedRecordEnvelope } from "@application/local-data/local-records";
import type { VenueCompatibilityQueryPort } from "./venue-compatibility-query-port";
import { venueCachedRecord } from "./venue-local-cache";
import type { VenueMemberOpinionPort } from "./venue-member-opinion-service";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "./venue-repository-port";
import { VenueWorkspaceReadService } from "./venue-workspace-read-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";
const deviceId = "61111111-1111-4111-8111-111111111111";

function venue(id: string, code: string, name: string): VenueCoreRecord {
  return {
    id,
    projectId,
    code,
    name,
    status: "active",
    rejectionReason: null,
    websiteUrl: null,
    city: "Paris",
    revision: 1,
  };
}

function emptyCompatibility(): VenueCompatibilityQueryPort {
  return {
    loadVenueCompatibilityInputs: vi.fn().mockResolvedValue(null),
  };
}

function emptyOpinions(): VenueMemberOpinionPort {
  return {
    getOwnVenuePreference: vi.fn().mockResolvedValue(null),
    listVenueRatings: vi.fn().mockResolvedValue([]),
    saveVenuePreference: vi.fn(),
    saveVenueRating: vi.fn(),
  };
}

function service(repository: VenueRepositoryPort): VenueWorkspaceReadService {
  return new VenueWorkspaceReadService({
    repository,
    compatibility: emptyCompatibility(),
    opinions: emptyOpinions(),
    now: () => "2026-10-01T11:00:00.000Z",
  });
}

function localStore(record: CachedRecordEnvelope): LocalProjectStore {
  return {
    scope: { projectId, userId, deviceId },
    listCachedRecords: vi.fn().mockResolvedValue([record]),
  } as unknown as LocalProjectStore;
}

it("sorts Gallery candidates by the accepted natural Venue code order", async () => {
  const s10 = venue("91111111-1111-4111-8111-111111111110", "S10", "Dix");
  const s2 = venue("91111111-1111-4111-8111-111111111112", "S2", "Deux");
  const repository: VenueRepositoryPort = {
    listVenues: vi.fn().mockResolvedValue([s10, s2]),
    getVenue: vi.fn(),
    updateVenueCore: vi.fn(),
  };

  const result = await service(repository).list(projectId, null);
  expect(result.map((item) => item.venue.code)).toEqual(["S2", "S10"]);
});

it("keeps pending local working intent above the cloud copy", async () => {
  const cloud = venue("91111111-1111-4111-8111-111111111112", "S2", "Cloud");
  const working = { ...cloud, name: "Working" };
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    working,
    "pending",
  );
  const repository: VenueRepositoryPort = {
    listVenues: vi.fn().mockResolvedValue([cloud]),
    getVenue: vi.fn(),
    updateVenueCore: vi.fn(),
  };

  const [item] = await service(repository).list(projectId, localStore(record));
  expect(item?.venue.name).toBe("Working");
  expect(item?.syncState).toBe("pending");
});

it("falls back to project-scoped local cache when cloud listing fails", async () => {
  const cached = venue("91111111-1111-4111-8111-111111111112", "S2", "Cache");
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    cached,
    "conflict",
  );
  const repository: VenueRepositoryPort = {
    listVenues: vi.fn().mockRejectedValue(new Error("offline")),
    getVenue: vi.fn(),
    updateVenueCore: vi.fn(),
  };

  const [item] = await service(repository).list(projectId, localStore(record));
  expect(item?.venue.name).toBe("Cache");
  expect(item?.syncState).toBe("conflict");
});

it("does not disclose a mismatched detail identity", async () => {
  const foreign = {
    ...venue("91111111-1111-4111-8111-111111111112", "S2", "Foreign"),
    projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  };
  const repository: VenueRepositoryPort = {
    listVenues: vi.fn(),
    getVenue: vi.fn().mockResolvedValue(foreign),
    updateVenueCore: vi.fn(),
  };

  await expect(
    service(repository).detail(projectId, foreign.id, null),
  ).resolves.toBeNull();
});

import { expect, it, vi } from "vitest";
import type { CriterionDefinition } from "@domain/facts/criterion-types";
import type { LocalProjectStore } from "@application/local-data/local-project-store";
import type { CachedRecordEnvelope } from "@application/local-data/local-records";
import type {
  VenueCompatibilityInputs,
  VenueCompatibilityQueryPort,
} from "./venue-compatibility-query-port";
import { venueCachedRecord } from "./venue-local-cache";
import type {
  VenueMemberOpinionPort,
  VenueMemberPreferenceRecord,
  VenueMemberRatingRecord,
} from "./venue-member-opinion-service";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "./venue-repository-port";
import { VenueWorkspaceReadService } from "./venue-workspace-read-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const foreignProjectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userId = "71111111-1111-4111-8111-111111111111";
const deviceId = "61111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111112";

function venue(
  id: string,
  code: string,
  name: string,
  overrides: Partial<VenueCoreRecord> = {},
): VenueCoreRecord {
  return {
    id,
    projectId,
    code,
    name,
    status: "research",
    rejectionReason: null,
    websiteUrl: null,
    city: "Paris",
    revision: 1,
    ...overrides,
  };
}

function criterion(): CriterionDefinition {
  return {
    key: "external_caterer_allowed",
    valueType: "boolean",
    unit: null,
    optionsJson: null,
    priority: "blocking",
    weight: null,
    evaluationRuleJson: { type: "boolean_equals", expected: true },
    systemDefined: true,
  };
}

function compatibilityInputs(): VenueCompatibilityInputs {
  return {
    projectId,
    venueId,
    projectTargetGuestCount: 180,
    snapshots: [
      {
        definition: criterion(),
        state: "known",
        retainedValue: true,
        retainedObservationStatus: "active",
        staleAt: null,
      },
    ],
  };
}

function compatibilityPort(
  value: VenueCompatibilityInputs | null = null,
): VenueCompatibilityQueryPort {
  return {
    loadVenueCompatibilityInputs: vi.fn().mockResolvedValue(value),
  };
}

const preference: VenueMemberPreferenceRecord = {
  id: "92111111-1111-4111-8111-111111111111",
  projectId,
  userId,
  venueId,
  favorite: true,
  personalNote: null,
  revision: 1,
};

const rating: VenueMemberRatingRecord = {
  id: "93111111-1111-4111-8111-111111111111",
  projectId,
  userId,
  venueId,
  dimensionKey: "love_score",
  rating: 9,
  revision: 1,
};

function opinions(
  ownPreference: VenueMemberPreferenceRecord | null = null,
  ratings: readonly VenueMemberRatingRecord[] = [],
): VenueMemberOpinionPort {
  return {
    getOwnVenuePreference: vi.fn().mockResolvedValue(ownPreference),
    listVenueRatings: vi.fn().mockResolvedValue(ratings),
    saveVenuePreference: vi.fn(),
    saveVenueRating: vi.fn(),
  };
}

function service(
  repository: VenueRepositoryPort,
  overrides: Partial<{
    compatibility: VenueCompatibilityQueryPort;
    opinions: VenueMemberOpinionPort;
  }> = {},
): VenueWorkspaceReadService {
  return new VenueWorkspaceReadService({
    repository,
    compatibility: overrides.compatibility ?? compatibilityPort(),
    opinions: overrides.opinions ?? opinions(),
    now: () => "2026-10-01T11:00:00.000Z",
  });
}

function repositoryWith(
  records: readonly VenueCoreRecord[] = [],
): VenueRepositoryPort {
  return {
    listVenues: vi.fn().mockResolvedValue(records),
    getVenue: vi.fn().mockResolvedValue(null),
    updateVenueCore: vi.fn(),
  };
}

function localStore(
  record: CachedRecordEnvelope,
  scopeProjectId = projectId,
): LocalProjectStore {
  return {
    scope: { projectId: scopeProjectId, userId, deviceId },
    listCachedRecords: vi.fn().mockResolvedValue([record]),
  } as unknown as LocalProjectStore;
}

it("sorts by accepted natural code, then name and stable identity", async () => {
  const rows = [
    venue("91111111-1111-4111-8111-111111111119", "S10", "Dix"),
    venue("91111111-1111-4111-8111-111111111118", "S2", "Beta"),
    venue("91111111-1111-4111-8111-111111111117", "S2", "Alpha"),
    venue("91111111-1111-4111-8111-111111111116", "S2", "Alpha"),
  ];

  const result = await service(repositoryWith(rows)).list(projectId, null);
  expect(result.map((item) => item.venue.id)).toEqual([
    "91111111-1111-4111-8111-111111111116",
    "91111111-1111-4111-8111-111111111117",
    "91111111-1111-4111-8111-111111111118",
    "91111111-1111-4111-8111-111111111119",
  ]);
});

it("keeps pending local working intent above the cloud copy", async () => {
  const cloud = venue(venueId, "S2", "Cloud");
  const working = { ...cloud, name: "Working" };
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    working,
    "pending",
  );

  const [item] = await service(repositoryWith([cloud])).list(
    projectId,
    localStore(record),
  );
  expect(item?.venue.name).toBe("Working");
  expect(item?.syncState).toBe("pending");
});

it.each(["pending", "conflict"] as const)(
  "keeps a local-only %s Venue visible while cloud listing succeeds",
  async (syncMarker) => {
    const cloud = venue(
      "91111111-1111-4111-8111-111111111118",
      "S1",
      "Cloud",
    );
    const localOnly = venue(
      "91111111-1111-4111-8111-111111111119",
      "S2",
      "Unresolved local",
    );
    const record = venueCachedRecord(
      { projectId, userId, deviceId },
      localOnly,
      syncMarker,
    );

    const result = await service(repositoryWith([cloud])).list(
      projectId,
      localStore(record),
    );

    expect(result.map((item) => item.venue.id)).toEqual([
      cloud.id,
      localOnly.id,
    ]);
    expect(result[1]?.syncState).toBe(syncMarker);
  },
);

it("does not resurrect a local-only synced Venue when cloud listing succeeds", async () => {
  const cloud = venue("91111111-1111-4111-8111-111111111118", "S1", "Cloud");
  const localOnly = venue(
    "91111111-1111-4111-8111-111111111119",
    "S2",
    "Stale local",
  );
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    localOnly,
    "synced",
  );

  const result = await service(repositoryWith([cloud])).list(
    projectId,
    localStore(record),
  );

  expect(result.map((item) => item.venue.id)).toEqual([cloud.id]);
});

it("falls back to project-scoped local cache when cloud listing fails", async () => {
  const cached = venue(venueId, "S2", "Cache");
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    cached,
    "conflict",
  );
  const repository = repositoryWith();
  vi.mocked(repository.listVenues).mockRejectedValue(new Error("offline"));

  const [item] = await service(repository).list(projectId, localStore(record));
  expect(item?.venue.name).toBe("Cache");
  expect(item?.syncState).toBe("conflict");
});

it("ignores foreign local scope and foreign cloud rows", async () => {
  const cached = venue(venueId, "S2", "Foreign cache");
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    cached,
    "synced",
  );
  const local = localStore(record, foreignProjectId);
  const foreign = venue(venueId, "S2", "Foreign cloud", {
    projectId: foreignProjectId,
  });

  await expect(
    service(repositoryWith([foreign])).list(projectId, local),
  ).resolves.toEqual([]);
  expect(local.listCachedRecords).not.toHaveBeenCalled();
});

it("fails soft when the authorized local cache cannot be read", async () => {
  const local = {
    scope: { projectId, userId, deviceId },
    listCachedRecords: vi
      .fn()
      .mockRejectedValue(new Error("cache unavailable")),
  } as unknown as LocalProjectStore;

  const [item] = await service(
    repositoryWith([venue(venueId, "S2", "Cloud")]),
  ).list(projectId, local);
  expect(item?.venue.name).toBe("Cloud");
  expect(item?.syncState).toBe("unknown");
});

it("composes a valid detail with compatibility and independent opinions", async () => {
  const record = venue(venueId, "S2", "Detail");
  const repository = repositoryWith();
  vi.mocked(repository.getVenue).mockResolvedValue(record);

  const result = await service(repository, {
    compatibility: compatibilityPort(compatibilityInputs()),
    opinions: opinions(preference, [rating]),
  }).detail(projectId, venueId, null);

  expect(result).toMatchObject({
    venue: record,
    syncState: "unknown",
    compatibility: {
      blockingStatus: "PASS",
      evidenceReadiness: 1,
      unknownImportantCriteria: 0,
      conflictingCriteria: 0,
    },
    opinions: {
      ownPreference: preference,
      ratings: [rating],
    },
  });
});

it("keeps a valid local detail without consulting the cloud copy", async () => {
  const localVenue = venue(venueId, "S2", "Local detail");
  const record = venueCachedRecord(
    { projectId, userId, deviceId },
    localVenue,
    "pending",
  );
  const repository = repositoryWith();

  const result = await service(repository).detail(
    projectId,
    venueId,
    localStore(record),
  );
  expect(result?.venue.name).toBe("Local detail");
  expect(repository.getVenue).not.toHaveBeenCalled();
});

it("degrades partial provider failures without losing the Venue identity", async () => {
  const record = venue(venueId, "S2", "Partial");
  const repository = repositoryWith();
  vi.mocked(repository.getVenue).mockResolvedValue(record);
  const brokenCompatibility: VenueCompatibilityQueryPort = {
    loadVenueCompatibilityInputs: vi
      .fn()
      .mockRejectedValue(new Error("compatibility unavailable")),
  };
  const brokenOpinions: VenueMemberOpinionPort = {
    getOwnVenuePreference: vi.fn().mockRejectedValue(new Error("preference")),
    listVenueRatings: vi.fn().mockRejectedValue(new Error("ratings")),
    saveVenuePreference: vi.fn(),
    saveVenueRating: vi.fn(),
  };

  await expect(
    service(repository, {
      compatibility: brokenCompatibility,
      opinions: brokenOpinions,
    }).detail(projectId, venueId, null),
  ).resolves.toMatchObject({
    venue: record,
    compatibility: null,
    opinions: { ownPreference: null, ratings: [] },
  });
});

it("does not disclose absent, failed or mismatched detail identities", async () => {
  const repository = repositoryWith();
  vi.mocked(repository.getVenue)
    .mockRejectedValueOnce(new Error("provider unavailable"))
    .mockResolvedValueOnce(
      venue("94111111-1111-4111-8111-111111111111", "S3", "Wrong id"),
    )
    .mockResolvedValueOnce(
      venue(venueId, "S2", "Foreign", { projectId: foreignProjectId }),
    );

  await expect(
    service(repository).detail(projectId, venueId, null),
  ).resolves.toBeNull();
  await expect(
    service(repository).detail(projectId, venueId, null),
  ).resolves.toBeNull();
  await expect(
    service(repository).detail(projectId, venueId, null),
  ).resolves.toBeNull();
});

import { expect, it } from "vitest";
import type {
  VenueAccessRouteRecord,
  VenueReferenceOrigin,
} from "@domain/venues/venue-access-route";
import {
  AccessService,
  type NormalizedAppendVenueAccessRouteInput,
  type VenueAccessPort,
} from "./venue-access-service";
import {
  VenueAccessPersistenceError,
  venueAccessPersistenceErrorCode,
} from "./venue-access-persistence-error";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const routeId = "33333333-3333-4333-8333-333333333333";
const parisId = "44444444-4444-4444-8444-444444444444";
const homeId = "55555555-5555-4555-8555-555555555555";

function input(overrides: Record<string, unknown> = {}) {
  return {
    projectId,
    venueId,
    routeId,
    referenceOriginId: parisId,
    routeType: "reference_to_venue",
    originLabel: null,
    destinationLabel: "  Venue  ",
    mode: "car",
    durationMinutes: 95,
    distanceMeters: 123_000,
    transfersCount: 0,
    observedAt: "2026-09-09T12:00:00+02:00",
    sourceId: null,
    notes: "  checked  ",
    ...overrides,
  };
}

function origin(
  id = parisId,
  overrides: Partial<VenueReferenceOrigin> = {},
): VenueReferenceOrigin {
  return {
    id,
    projectId,
    label: id === parisId ? "Paris" : "Home",
    addressText: id === parisId ? "Paris address" : "Home address",
    latitude: id === parisId ? 48.8566 : 43.7,
    longitude: id === parisId ? 2.3522 : 7.25,
    isDefault: true,
    ...overrides,
  };
}

function record(
  id = routeId,
  referenceOriginId = parisId,
  overrides: Partial<VenueAccessRouteRecord> = {},
): VenueAccessRouteRecord {
  const current = origin(referenceOriginId);
  return {
    id,
    projectId,
    venueId,
    referenceOriginId,
    routeType: "reference_to_venue",
    originLabel: current.label,
    destinationLabel: "Venue",
    mode: "car",
    durationMinutes: 95,
    distanceMeters: 123_000,
    transfersCount: 0,
    observedAt: "2026-09-09T10:00:00.000Z",
    sourceId: null,
    notes: "checked",
    referenceOriginAddressSnapshot: current.addressText,
    referenceOriginLatitudeSnapshot: current.latitude,
    referenceOriginLongitudeSnapshot: current.longitude,
    createdAt: "2026-09-09T10:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-09-09T10:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
    ...overrides,
  };
}

function port(overrides: Partial<VenueAccessPort> = {}): VenueAccessPort {
  return {
    appendVenueAccessRoute: async () => record(),
    listVenueAccessRouteHistory: async () => [record()],
    getDefaultReferenceOrigin: async () => origin(),
    ...overrides,
  };
}

it("normalizes and appends through the provider-neutral access port", async () => {
  let captured: NormalizedAppendVenueAccessRouteInput | null = null;
  const service = new AccessService(
    port({
      appendVenueAccessRoute: async (value) => {
        captured = value;
        return record();
      },
    }),
  );
  await expect(service.appendVenueAccessRoute(input())).resolves.toEqual({
    ok: true,
    value: record(),
  });
  expect(captured).toEqual({
    projectId,
    venueId,
    routeId,
    referenceOriginId: parisId,
    routeType: "reference_to_venue",
    originLabel: null,
    destinationLabel: "Venue",
    mode: "car",
    durationMinutes: 95,
    distanceMeters: 123_000,
    transfersCount: 0,
    observedAt: "2026-09-09T10:00:00.000Z",
    sourceId: null,
    notes: "checked",
  });
});

it("rejects invalid identities and domain values before persistence", async () => {
  const service = new AccessService(port());
  await expect(
    service.appendVenueAccessRoute(input({ projectId: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.appendVenueAccessRoute(input({ venueId: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.appendVenueAccessRoute(input({ routeId: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.appendVenueAccessRoute(input({ mode: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_mode" });
});

it("maps replay conflicts distinctly from all other persistence failures", async () => {
  const conflict = new VenueAccessPersistenceError("conflict", "conflict");
  expect(conflict.name).toBe("VenueAccessPersistenceError");
  expect(conflict.code).toBe("conflict");
  expect(venueAccessPersistenceErrorCode(conflict)).toBe("conflict");
  expect(venueAccessPersistenceErrorCode(new Error("x"))).toBeNull();

  const conflicting = new AccessService(
    port({
      appendVenueAccessRoute: async () => {
        throw conflict;
      },
    }),
  );
  await expect(conflicting.appendVenueAccessRoute(input())).resolves.toEqual({
    ok: false,
    error: "replay_conflict",
  });

  for (const thrown of [
    new VenueAccessPersistenceError("provider_response_invalid", "bad"),
    new Error("down"),
  ]) {
    const failing = new AccessService(
      port({
        appendVenueAccessRoute: async () => {
          throw thrown;
        },
      }),
    );
    await expect(failing.appendVenueAccessRoute(input())).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  }
});

it("lists canonical provider history and fails closed", async () => {
  const service = new AccessService(port());
  await expect(
    service.listVenueAccessRouteHistory(projectId, venueId),
  ).resolves.toEqual({ ok: true, value: [record()] });
  await expect(
    service.listVenueAccessRouteHistory("bad", venueId),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.listVenueAccessRouteHistory(projectId, "bad"),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  const failing = new AccessService(
    port({
      listVenueAccessRouteHistory: async () => {
        throw new Error("down");
      },
    }),
  );
  await expect(
    failing.listVenueAccessRouteHistory(projectId, venueId),
  ).resolves.toEqual({ ok: false, error: "persistence_failed" });
});

it("validates summary identity and mode and reports provider failures", async () => {
  const service = new AccessService(port());
  await expect(
    service.currentDefaultOriginSummary("bad", venueId, "car"),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.currentDefaultOriginSummary(projectId, "bad", "car"),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.currentDefaultOriginSummary(projectId, venueId, "bad"),
  ).resolves.toEqual({ ok: false, error: "invalid_mode" });

  const originFailure = new AccessService(
    port({
      getDefaultReferenceOrigin: async () => {
        throw new Error("down");
      },
    }),
  );
  await expect(
    originFailure.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toEqual({ ok: false, error: "persistence_failed" });

  const historyFailure = new AccessService(
    port({
      listVenueAccessRouteHistory: async () => {
        throw new Error("down");
      },
    }),
  );
  await expect(
    historyFailure.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toEqual({ ok: false, error: "persistence_failed" });
});

it("returns explicit missing states instead of falling back", async () => {
  const noDefault = new AccessService(
    port({ getDefaultReferenceOrigin: async () => null }),
  );
  await expect(
    noDefault.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toEqual({
    ok: true,
    value: { status: "missing", reason: "no_default_origin" },
  });

  const stale = new AccessService(
    port({
      listVenueAccessRouteHistory: async () => [
        record(routeId, parisId, {
          referenceOriginAddressSnapshot: "Old Paris address",
        }),
      ],
    }),
  );
  await expect(
    stale.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toEqual({
    ok: true,
    value: { status: "missing", reason: "no_current_observation" },
  });
});

it("satisfies ACC-030 when the default origin changes while both histories remain", async () => {
  const parisRoute = record(
    "66666666-6666-4666-8666-666666666666",
    parisId,
  );
  const homeRoute = record(
    "77777777-7777-4777-8777-777777777777",
    homeId,
  );
  let currentOrigin = origin(parisId);
  let history: readonly VenueAccessRouteRecord[] = [parisRoute, homeRoute];
  const service = new AccessService(
    port({
      getDefaultReferenceOrigin: async () => currentOrigin,
      listVenueAccessRouteHistory: async () => history,
    }),
  );

  await expect(
    service.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toMatchObject({
    ok: true,
    value: { status: "ready", route: { id: parisRoute.id } },
  });
  currentOrigin = origin(homeId);
  await expect(
    service.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toMatchObject({
    ok: true,
    value: { status: "ready", route: { id: homeRoute.id } },
  });

  currentOrigin = origin(homeId, { addressText: "Moved home" });
  await expect(
    service.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toEqual({
    ok: true,
    value: { status: "missing", reason: "no_current_observation" },
  });

  const freshHomeRoute = record(
    "88888888-8888-4888-8888-888888888888",
    homeId,
    { referenceOriginAddressSnapshot: "Moved home" },
  );
  history = [freshHomeRoute, parisRoute, homeRoute];
  await expect(
    service.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toMatchObject({
    ok: true,
    value: { status: "ready", route: { id: freshHomeRoute.id } },
  });
});

it("preserves provider order when database microseconds collapse in TypeScript", async () => {
  const newest = record("ffffffff-ffff-4fff-8fff-ffffffffffff");
  const olderLowerUuid = record("11111111-1111-4111-8111-111111111111");
  const service = new AccessService(
    port({
      listVenueAccessRouteHistory: async () => [newest, olderLowerUuid],
    }),
  );
  await expect(
    service.currentDefaultOriginSummary(projectId, venueId, "car"),
  ).resolves.toMatchObject({
    ok: true,
    value: { status: "ready", route: { id: newest.id } },
  });
});

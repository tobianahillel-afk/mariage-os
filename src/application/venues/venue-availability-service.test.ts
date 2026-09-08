import { expect, it } from "vitest";
import type { VenueAvailabilityRecord } from "@domain/venues/venue-availability";
import {
  VenueAvailabilityService,
  type NormalizedAppendVenueAvailabilityInput,
  type VenueAvailabilityPort,
} from "./venue-availability-service";
import {
  VenueAvailabilityPersistenceError,
  venueAvailabilityPersistenceErrorCode,
} from "./venue-availability-persistence-error";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const availabilityId = "33333333-3333-4333-8333-333333333333";
const dateOptionId = "44444444-4444-4444-8444-444444444444";

function record(
  overrides: Partial<VenueAvailabilityRecord> = {},
): VenueAvailabilityRecord {
  return {
    id: availabilityId,
    projectId,
    venueId,
    dateOptionId,
    eventDate: "2027-06-12",
    status: "available",
    optionExpiresAt: null,
    observedAt: "2026-09-08T10:00:00.000Z",
    sourceId: null,
    notes: "checked",
    createdAt: "2026-09-08T10:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-09-08T10:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
    ...overrides,
  };
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    projectId,
    venueId,
    availabilityId,
    dateOptionId,
    eventDate: "2027-06-12",
    status: "available",
    optionExpiresAt: null,
    observedAt: "2026-09-08T12:00:00+02:00",
    sourceId: null,
    notes: "  checked  ",
    ...overrides,
  };
}

function port(
  overrides: Partial<VenueAvailabilityPort> = {},
): VenueAvailabilityPort {
  return {
    appendVenueAvailability: async () => record(),
    listVenueAvailabilityHistory: async () => [record()],
    ...overrides,
  };
}

it("normalizes and appends through the provider-neutral port", async () => {
  let captured: NormalizedAppendVenueAvailabilityInput | null = null;
  const service = new VenueAvailabilityService(
    port({
      appendVenueAvailability: async (value) => {
        captured = value;
        return record();
      },
    }),
  );
  await expect(service.appendVenueAvailability(input())).resolves.toEqual({
    ok: true,
    value: record(),
  });
  expect(captured).toEqual({
    projectId,
    venueId,
    availabilityId,
    dateOptionId,
    eventDate: "2027-06-12",
    status: "available",
    optionExpiresAt: null,
    observedAt: "2026-09-08T10:00:00.000Z",
    sourceId: null,
    notes: "checked",
  });
});

it("rejects invalid command identities and domain values before persistence", async () => {
  const service = new VenueAvailabilityService(port());
  await expect(
    service.appendVenueAvailability(input({ projectId: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.appendVenueAvailability(input({ venueId: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.appendVenueAvailability(input({ availabilityId: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.appendVenueAvailability(input({ dateOptionId: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.appendVenueAvailability(input({ dateOptionId: undefined })),
  ).resolves.toMatchObject({ ok: true });
  await expect(
    service.appendVenueAvailability(input({ eventDate: "bad" })),
  ).resolves.toEqual({ ok: false, error: "invalid_event_date" });
});

it("maps replay conflicts distinctly from generic persistence failure", async () => {
  const conflict = new VenueAvailabilityPersistenceError(
    "conflict",
    "conflict",
  );
  expect(conflict.name).toBe("VenueAvailabilityPersistenceError");
  expect(conflict.code).toBe("conflict");
  expect(venueAvailabilityPersistenceErrorCode(conflict)).toBe("conflict");
  expect(venueAvailabilityPersistenceErrorCode(new Error("x"))).toBeNull();

  const conflicting = new VenueAvailabilityService(
    port({
      appendVenueAvailability: async () => {
        throw conflict;
      },
    }),
  );
  await expect(conflicting.appendVenueAvailability(input())).resolves.toEqual({
    ok: false,
    error: "replay_conflict",
  });

  const unavailable = new VenueAvailabilityService(
    port({
      appendVenueAvailability: async () => {
        throw new VenueAvailabilityPersistenceError(
          "provider_response_invalid",
          "bad",
        );
      },
    }),
  );
  await expect(unavailable.appendVenueAvailability(input())).resolves.toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

it("lists history and fails closed on invalid identity or provider error", async () => {
  const service = new VenueAvailabilityService(port());
  await expect(
    service.listVenueAvailabilityHistory(projectId, venueId),
  ).resolves.toEqual({ ok: true, value: [record()] });
  await expect(
    service.listVenueAvailabilityHistory("bad", venueId),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.listVenueAvailabilityHistory(projectId, "bad"),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  const failing = new VenueAvailabilityService(
    port({
      listVenueAvailabilityHistory: async () => {
        throw new Error("down");
      },
    }),
  );
  await expect(
    failing.listVenueAvailabilityHistory(projectId, venueId),
  ).resolves.toEqual({ ok: false, error: "persistence_failed" });
});

it("returns no observation distinctly from explicit unknown and derives effective expiry", async () => {
  const empty = new VenueAvailabilityService(
    port({ listVenueAvailabilityHistory: async () => [] }),
  );
  await expect(
    empty.latestVenueAvailability(
      projectId,
      venueId,
      "2027-06-12",
      "2026-09-08T12:00:00Z",
    ),
  ).resolves.toEqual({ ok: true, value: null });

  const unknown = record({ status: "unknown" });
  const explicit = new VenueAvailabilityService(
    port({ listVenueAvailabilityHistory: async () => [unknown] }),
  );
  await expect(
    explicit.latestVenueAvailability(
      projectId,
      venueId,
      "2027-06-12",
      "2026-09-08T12:00:00Z",
    ),
  ).resolves.toEqual({
    ok: true,
    value: { record: unknown, effectiveStatus: "unknown" },
  });

  const held = record({
    id: "55555555-5555-4555-8555-555555555555",
    status: "option_held",
    optionExpiresAt: "2026-09-08T11:00:00.000Z",
    observedAt: "2026-09-08T10:30:00.000Z",
  });
  const older = record({ eventDate: "2027-06-13" });
  const expired = new VenueAvailabilityService(
    port({ listVenueAvailabilityHistory: async () => [older, held] }),
  );
  await expect(
    expired.latestVenueAvailability(
      projectId,
      venueId,
      "2027-06-12",
      "2026-09-08T12:00:00Z",
    ),
  ).resolves.toEqual({
    ok: true,
    value: { record: held, effectiveStatus: "expired" },
  });
});

it("validates latest-query date and clock and propagates history failures", async () => {
  const service = new VenueAvailabilityService(port());
  await expect(
    service.latestVenueAvailability(
      projectId,
      venueId,
      "bad",
      "2026-09-08T12:00:00Z",
    ),
  ).resolves.toEqual({ ok: false, error: "invalid_event_date" });
  await expect(
    service.latestVenueAvailability(projectId, venueId, "2027-06-12", "bad"),
  ).resolves.toEqual({ ok: false, error: "invalid_now" });
  const failing = new VenueAvailabilityService(
    port({
      listVenueAvailabilityHistory: async () => {
        throw new Error("down");
      },
    }),
  );
  await expect(
    failing.latestVenueAvailability(
      projectId,
      venueId,
      "2027-06-12",
      "2026-09-08T12:00:00Z",
    ),
  ).resolves.toEqual({ ok: false, error: "persistence_failed" });
});

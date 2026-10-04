import { describe, expect, it, vi } from "vitest";
import type { VenueOfferRecord } from "./venue-offer-service";
import type { VenueAvailabilityRecord } from "@domain/venues/venue-availability";
import type {
  VenueAccessRouteRecord,
  VenueReferenceOrigin,
} from "@domain/venues/venue-access-route";
import { VenueWorkspaceDecisionContextService } from "./venue-workspace-decision-context";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";
const secondVenueId = "92111111-1111-4211-8211-111111111111";
const eventDate = "2027-06-12";

function offer(
  status: VenueOfferRecord["status"],
  amount: number | null,
  currency = "EUR",
  targetVenueId = venueId,
): VenueOfferRecord {
  return {
    id: crypto.randomUUID(),
    projectId,
    venueId: targetVenueId,
    status,
    revision: 1,
    name: "Synthetic offer",
    validFrom: null,
    validTo: null,
    weekday: null,
    baseAmountMinor: amount,
    currency,
    taxMode: "unknown",
    taxRateBasisPoints: null,
    includedGuestCount: null,
    extraGuestAmountMinor: null,
    depositAmountMinor: null,
    depositRefundable: null,
    securityDepositMinor: null,
    securityDepositRefundable: null,
    includedStartTime: null,
    includedEndTime: null,
    includedEndDayOffset: 0,
    extraHourAmountMinor: null,
    sourceId: null,
    notes: null,
  };
}

function availability(
  targetEventDate = eventDate,
  targetVenueId = venueId,
): VenueAvailabilityRecord {
  return {
    id: crypto.randomUUID(),
    projectId,
    venueId: targetVenueId,
    dateOptionId: null,
    eventDate: targetEventDate,
    status: "option_held",
    optionExpiresAt: "2026-10-02T10:00:00.000Z",
    observedAt: "2026-10-01T10:00:00.000Z",
    sourceId: null,
    notes: null,
    createdAt: "2026-10-01T10:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-10-01T10:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
  };
}

function origin(): VenueReferenceOrigin {
  return {
    id: "b1111111-1111-4111-8111-111111111111",
    projectId,
    label: "Paris",
    addressText: "Paris",
    latitude: null,
    longitude: null,
    isDefault: true,
  };
}

function route(
  mode: VenueAccessRouteRecord["mode"],
  durationMinutes: number,
  targetVenueId = venueId,
): VenueAccessRouteRecord {
  const reference = origin();
  return {
    id: crypto.randomUUID(),
    projectId,
    venueId: targetVenueId,
    referenceOriginId: reference.id,
    routeType: "reference_to_venue",
    originLabel: null,
    destinationLabel: "Venue",
    mode,
    durationMinutes,
    distanceMeters: null,
    transfersCount: mode === "public_transport" ? 1 : null,
    observedAt: "2026-10-01T09:00:00.000Z",
    sourceId: null,
    notes: null,
    referenceOriginAddressSnapshot: reference.addressText,
    referenceOriginLatitudeSnapshot: null,
    referenceOriginLongitudeSnapshot: null,
    createdAt: "2026-10-01T09:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-10-01T09:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
  };
}

type Failure = "offers" | "dates" | "availability" | "origin" | "routes";

function service(
  options: {
    offers?: readonly VenueOfferRecord[];
    selectedDate?: string | null;
    availability?: readonly VenueAvailabilityRecord[];
    origin?: VenueReferenceOrigin | null;
    routes?: readonly VenueAccessRouteRecord[];
    fail?: Failure;
  } = {},
) {
  const result = <T>(key: Failure, value: T) =>
    options.fail === key
      ? vi.fn().mockRejectedValue(new Error(key))
      : vi.fn().mockResolvedValue(value);
  const offers = {
    listProjectOffers: result("offers", options.offers ?? []),
  };
  const dates = {
    getSelectedEventDate: result("dates", options.selectedDate ?? eventDate),
  };
  const availabilityReader = {
    listProjectAvailability: result(
      "availability",
      options.availability ?? [availability()],
    ),
  };
  const access = {
    getDefaultReferenceOrigin: result("origin", options.origin ?? origin()),
    listProjectAccessRoutes: result(
      "routes",
      options.routes ?? [route("car", 55), route("public_transport", 70)],
    ),
  };
  return {
    reader: new VenueWorkspaceDecisionContextService({
      offers,
      dates,
      availability: availabilityReader,
      access,
      now: () => "2026-10-02T12:00:00.000Z",
    }),
    calls: { offers, dates, availabilityReader, access },
  };
}

describe("VenueWorkspaceDecisionContextService", () => {
  it("composes selected-date commercial and access context", async () => {
    const fixture = service({
      offers: [offer("quoted", 1_250_000), offer("quoted", 1_500_000)],
    });
    await expect(fixture.reader.read(projectId, venueId)).resolves.toEqual({
      commercial: {
        quoteState: "quoted",
        price: {
          kind: "known",
          currency: "EUR",
          minimumAmountMinor: 1_250_000,
          maximumAmountMinor: 1_500_000,
        },
      },
      availability: {
        eventDate,
        status: "expired",
        optionExpiresAt: "2026-10-02T10:00:00.000Z",
        observedAt: "2026-10-01T10:00:00.000Z",
      },
      access: {
        car: expect.objectContaining({ durationMinutes: 55 }),
        publicTransport: expect.objectContaining({
          durationMinutes: 70,
          transfersCount: 1,
        }),
      },
    });
  });

  it("keeps quote-state and price semantics explicit", async () => {
    const mixed = await service({
      offers: [
        offer("accepted", 1_000_000, "EUR"),
        offer("accepted", 1_200_000, "USD"),
      ],
    }).reader.read(projectId, venueId);
    expect(mixed.commercial).toEqual({
      quoteState: "accepted",
      price: { kind: "mixed_currency" },
    });

    for (const [status, quoteState] of [
      ["draft", "draft"],
      ["rejected", "historical"],
    ] as const) {
      const value = await service({
        offers: [offer(status, null)],
      }).reader.read(projectId, venueId);
      expect(value.commercial).toEqual({ quoteState, price: null });
    }

    const empty = await service().reader.read(projectId, venueId);
    expect(empty.commercial).toEqual({ quoteState: "none", price: null });
  });
});

describe("VenueWorkspaceDecisionContextService failure handling", () => {
  it("fails soft by source without inventing provider truth", async () => {
    expect(
      (await service({ fail: "offers" }).reader.read(projectId, venueId))
        .commercial,
    ).toBeNull();
    expect(
      (await service({ fail: "origin" }).reader.read(projectId, venueId))
        .access,
    ).toBeNull();
    expect(
      (await service({ fail: "routes" }).reader.read(projectId, venueId))
        .access,
    ).toBeNull();
    expect(
      (await service({ fail: "availability" }).reader.read(projectId, venueId))
        .availability,
    ).toBeNull();
    expect(
      (await service({ fail: "dates" }).reader.read(projectId, venueId))
        .availability,
    ).toBeNull();
  });

  it("does not choose an arbitrary candidate date without a selection", async () => {
    const fixture = service({
      selectedDate: null,
      availability: [availability("2027-07-10"), availability(eventDate)],
    });
    expect(
      (await fixture.reader.read(projectId, venueId)).availability,
    ).toBeNull();
    expect(
      fixture.calls.availabilityReader.listProjectAvailability,
    ).not.toHaveBeenCalled();
  });

  it("defensively ignores a substituted event date", async () => {
    const value = await service({
      availability: [availability("2027-07-10")],
    }).reader.read(projectId, venueId);
    expect(value.availability).toBeNull();
  });
});

describe("VenueWorkspaceDecisionContextService batching", () => {
  it("batches project inputs once and separates Venue contexts", async () => {
    const fixture = service({
      offers: [offer("quoted", 100, "EUR", secondVenueId)],
      availability: [availability(eventDate, secondVenueId)],
      routes: [route("car", 30, secondVenueId)],
    });
    const values = await fixture.reader.readMany(projectId, [
      venueId,
      secondVenueId,
      secondVenueId,
    ]);
    expect(values.size).toBe(2);
    expect(values.get(venueId)?.commercial).toEqual({
      quoteState: "none",
      price: null,
    });
    expect(values.get(secondVenueId)?.commercial?.price).toMatchObject({
      kind: "known",
      minimumAmountMinor: 100,
    });
    expect(fixture.calls.offers.listProjectOffers).toHaveBeenCalledTimes(1);
    expect(fixture.calls.dates.getSelectedEventDate).toHaveBeenCalledTimes(1);
    expect(
      fixture.calls.availabilityReader.listProjectAvailability,
    ).toHaveBeenCalledTimes(1);
    expect(
      fixture.calls.access.getDefaultReferenceOrigin,
    ).toHaveBeenCalledTimes(1);
    expect(fixture.calls.access.listProjectAccessRoutes).toHaveBeenCalledTimes(
      1,
    );
  });

  it("avoids provider work for an empty collection", async () => {
    const fixture = service();
    await expect(fixture.reader.readMany(projectId, [])).resolves.toEqual(
      new Map(),
    );
    expect(fixture.calls.offers.listProjectOffers).not.toHaveBeenCalled();
  });

  it("represents missing route context without inventing access", async () => {
    const value = await service({ origin: null, routes: [] }).reader.read(
      projectId,
      venueId,
    );
    expect(value.access).toEqual({ car: null, publicTransport: null });
  });
});

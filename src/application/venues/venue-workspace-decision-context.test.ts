import { describe, expect, it, vi } from "vitest";
import type { VenueAccessPort } from "./venue-access-service";
import type { VenueAvailabilityPort } from "./venue-availability-service";
import type { VenueOfferPort, VenueOfferRecord } from "./venue-offer-service";
import type { VenueAvailabilityRecord } from "@domain/venues/venue-availability";
import type {
  VenueAccessRouteRecord,
  VenueReferenceOrigin,
} from "@domain/venues/venue-access-route";
import { VenueWorkspaceDecisionContextService } from "./venue-workspace-decision-context";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";

function offer(
  status: VenueOfferRecord["status"],
  amount: number | null,
  currency = "EUR",
): VenueOfferRecord {
  return {
    id: crypto.randomUUID(),
    projectId,
    venueId,
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

function availability(): VenueAvailabilityRecord {
  return {
    id: "a1111111-1111-4111-8111-111111111111",
    projectId,
    venueId,
    dateOptionId: null,
    eventDate: "2027-06-12",
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
): VenueAccessRouteRecord {
  const reference = origin();
  return {
    id: crypto.randomUUID(),
    projectId,
    venueId,
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
    referenceOriginLatitudeSnapshot: reference.latitude,
    referenceOriginLongitudeSnapshot: reference.longitude,
    createdAt: "2026-10-01T09:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-10-01T09:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
  };
}

function service(options?: {
  offers?: readonly VenueOfferRecord[];
  failOffers?: boolean;
}): VenueWorkspaceDecisionContextService {
  const offerPort = {
    listVenueOffers: options?.failOffers
      ? vi.fn().mockRejectedValue(new Error("offers"))
      : vi.fn().mockResolvedValue(options?.offers ?? []),
  } as unknown as VenueOfferPort;
  const availabilityPort = {
    listVenueAvailabilityHistory: vi.fn().mockResolvedValue([availability()]),
  } as unknown as VenueAvailabilityPort;
  const accessPort = {
    getDefaultReferenceOrigin: vi.fn().mockResolvedValue(origin()),
    listVenueAccessRouteHistory: vi
      .fn()
      .mockResolvedValue([route("car", 55), route("public_transport", 70)]),
  } as unknown as VenueAccessPort;
  return new VenueWorkspaceDecisionContextService({
    offers: offerPort,
    availability: availabilityPort,
    access: accessPort,
    now: () => "2026-10-02T12:00:00.000Z",
  });
}

describe("VenueWorkspaceDecisionContextService", () => {
  it(
    "composes typed commercial, dated availability and contextual access",
    async () => {
      const result = await service({
        offers: [offer("quoted", 1_250_000), offer("quoted", 1_500_000)],
      }).read(projectId, venueId);

      expect(result).toEqual({
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
          eventDate: "2027-06-12",
          status: "expired",
          optionExpiresAt: "2026-10-02T10:00:00.000Z",
          observedAt: "2026-10-01T10:00:00.000Z",
        },
        access: {
          car: expect.objectContaining({
            mode: "car",
            originLabel: "Paris",
            durationMinutes: 55,
          }),
          publicTransport: expect.objectContaining({
            mode: "public_transport",
            originLabel: "Paris",
            durationMinutes: 70,
            transfersCount: 1,
          }),
        },
      });
    },
  );

  it(
    "does not mix currencies or turn provider failure into a fake quote",
    async () => {
      const mixed = await service({
        offers: [
          offer("accepted", 1_000_000, "EUR"),
          offer("accepted", 1_200_000, "USD"),
        ],
      }).read(projectId, venueId);
      expect(mixed.commercial).toEqual({
        quoteState: "accepted",
        price: { kind: "mixed_currency" },
      });

      const failed = await service({ failOffers: true }).read(
        projectId,
        venueId,
      );
      expect(failed.commercial).toBeNull();
      expect(failed.availability?.eventDate).toBe("2027-06-12");
      expect(failed.access?.car?.durationMinutes).toBe(55);
    },
  );
});

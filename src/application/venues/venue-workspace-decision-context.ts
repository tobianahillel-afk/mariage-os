import type { VenueAccessPort } from "./venue-access-service";
import type { VenueAvailabilityPort } from "./venue-availability-service";
import type {
  VenueOfferPort,
  VenueOfferRecord,
} from "./venue-offer-service";
import {
  effectiveVenueAvailabilityStatus,
  latestVenueAvailability,
  type VenueAvailabilityStatus,
} from "@domain/venues/venue-availability";
import {
  selectVenueAccessRouteSummary,
  type VenueAccessMode,
  type VenueAccessRouteSummary,
} from "@domain/venues/venue-access-route";

export type VenueWorkspaceQuoteState =
  | "none"
  | "draft"
  | "quoted"
  | "accepted"
  | "historical";

export type VenueWorkspacePriceContext =
  | {
      readonly kind: "known";
      readonly currency: string;
      readonly minimumAmountMinor: number;
      readonly maximumAmountMinor: number;
    }
  | { readonly kind: "mixed_currency" }
  | null;

export interface VenueWorkspaceCommercialContext {
  readonly quoteState: VenueWorkspaceQuoteState;
  readonly price: VenueWorkspacePriceContext;
}

export interface VenueWorkspaceAvailabilityContext {
  readonly eventDate: string;
  readonly status: VenueAvailabilityStatus;
  readonly optionExpiresAt: string | null;
  readonly observedAt: string;
}

export interface VenueWorkspaceAccessContext {
  readonly mode: VenueAccessMode;
  readonly originLabel: string;
  readonly durationMinutes: number | null;
  readonly distanceMeters: number | null;
  readonly transfersCount: number | null;
  readonly observedAt: string;
}

export interface VenueWorkspaceAccessContexts {
  readonly car: VenueWorkspaceAccessContext | null;
  readonly publicTransport: VenueWorkspaceAccessContext | null;
}

export interface VenueWorkspaceDecisionContext {
  readonly commercial: VenueWorkspaceCommercialContext | null;
  readonly availability: VenueWorkspaceAvailabilityContext | null;
  readonly access: VenueWorkspaceAccessContexts | null;
}

export interface VenueWorkspaceDecisionContextReader {
  read(
    projectId: string,
    venueId: string,
  ): Promise<VenueWorkspaceDecisionContext>;
}

interface VenueWorkspaceDecisionContextDependencies {
  readonly offers: VenueOfferPort;
  readonly availability: VenueAvailabilityPort;
  readonly access: VenueAccessPort;
  readonly now: () => string;
}

function quoteState(
  offers: readonly VenueOfferRecord[],
): VenueWorkspaceQuoteState {
  if (offers.some((offer) => offer.status === "accepted")) return "accepted";
  if (offers.some((offer) => offer.status === "quoted")) return "quoted";
  if (offers.some((offer) => offer.status === "draft")) return "draft";
  return offers.length === 0 ? "none" : "historical";
}

function priceOffers(
  offers: readonly VenueOfferRecord[],
): readonly VenueOfferRecord[] {
  const accepted = offers.filter((offer) => offer.status === "accepted");
  return accepted.length > 0
    ? accepted
    : offers.filter((offer) => offer.status === "quoted");
}

function priceContext(
  offers: readonly VenueOfferRecord[],
): VenueWorkspacePriceContext {
  const candidates = priceOffers(offers).filter(
    (offer) => offer.baseAmountMinor !== null,
  );
  if (candidates.length === 0) return null;
  const currencies = new Set(candidates.map((offer) => offer.currency));
  if (currencies.size !== 1) return { kind: "mixed_currency" };
  const amounts = candidates.map((offer) => offer.baseAmountMinor as number);
  return {
    kind: "known",
    currency: candidates[0]?.currency ?? "EUR",
    minimumAmountMinor: Math.min(...amounts),
    maximumAmountMinor: Math.max(...amounts),
  };
}

function accessValue(
  summary: VenueAccessRouteSummary,
): VenueWorkspaceAccessContext | null {
  if (summary.status !== "ready") return null;
  return {
    mode: summary.route.mode,
    originLabel: summary.origin.label,
    durationMinutes: summary.route.durationMinutes,
    distanceMeters: summary.route.distanceMeters,
    transfersCount: summary.route.transfersCount,
    observedAt: summary.route.observedAt,
  };
}

export class VenueWorkspaceDecisionContextService
  implements VenueWorkspaceDecisionContextReader
{
  constructor(
    private readonly dependencies: VenueWorkspaceDecisionContextDependencies,
  ) {}

  async read(
    projectId: string,
    venueId: string,
  ): Promise<VenueWorkspaceDecisionContext> {
    const [commercial, availability, access] = await Promise.all([
      this.readCommercial(projectId, venueId),
      this.readAvailability(projectId, venueId),
      this.readAccess(projectId, venueId),
    ]);
    return { commercial, availability, access };
  }

  private async readCommercial(
    projectId: string,
    venueId: string,
  ): Promise<VenueWorkspaceCommercialContext | null> {
    try {
      const offers = await this.dependencies.offers.listVenueOffers(
        projectId,
        venueId,
      );
      return { quoteState: quoteState(offers), price: priceContext(offers) };
    } catch {
      return null;
    }
  }

  private async readAvailability(
    projectId: string,
    venueId: string,
  ): Promise<VenueWorkspaceAvailabilityContext | null> {
    try {
      const records =
        await this.dependencies.availability.listVenueAvailabilityHistory(
          projectId,
          venueId,
        );
      const latest = latestVenueAvailability(records);
      if (latest === null) return null;
      return {
        eventDate: latest.eventDate,
        status: effectiveVenueAvailabilityStatus(
          latest,
          this.dependencies.now(),
        ),
        optionExpiresAt: latest.optionExpiresAt,
        observedAt: latest.observedAt,
      };
    } catch {
      return null;
    }
  }

  private async readAccess(
    projectId: string,
    venueId: string,
  ): Promise<VenueWorkspaceAccessContexts | null> {
    try {
      const [origin, history] = await Promise.all([
        this.dependencies.access.getDefaultReferenceOrigin(projectId),
        this.dependencies.access.listVenueAccessRouteHistory(
          projectId,
          venueId,
        ),
      ]);
      return {
        car: accessValue(selectVenueAccessRouteSummary(history, origin, "car")),
        publicTransport: accessValue(
          selectVenueAccessRouteSummary(history, origin, "public_transport"),
        ),
      };
    } catch {
      return null;
    }
  }
}

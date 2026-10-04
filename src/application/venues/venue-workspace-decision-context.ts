import type { VenueOfferRecord } from "./venue-offer-service";
import {
  effectiveVenueAvailabilityStatus,
  latestVenueAvailability,
  type VenueAvailabilityRecord,
  type VenueAvailabilityStatus,
} from "@domain/venues/venue-availability";
import {
  selectVenueAccessRouteSummary,
  type VenueAccessMode,
  type VenueAccessRouteRecord,
  type VenueAccessRouteSummary,
  type VenueReferenceOrigin,
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
  readMany(
    projectId: string,
    venueIds: readonly string[],
  ): Promise<ReadonlyMap<string, VenueWorkspaceDecisionContext>>;
}

interface ProjectOfferReader {
  listProjectOffers(projectId: string): Promise<readonly VenueOfferRecord[]>;
}

interface ProjectAvailabilityReader {
  listProjectAvailability(
    projectId: string,
    eventDate: string,
  ): Promise<readonly VenueAvailabilityRecord[]>;
}

interface ProjectAccessReader {
  getDefaultReferenceOrigin(
    projectId: string,
  ): Promise<VenueReferenceOrigin | null>;
  listProjectAccessRoutes(
    projectId: string,
  ): Promise<readonly VenueAccessRouteRecord[]>;
}

interface SelectedEventDateReader {
  getSelectedEventDate(projectId: string): Promise<string | null>;
}

interface VenueWorkspaceDecisionContextDependencies {
  readonly offers: ProjectOfferReader;
  readonly availability: ProjectAvailabilityReader;
  readonly access: ProjectAccessReader;
  readonly dates: SelectedEventDateReader;
  readonly now: () => string;
}

type Loaded<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false };

interface ProjectDecisionSnapshot {
  readonly offers: Loaded<readonly VenueOfferRecord[]>;
  readonly eventDate: Loaded<string | null>;
  readonly availability: Loaded<readonly VenueAvailabilityRecord[]>;
  readonly origin: Loaded<VenueReferenceOrigin | null>;
  readonly routes: Loaded<readonly VenueAccessRouteRecord[]>;
}

async function load<T>(reader: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await reader() };
  } catch {
    return { ok: false };
  }
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

function commercialContext(
  offers: readonly VenueOfferRecord[],
): VenueWorkspaceCommercialContext {
  const candidates = priceOffers(offers).filter(
    (offer) => offer.baseAmountMinor !== null,
  );
  if (candidates.length === 0) {
    return { quoteState: quoteState(offers), price: null };
  }
  const currencies = new Set(candidates.map((offer) => offer.currency));
  if (currencies.size !== 1) {
    return { quoteState: quoteState(offers), price: { kind: "mixed_currency" } };
  }
  const amounts = candidates.map((offer) => offer.baseAmountMinor as number);
  return {
    quoteState: quoteState(offers),
    price: {
      kind: "known",
      currency: candidates[0]?.currency ?? "EUR",
      minimumAmountMinor: Math.min(...amounts),
      maximumAmountMinor: Math.max(...amounts),
    },
  };
}

function availabilityContext(
  records: readonly VenueAvailabilityRecord[],
  eventDate: string,
  now: string,
): VenueWorkspaceAvailabilityContext | null {
  const latest = latestVenueAvailability(
    records.filter((record) => record.eventDate === eventDate),
  );
  if (latest === null) return null;
  return {
    eventDate: latest.eventDate,
    status: effectiveVenueAvailabilityStatus(latest, now),
    optionExpiresAt: latest.optionExpiresAt,
    observedAt: latest.observedAt,
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

function accessContexts(
  routes: readonly VenueAccessRouteRecord[],
  origin: VenueReferenceOrigin | null,
): VenueWorkspaceAccessContexts {
  return {
    car: accessValue(selectVenueAccessRouteSummary(routes, origin, "car")),
    publicTransport: accessValue(
      selectVenueAccessRouteSummary(routes, origin, "public_transport"),
    ),
  };
}

function venueRows<T extends { readonly venueId: string }>(
  rows: readonly T[],
  venueId: string,
): readonly T[] {
  return rows.filter((row) => row.venueId === venueId);
}

function contextFor(
  snapshot: ProjectDecisionSnapshot,
  venueId: string,
  now: string,
): VenueWorkspaceDecisionContext {
  const commercial = snapshot.offers.ok
    ? commercialContext(venueRows(snapshot.offers.value, venueId))
    : null;
  const availability =
    snapshot.eventDate.ok &&
    snapshot.eventDate.value !== null &&
    snapshot.availability.ok
      ? availabilityContext(
          venueRows(snapshot.availability.value, venueId),
          snapshot.eventDate.value,
          now,
        )
      : null;
  const access =
    snapshot.origin.ok && snapshot.routes.ok
      ? accessContexts(
          venueRows(snapshot.routes.value, venueId),
          snapshot.origin.value,
        )
      : null;
  return { commercial, availability, access };
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
    return contextFor(
      await this.loadProjectSnapshot(projectId),
      venueId,
      this.dependencies.now(),
    );
  }

  async readMany(
    projectId: string,
    venueIds: readonly string[],
  ): Promise<ReadonlyMap<string, VenueWorkspaceDecisionContext>> {
    const uniqueVenueIds = [...new Set(venueIds)];
    if (uniqueVenueIds.length === 0) return new Map();
    const snapshot = await this.loadProjectSnapshot(projectId);
    const now = this.dependencies.now();
    return new Map(
      uniqueVenueIds.map((venueId) => [
        venueId,
        contextFor(snapshot, venueId, now),
      ]),
    );
  }

  private async loadProjectSnapshot(
    projectId: string,
  ): Promise<ProjectDecisionSnapshot> {
    const [offers, eventDate, origin, routes] = await Promise.all([
      load(() => this.dependencies.offers.listProjectOffers(projectId)),
      load(() => this.dependencies.dates.getSelectedEventDate(projectId)),
      load(() => this.dependencies.access.getDefaultReferenceOrigin(projectId)),
      load(() => this.dependencies.access.listProjectAccessRoutes(projectId)),
    ]);
    const availability = await this.loadAvailability(projectId, eventDate);
    return { offers, eventDate, availability, origin, routes };
  }

  private async loadAvailability(
    projectId: string,
    eventDate: Loaded<string | null>,
  ): Promise<Loaded<readonly VenueAvailabilityRecord[]>> {
    if (!eventDate.ok) return { ok: false };
    if (eventDate.value === null) return { ok: true, value: [] };
    return load(() =>
      this.dependencies.availability.listProjectAvailability(
        projectId,
        eventDate.value,
      ),
    );
  }
}

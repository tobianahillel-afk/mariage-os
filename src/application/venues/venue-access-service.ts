import {
  isVenueAccessMode,
  normalizeVenueAccessRoute,
  selectVenueAccessRouteSummary,
  type NormalizedVenueAccessRouteDraft,
  type VenueAccessRouteRecord,
  type VenueAccessRouteSummary,
  type VenueAccessRouteValidationError,
  type VenueReferenceOrigin,
} from "@domain/venues/venue-access-route";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";
import { venueAccessPersistenceErrorCode } from "./venue-access-persistence-error";

export interface AppendVenueAccessRouteInput {
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly routeId: unknown;
  readonly referenceOriginId: unknown;
  readonly routeType: unknown;
  readonly originLabel: unknown;
  readonly destinationLabel: unknown;
  readonly mode: unknown;
  readonly durationMinutes: unknown;
  readonly distanceMeters: unknown;
  readonly transfersCount: unknown;
  readonly observedAt: unknown;
  readonly sourceId: unknown;
  readonly notes: unknown;
}

export interface NormalizedAppendVenueAccessRouteInput
  extends NormalizedVenueAccessRouteDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly routeId: string;
}

export interface VenueAccessPort {
  appendVenueAccessRoute(
    input: NormalizedAppendVenueAccessRouteInput,
  ): Promise<VenueAccessRouteRecord>;
  listVenueAccessRouteHistory(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueAccessRouteRecord[]>;
  getDefaultReferenceOrigin(
    projectId: string,
  ): Promise<VenueReferenceOrigin | null>;
}

export type VenueAccessServiceError =
  | "invalid_identity"
  | VenueAccessRouteValidationError
  | "replay_conflict"
  | "persistence_failed";

export type VenueAccessResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueAccessServiceError };

function persistenceFailure(error: unknown): VenueAccessServiceError {
  return venueAccessPersistenceErrorCode(error) === "conflict"
    ? "replay_conflict"
    : "persistence_failed";
}

export class AccessService {
  constructor(private readonly port: VenueAccessPort) {}

  async appendVenueAccessRoute(
    input: AppendVenueAccessRouteInput,
  ): Promise<VenueAccessResult<VenueAccessRouteRecord>> {
    if (
      !isVenueCommercialUuid(input.projectId) ||
      !isVenueCommercialUuid(input.venueId) ||
      !isVenueCommercialUuid(input.routeId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }
    const normalized = normalizeVenueAccessRoute(input);
    if (!normalized.ok) return normalized;

    try {
      const record = await this.port.appendVenueAccessRoute({
        projectId: input.projectId,
        venueId: input.venueId,
        routeId: input.routeId,
        ...normalized.value,
      });
      return { ok: true, value: record };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  async listVenueAccessRouteHistory(
    projectId: unknown,
    venueId: unknown,
  ): Promise<VenueAccessResult<readonly VenueAccessRouteRecord[]>> {
    if (!isVenueCommercialUuid(projectId) || !isVenueCommercialUuid(venueId)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      const history = await this.port.listVenueAccessRouteHistory(
        projectId,
        venueId,
      );
      return { ok: true, value: history };
    } catch {
      return { ok: false, error: "persistence_failed" };
    }
  }

  async currentDefaultOriginSummary(
    projectId: unknown,
    venueId: unknown,
    mode: unknown,
  ): Promise<VenueAccessResult<VenueAccessRouteSummary>> {
    if (!isVenueCommercialUuid(projectId) || !isVenueCommercialUuid(venueId)) {
      return { ok: false, error: "invalid_identity" };
    }
    if (!isVenueAccessMode(mode)) {
      return { ok: false, error: "invalid_mode" };
    }

    let origin: VenueReferenceOrigin | null;
    try {
      origin = await this.port.getDefaultReferenceOrigin(projectId);
    } catch {
      return { ok: false, error: "persistence_failed" };
    }
    if (origin === null) {
      return {
        ok: true,
        value: selectVenueAccessRouteSummary([], null, mode),
      };
    }

    const history = await this.listVenueAccessRouteHistory(projectId, venueId);
    if (!history.ok) return history;
    return {
      ok: true,
      value: selectVenueAccessRouteSummary(history.value, origin, mode),
    };
  }
}

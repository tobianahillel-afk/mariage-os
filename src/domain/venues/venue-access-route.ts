import { normalizeFactInstant } from "@domain/facts/fact-observation";
import {
  isCommercialNonNegativeInt32,
  isVenueCommercialUuid,
  normalizeCommercialOptionalText,
} from "./venue-commercial-values";

const ROUTE_TYPES = [
  "reference_to_venue",
  "reference_to_tgv_station",
  "tgv_station_to_venue",
  "airport_to_venue",
  "custom",
] as const;

const ROUTE_MODES = [
  "car",
  "train",
  "public_transport",
  "taxi_vtc",
  "shuttle",
  "coach",
  "walk",
  "mixed",
  "other",
] as const;

export type VenueAccessRouteType = (typeof ROUTE_TYPES)[number];
export type VenueAccessMode = (typeof ROUTE_MODES)[number];

export interface VenueAccessRouteDraft {
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

export interface NormalizedVenueAccessRouteDraft {
  readonly referenceOriginId: string | null;
  readonly routeType: VenueAccessRouteType;
  readonly originLabel: string | null;
  readonly destinationLabel: string | null;
  readonly mode: VenueAccessMode;
  readonly durationMinutes: number | null;
  readonly distanceMeters: number | null;
  readonly transfersCount: number | null;
  readonly observedAt: string;
  readonly sourceId: string | null;
  readonly notes: string | null;
}

export interface VenueReferenceOrigin {
  readonly id: string;
  readonly projectId: string;
  readonly label: string;
  readonly addressText: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly isDefault: true;
}

export interface VenueAccessRouteRecord {
  readonly id: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly referenceOriginId: string | null;
  readonly routeType: VenueAccessRouteType;
  readonly originLabel: string | null;
  readonly destinationLabel: string | null;
  readonly mode: VenueAccessMode;
  readonly durationMinutes: number | null;
  readonly distanceMeters: number | null;
  readonly transfersCount: number | null;
  readonly observedAt: string;
  readonly sourceId: string | null;
  readonly notes: string | null;
  readonly referenceOriginAddressSnapshot: string | null;
  readonly referenceOriginLatitudeSnapshot: number | null;
  readonly referenceOriginLongitudeSnapshot: number | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly revision: 1;
}

export type VenueAccessRouteValidationError =
  | "invalid_reference_origin_id"
  | "invalid_route_type"
  | "invalid_origin_label"
  | "invalid_destination_label"
  | "invalid_mode"
  | "invalid_duration_minutes"
  | "invalid_distance_meters"
  | "invalid_transfers_count"
  | "invalid_observed_at"
  | "invalid_source_id"
  | "invalid_notes";

export type VenueAccessRouteValidationResult =
  | { readonly ok: true; readonly value: NormalizedVenueAccessRouteDraft }
  | { readonly ok: false; readonly error: VenueAccessRouteValidationError };

export type VenueAccessRouteSummary =
  | {
      readonly status: "ready";
      readonly origin: VenueReferenceOrigin;
      readonly route: VenueAccessRouteRecord;
    }
  | {
      readonly status: "missing";
      readonly reason: "no_default_origin" | "no_current_observation";
    };

export interface VenueAccessRouteCallerPayload extends NormalizedVenueAccessRouteDraft {
  readonly projectId: string;
  readonly venueId: string;
}

export function isVenueAccessRouteType(
  value: unknown,
): value is VenueAccessRouteType {
  return (
    typeof value === "string" &&
    (ROUTE_TYPES as readonly string[]).includes(value)
  );
}

export function isVenueAccessMode(value: unknown): value is VenueAccessMode {
  return (
    typeof value === "string" &&
    (ROUTE_MODES as readonly string[]).includes(value)
  );
}

function optionalUuid(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return isVenueCommercialUuid(value) ? value : undefined;
}

function optionalText(
  value: unknown,
  maximum: number,
): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  return normalizeCommercialOptionalText(value, maximum);
}

function optionalMetric(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;
  return isCommercialNonNegativeInt32(value) ? value : undefined;
}

export function normalizeVenueAccessRoute(
  draft: VenueAccessRouteDraft,
): VenueAccessRouteValidationResult {
  const referenceOriginId = optionalUuid(draft.referenceOriginId);
  if (referenceOriginId === undefined)
    return { ok: false, error: "invalid_reference_origin_id" };
  if (!isVenueAccessRouteType(draft.routeType))
    return { ok: false, error: "invalid_route_type" };
  if (!isVenueAccessMode(draft.mode))
    return { ok: false, error: "invalid_mode" };

  const originLabel = optionalText(draft.originLabel, 160);
  if (
    originLabel === undefined ||
    (referenceOriginId !== null && originLabel !== null)
  )
    return { ok: false, error: "invalid_origin_label" };
  const destinationLabel = optionalText(draft.destinationLabel, 160);
  if (destinationLabel === undefined)
    return { ok: false, error: "invalid_destination_label" };

  const durationMinutes = optionalMetric(draft.durationMinutes);
  if (durationMinutes === undefined)
    return { ok: false, error: "invalid_duration_minutes" };
  const distanceMeters = optionalMetric(draft.distanceMeters);
  if (distanceMeters === undefined)
    return { ok: false, error: "invalid_distance_meters" };
  const transfersCount = optionalMetric(draft.transfersCount);
  if (transfersCount === undefined)
    return { ok: false, error: "invalid_transfers_count" };

  const observedAt = normalizeFactInstant(draft.observedAt);
  if (observedAt === null) return { ok: false, error: "invalid_observed_at" };
  const sourceId = optionalUuid(draft.sourceId);
  if (sourceId === undefined) return { ok: false, error: "invalid_source_id" };
  const notes = optionalText(draft.notes, 5_000);
  if (notes === undefined) return { ok: false, error: "invalid_notes" };

  return {
    ok: true,
    value: {
      referenceOriginId,
      routeType: draft.routeType,
      originLabel,
      destinationLabel,
      mode: draft.mode,
      durationMinutes,
      distanceMeters,
      transfersCount,
      observedAt,
      sourceId,
      notes,
    },
  };
}

export function venueAccessRouteCallerPayloadEquals(
  record: VenueAccessRouteRecord,
  payload: VenueAccessRouteCallerPayload,
): boolean {
  return (
    record.projectId === payload.projectId &&
    record.venueId === payload.venueId &&
    record.referenceOriginId === payload.referenceOriginId &&
    record.routeType === payload.routeType &&
    (record.referenceOriginId !== null ||
      record.originLabel === payload.originLabel) &&
    record.destinationLabel === payload.destinationLabel &&
    record.mode === payload.mode &&
    record.durationMinutes === payload.durationMinutes &&
    record.distanceMeters === payload.distanceMeters &&
    record.transfersCount === payload.transfersCount &&
    record.observedAt === payload.observedAt &&
    record.sourceId === payload.sourceId &&
    record.notes === payload.notes
  );
}

export function venueAccessRouteMatchesCurrentOrigin(
  route: VenueAccessRouteRecord,
  origin: VenueReferenceOrigin,
  mode: VenueAccessMode,
): boolean {
  return (
    route.referenceOriginId === origin.id &&
    route.routeType === "reference_to_venue" &&
    route.mode === mode &&
    route.referenceOriginAddressSnapshot === origin.addressText &&
    route.referenceOriginLatitudeSnapshot === origin.latitude &&
    route.referenceOriginLongitudeSnapshot === origin.longitude
  );
}

export function selectVenueAccessRouteSummary(
  history: readonly VenueAccessRouteRecord[],
  origin: VenueReferenceOrigin | null,
  mode: VenueAccessMode,
): VenueAccessRouteSummary {
  if (origin === null)
    return { status: "missing", reason: "no_default_origin" };
  const route = history.find((item) =>
    venueAccessRouteMatchesCurrentOrigin(item, origin, mode),
  );
  return route === undefined
    ? { status: "missing", reason: "no_current_observation" }
    : { status: "ready", origin, route };
}

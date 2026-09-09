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

type Validation<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueAccessRouteValidationError };

interface RouteContext {
  readonly referenceOriginId: string | null;
  readonly routeType: VenueAccessRouteType;
  readonly originLabel: string | null;
  readonly destinationLabel: string | null;
  readonly mode: VenueAccessMode;
}

interface RouteMetrics {
  readonly durationMinutes: number | null;
  readonly distanceMeters: number | null;
  readonly transfersCount: number | null;
}

interface RouteEvidence {
  readonly observedAt: string;
  readonly sourceId: string | null;
  readonly notes: string | null;
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

function invalid<T>(error: VenueAccessRouteValidationError): Validation<T> {
  return { ok: false, error };
}

function valid<T>(value: T): Validation<T> {
  return { ok: true, value };
}

function originLabelAllowed(
  referenceOriginId: string | null,
  originLabel: string | null,
): boolean {
  if (referenceOriginId === null) return true;
  return originLabel === null;
}

function normalizeRouteContext(
  draft: VenueAccessRouteDraft,
): Validation<RouteContext> {
  const referenceOriginId = optionalUuid(draft.referenceOriginId);
  if (referenceOriginId === undefined)
    return invalid("invalid_reference_origin_id");
  if (!isVenueAccessRouteType(draft.routeType))
    return invalid("invalid_route_type");
  if (!isVenueAccessMode(draft.mode)) return invalid("invalid_mode");

  const originLabel = optionalText(draft.originLabel, 160);
  if (originLabel === undefined) return invalid("invalid_origin_label");
  if (!originLabelAllowed(referenceOriginId, originLabel))
    return invalid("invalid_origin_label");
  const destinationLabel = optionalText(draft.destinationLabel, 160);
  if (destinationLabel === undefined)
    return invalid("invalid_destination_label");

  return valid({
    referenceOriginId,
    routeType: draft.routeType,
    originLabel,
    destinationLabel,
    mode: draft.mode,
  });
}

function normalizeRouteMetrics(
  draft: VenueAccessRouteDraft,
): Validation<RouteMetrics> {
  const durationMinutes = optionalMetric(draft.durationMinutes);
  if (durationMinutes === undefined)
    return invalid("invalid_duration_minutes");
  const distanceMeters = optionalMetric(draft.distanceMeters);
  if (distanceMeters === undefined) return invalid("invalid_distance_meters");
  const transfersCount = optionalMetric(draft.transfersCount);
  if (transfersCount === undefined) return invalid("invalid_transfers_count");
  return valid({ durationMinutes, distanceMeters, transfersCount });
}

function normalizeRouteEvidence(
  draft: VenueAccessRouteDraft,
): Validation<RouteEvidence> {
  const observedAt = normalizeFactInstant(draft.observedAt);
  if (observedAt === null) return invalid("invalid_observed_at");
  const sourceId = optionalUuid(draft.sourceId);
  if (sourceId === undefined) return invalid("invalid_source_id");
  const notes = optionalText(draft.notes, 5_000);
  if (notes === undefined) return invalid("invalid_notes");
  return valid({ observedAt, sourceId, notes });
}

export function normalizeVenueAccessRoute(
  draft: VenueAccessRouteDraft,
): VenueAccessRouteValidationResult {
  const context = normalizeRouteContext(draft);
  if (!context.ok) return context;
  const metrics = normalizeRouteMetrics(draft);
  if (!metrics.ok) return metrics;
  const evidence = normalizeRouteEvidence(draft);
  if (!evidence.ok) return evidence;

  return {
    ok: true,
    value: {
      ...context.value,
      ...metrics.value,
      ...evidence.value,
    },
  };
}

function callerOriginLabelMatches(
  record: VenueAccessRouteRecord,
  payload: VenueAccessRouteCallerPayload,
): boolean {
  if (record.referenceOriginId !== null) return true;
  return record.originLabel === payload.originLabel;
}

export function venueAccessRouteCallerPayloadEquals(
  record: VenueAccessRouteRecord,
  payload: VenueAccessRouteCallerPayload,
): boolean {
  if (!callerOriginLabelMatches(record, payload)) return false;
  const pairs: readonly (readonly [unknown, unknown])[] = [
    [record.projectId, payload.projectId],
    [record.venueId, payload.venueId],
    [record.referenceOriginId, payload.referenceOriginId],
    [record.routeType, payload.routeType],
    [record.destinationLabel, payload.destinationLabel],
    [record.mode, payload.mode],
    [record.durationMinutes, payload.durationMinutes],
    [record.distanceMeters, payload.distanceMeters],
    [record.transfersCount, payload.transfersCount],
    [record.observedAt, payload.observedAt],
    [record.sourceId, payload.sourceId],
    [record.notes, payload.notes],
  ];
  return pairs.every(([left, right]) => left === right);
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

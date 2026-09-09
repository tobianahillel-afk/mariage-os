import { normalizeFactInstant } from "@domain/facts/fact-observation";
import {
  normalizeVenueAccessRoute,
  type VenueAccessRouteRecord,
} from "@domain/venues/venue-access-route";
import {
  isVenueCommercialUuid,
  normalizeCommercialOptionalText,
  normalizeCommercialRequiredText,
} from "@domain/venues/venue-commercial-values";

const INVALID_RESPONSE = "Invalid venue access route response.";

function fail(): never {
  throw new Error(INVALID_RESPONSE);
}

function objectRow(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail();
  return value as Record<string, unknown>;
}

function requiredUuid(value: unknown): string {
  return isVenueCommercialUuid(value) ? value : fail();
}

function optionalUuid(value: unknown): string | null {
  return value === null ? null : requiredUuid(value);
}

function canonicalInstant(value: unknown): string {
  const normalized = normalizeFactInstant(value);
  return normalized === null ? fail() : normalized;
}

function canonicalOptionalText(value: unknown, maximum: number): string | null {
  if (value === null) return null;
  if (typeof value !== "string") fail();
  const normalized = normalizeCommercialOptionalText(value, maximum);
  return normalized !== undefined && normalized === value ? normalized : fail();
}

function canonicalRequiredText(value: unknown, maximum: number): string {
  if (typeof value !== "string") fail();
  const normalized = normalizeCommercialRequiredText(value, maximum);
  return normalized !== null && normalized === value ? normalized : fail();
}

function optionalCoordinate(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) fail();
  return value >= minimum && value <= maximum ? value : fail();
}

function assertExpectedIdentity(
  actual: string,
  expected: string | undefined,
): void {
  if (expected !== undefined && actual !== expected) fail();
}

function canonicalCallerFields(
  row: Record<string, unknown>,
  referenceOriginId: string | null,
  sourceId: string | null,
) {
  const normalized = normalizeVenueAccessRoute({
    referenceOriginId,
    routeType: row.route_type,
    originLabel: referenceOriginId === null ? row.origin_label : null,
    destinationLabel: row.destination_label,
    mode: row.mode,
    durationMinutes: row.duration_minutes,
    distanceMeters: row.distance_meters,
    transfersCount: row.transfers_count,
    observedAt: row.observed_at,
    sourceId,
    notes: row.notes,
  });
  if (!normalized.ok) fail();

  const value = normalized.value;
  const canonicalPairs: readonly (readonly [unknown, unknown])[] = [
    [value.routeType, row.route_type],
    [value.destinationLabel, row.destination_label],
    [value.mode, row.mode],
    [value.durationMinutes, row.duration_minutes],
    [value.distanceMeters, row.distance_meters],
    [value.transfersCount, row.transfers_count],
    [value.sourceId, sourceId],
    [value.notes, row.notes],
  ];
  if (!canonicalPairs.every(([canonical, raw]) => canonical === raw)) fail();
  if (referenceOriginId === null && value.originLabel !== row.origin_label) fail();
  return value;
}

export function parseVenueAccessRouteRow(
  value: unknown,
  expectedProjectId?: string,
  expectedVenueId?: string,
  expectedId?: string,
): VenueAccessRouteRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  const venueId = requiredUuid(row.venue_id);
  const referenceOriginId = optionalUuid(row.reference_origin_id);
  const sourceId = optionalUuid(row.source_id);

  assertExpectedIdentity(projectId, expectedProjectId);
  assertExpectedIdentity(venueId, expectedVenueId);
  assertExpectedIdentity(id, expectedId);

  const normalized = canonicalCallerFields(row, referenceOriginId, sourceId);
  const originLabel =
    referenceOriginId === null
      ? normalized.originLabel
      : canonicalRequiredText(row.origin_label, 160);
  const addressSnapshot = canonicalOptionalText(
    row.reference_origin_address_snapshot,
    500,
  );
  const latitudeSnapshot = optionalCoordinate(
    row.reference_origin_latitude_snapshot,
    -90,
    90,
  );
  const longitudeSnapshot = optionalCoordinate(
    row.reference_origin_longitude_snapshot,
    -180,
    180,
  );
  if ((latitudeSnapshot === null) !== (longitudeSnapshot === null)) fail();
  if (
    referenceOriginId === null &&
    (addressSnapshot !== null || latitudeSnapshot !== null)
  )
    fail();
  if (row.revision !== 1) fail();

  return {
    id,
    projectId,
    venueId,
    ...normalized,
    originLabel,
    referenceOriginAddressSnapshot: addressSnapshot,
    referenceOriginLatitudeSnapshot: latitudeSnapshot,
    referenceOriginLongitudeSnapshot: longitudeSnapshot,
    createdAt: canonicalInstant(row.created_at),
    createdBy: requiredUuid(row.created_by),
    updatedAt: canonicalInstant(row.updated_at),
    updatedBy: requiredUuid(row.updated_by),
    revision: 1,
  };
}

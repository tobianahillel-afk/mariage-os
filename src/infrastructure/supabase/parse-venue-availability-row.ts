import { normalizeFactInstant } from "@domain/facts/fact-observation";
import {
  normalizeVenueAvailability,
  type VenueAvailabilityRecord,
} from "@domain/venues/venue-availability";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";

const INVALID_RESPONSE = "Invalid venue availability response.";

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
  if (value === null) return null;
  return requiredUuid(value);
}

function canonicalInstant(value: unknown): string {
  const normalized = normalizeFactInstant(value);
  if (normalized === null || normalized !== value) fail();
  return normalized;
}

function positiveRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) fail();
  return value as number;
}

function assertExpectedIdentity(
  actual: string,
  expected: string | undefined,
): void {
  if (expected !== undefined && actual !== expected) fail();
}

function canonicalAvailability(
  row: Record<string, unknown>,
  sourceId: string | null,
) {
  const normalized = normalizeVenueAvailability({
    eventDate: row.event_date,
    status: row.status,
    optionExpiresAt: row.option_expires_at,
    observedAt: row.observed_at,
    sourceId,
    notes: row.notes,
  });
  if (!normalized.ok) fail();

  const value = normalized.value;
  const canonicalPairs: readonly (readonly [unknown, unknown])[] = [
    [value.eventDate, row.event_date],
    [value.status, row.status],
    [value.optionExpiresAt, row.option_expires_at],
    [value.observedAt, row.observed_at],
    [value.sourceId, sourceId],
    [value.notes, row.notes],
  ];
  if (!canonicalPairs.every(([canonical, raw]) => canonical === raw)) fail();
  return value;
}

export function parseVenueAvailabilityRow(
  value: unknown,
  expectedProjectId?: string,
  expectedVenueId?: string,
  expectedId?: string,
): VenueAvailabilityRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  const venueId = requiredUuid(row.venue_id);
  const dateOptionId = optionalUuid(row.date_option_id);
  const sourceId = optionalUuid(row.source_id);

  assertExpectedIdentity(projectId, expectedProjectId);
  assertExpectedIdentity(venueId, expectedVenueId);
  assertExpectedIdentity(id, expectedId);

  const normalized = canonicalAvailability(row, sourceId);

  return {
    id,
    projectId,
    venueId,
    dateOptionId,
    ...normalized,
    createdAt: canonicalInstant(row.created_at),
    createdBy: requiredUuid(row.created_by),
    updatedAt: canonicalInstant(row.updated_at),
    updatedBy: requiredUuid(row.updated_by),
    revision: positiveRevision(row.revision),
  };
}

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

function optionalUuid(value: unknown): string | null {
  if (value === null) return null;
  return isVenueCommercialUuid(value) ? value : fail();
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

export function parseVenueAvailabilityRow(
  value: unknown,
  expectedProjectId?: string,
  expectedVenueId?: string,
  expectedId?: string,
): VenueAvailabilityRecord {
  const row = objectRow(value);
  const id = isVenueCommercialUuid(row.id) ? row.id : fail();
  const projectId = isVenueCommercialUuid(row.project_id)
    ? row.project_id
    : fail();
  const venueId = isVenueCommercialUuid(row.venue_id)
    ? row.venue_id
    : fail();
  const dateOptionId = optionalUuid(row.date_option_id);
  const sourceId = optionalUuid(row.source_id);
  if (
    (expectedProjectId !== undefined && projectId !== expectedProjectId) ||
    (expectedVenueId !== undefined && venueId !== expectedVenueId) ||
    (expectedId !== undefined && id !== expectedId)
  ) {
    fail();
  }

  const normalized = normalizeVenueAvailability({
    eventDate: row.event_date,
    status: row.status,
    optionExpiresAt: row.option_expires_at,
    observedAt: row.observed_at,
    sourceId,
    notes: row.notes,
  });
  if (!normalized.ok) fail();
  if (
    normalized.value.eventDate !== row.event_date ||
    normalized.value.status !== row.status ||
    normalized.value.optionExpiresAt !== row.option_expires_at ||
    normalized.value.observedAt !== row.observed_at ||
    normalized.value.sourceId !== sourceId ||
    normalized.value.notes !== row.notes
  ) {
    fail();
  }

  const createdBy = isVenueCommercialUuid(row.created_by)
    ? row.created_by
    : fail();
  const updatedBy = isVenueCommercialUuid(row.updated_by)
    ? row.updated_by
    : fail();

  return {
    id,
    projectId,
    venueId,
    dateOptionId,
    ...normalized.value,
    createdAt: canonicalInstant(row.created_at),
    createdBy,
    updatedAt: canonicalInstant(row.updated_at),
    updatedBy,
    revision: positiveRevision(row.revision),
  };
}

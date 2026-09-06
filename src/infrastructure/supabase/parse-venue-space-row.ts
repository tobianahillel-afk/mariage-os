import type { VenueSpaceRecord } from "@application/venues/venue-space-service";
import {
  isVenueSpaceCapacity,
  isVenueSpaceMeasurement,
  isVenueSpaceSortOrder,
} from "@domain/venues/venue-space";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UnknownRecord = Record<string, unknown>;

function invalidSpaceResponse(): never {
  throw new Error("Invalid venue space response.");
}

function recordValue(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidSpaceResponse();
  }
  return value as UnknownRecord;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") invalidSpaceResponse();
  return value;
}

function boundedText(value: unknown, maximum: number): string {
  const parsed = stringValue(value);
  if (parsed.trim().length === 0 || parsed.length > maximum) {
    invalidSpaceResponse();
  }
  return parsed;
}

function uuidValue(value: unknown): string {
  const parsed = stringValue(value);
  if (!UUID_PATTERN.test(parsed)) invalidSpaceResponse();
  return parsed;
}

function nullableNote(value: unknown): string | null {
  if (value === null) return null;
  const parsed = stringValue(value);
  if (parsed.length > 5_000) invalidSpaceResponse();
  return parsed;
}

function nullableBooleanValue(value: unknown): boolean | null {
  if (value === null) return null;
  if (typeof value !== "boolean") invalidSpaceResponse();
  return value;
}

function nullableMeasurement(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !isVenueSpaceMeasurement(value)) {
    invalidSpaceResponse();
  }
  return value;
}

function nullableCapacity(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !isVenueSpaceCapacity(value)) {
    invalidSpaceResponse();
  }
  return value;
}

function sortOrderValue(value: unknown): number {
  if (typeof value !== "number" || !isVenueSpaceSortOrder(value)) {
    invalidSpaceResponse();
  }
  return value;
}

function integerValue(value: unknown): number {
  if (!Number.isSafeInteger(value)) invalidSpaceResponse();
  return value as number;
}

function revisionValue(value: unknown): number {
  const parsed = integerValue(value);
  if (parsed < 1) invalidSpaceResponse();
  return parsed;
}

export function parseVenueSpaceRow(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
): VenueSpaceRecord {
  const row = recordValue(value);
  const projectId = uuidValue(row.project_id);
  const venueId = uuidValue(row.venue_id);
  if (projectId !== expectedProjectId || venueId !== expectedVenueId) {
    invalidSpaceResponse();
  }

  return {
    id: uuidValue(row.id),
    projectId,
    venueId,
    name: boundedText(row.name, 160),
    spaceType: boundedText(row.space_type, 80),
    indoor: nullableBooleanValue(row.indoor),
    areaM2: nullableMeasurement(row.area_m2),
    lengthM: nullableMeasurement(row.length_m),
    widthM: nullableMeasurement(row.width_m),
    heightM: nullableMeasurement(row.height_m),
    capacitySeated: nullableCapacity(row.capacity_seated),
    capacityCocktail: nullableCapacity(row.capacity_cocktail),
    sortOrder: sortOrderValue(row.sort_order),
    notes: nullableNote(row.notes),
    revision: revisionValue(row.revision),
  };
}

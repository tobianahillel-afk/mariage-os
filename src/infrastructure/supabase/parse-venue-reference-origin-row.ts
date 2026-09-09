import type { VenueReferenceOrigin } from "@domain/venues/venue-access-route";
import {
  isVenueCommercialUuid,
  normalizeCommercialOptionalText,
  normalizeCommercialRequiredText,
} from "@domain/venues/venue-commercial-values";

const INVALID_RESPONSE = "Invalid venue reference origin response.";

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

function canonicalRequiredText(value: unknown, maximum: number): string {
  if (typeof value !== "string") fail();
  const normalized = normalizeCommercialRequiredText(value, maximum);
  return normalized !== null && normalized === value ? normalized : fail();
}

function canonicalOptionalText(value: unknown, maximum: number): string | null {
  if (value === null) return null;
  if (typeof value !== "string") fail();
  const normalized = normalizeCommercialOptionalText(value, maximum);
  return normalized !== undefined && normalized === value ? normalized : fail();
}

function coordinate(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) fail();
  return value >= minimum && value <= maximum ? value : fail();
}

export function parseVenueReferenceOriginRow(
  value: unknown,
  expectedProjectId?: string,
): VenueReferenceOrigin {
  const row = objectRow(value);
  const projectId = requiredUuid(row.project_id);
  if (expectedProjectId !== undefined && projectId !== expectedProjectId) fail();
  if (row.is_default !== true) fail();

  const latitude = coordinate(row.latitude, -90, 90);
  const longitude = coordinate(row.longitude, -180, 180);
  if ((latitude === null) !== (longitude === null)) fail();

  return {
    id: requiredUuid(row.id),
    projectId,
    label: canonicalRequiredText(row.label, 160),
    addressText: canonicalOptionalText(row.address_text, 500),
    latitude,
    longitude,
    isDefault: true,
  };
}

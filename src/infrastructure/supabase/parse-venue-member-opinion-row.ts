import type {
  VenueMemberPreferenceRecord,
  VenueMemberRatingRecord,
} from "@application/venues/venue-member-opinion-service";
import { isVenueRatingDimension } from "@domain/venues/venue-member-opinion";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UnknownRecord = Record<string, unknown>;

function invalidOpinionResponse(): never {
  throw new Error("Invalid venue member opinion response.");
}

function recordValue(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidOpinionResponse();
  }
  return value as UnknownRecord;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") invalidOpinionResponse();
  return value;
}

function uuidValue(value: unknown): string {
  const parsed = stringValue(value);
  if (!UUID_PATTERN.test(parsed)) invalidOpinionResponse();
  return parsed;
}

function revisionValue(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    invalidOpinionResponse();
  }
  return value as number;
}

function targetIds(
  row: UnknownRecord,
  expectedProjectId: string,
  expectedVenueId: string,
): { readonly projectId: string; readonly venueId: string } {
  const projectId = uuidValue(row.project_id);
  const venueId = uuidValue(row.target_id);
  if (
    projectId !== expectedProjectId ||
    venueId !== expectedVenueId ||
    row.target_type !== "venue"
  ) {
    invalidOpinionResponse();
  }
  return { projectId, venueId };
}

function nullableNote(value: unknown): string | null {
  if (value === null) return null;
  const parsed = stringValue(value);
  if (parsed.length > 5_000) invalidOpinionResponse();
  return parsed;
}

function ratingValue(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 10 ||
    Math.abs(value * 100 - Math.round(value * 100)) >= 1e-8
  ) {
    invalidOpinionResponse();
  }
  return value;
}

export function parseVenueMemberPreferenceRow(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
): VenueMemberPreferenceRecord {
  const row = recordValue(value);
  const { projectId, venueId } = targetIds(row, expectedProjectId, expectedVenueId);
  if (typeof row.favorite !== "boolean") invalidOpinionResponse();

  return {
    id: uuidValue(row.id),
    projectId,
    userId: uuidValue(row.user_id),
    venueId,
    favorite: row.favorite,
    personalNote: nullableNote(row.personal_note),
    revision: revisionValue(row.revision),
  };
}

export function parseVenueMemberRatingRow(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
): VenueMemberRatingRecord {
  const row = recordValue(value);
  const { projectId, venueId } = targetIds(row, expectedProjectId, expectedVenueId);
  const dimensionKey = stringValue(row.dimension_key);
  if (!isVenueRatingDimension(dimensionKey)) invalidOpinionResponse();

  return {
    id: uuidValue(row.id),
    projectId,
    userId: uuidValue(row.user_id),
    venueId,
    dimensionKey,
    rating: ratingValue(row.rating),
    revision: revisionValue(row.revision),
  };
}

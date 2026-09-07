import type { VenueFactFreshnessRecord } from "@application/facts/venue-fact-freshness-service";
import { normalizeFactFreshness } from "@domain/facts/fact-freshness";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type UnknownRecord = Record<string, unknown>;

function invalidResponse(): never {
  throw new Error("Invalid venue fact freshness response.");
}

function recordValue(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidResponse();
  }
  return value as UnknownRecord;
}

function uuidValue(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) invalidResponse();
  return value;
}

function revisionValue(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) invalidResponse();
  return value as number;
}

export function parseVenueFactFreshnessRow(
  value: unknown,
  expectedProjectId: string,
  expectedFactId: string,
): VenueFactFreshnessRecord {
  const row = recordValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  if (
    id !== expectedFactId ||
    projectId !== expectedProjectId ||
    row.target_type !== "venue"
  ) {
    invalidResponse();
  }
  const normalized = normalizeFactFreshness({
    lastVerifiedAt: row.last_verified_at,
    staleAt: row.stale_at,
  });
  if (!normalized.ok) invalidResponse();
  return {
    id,
    projectId,
    venueId: uuidValue(row.target_id),
    definitionId: uuidValue(row.definition_id),
    revision: revisionValue(row.revision),
    ...normalized.value,
  };
}

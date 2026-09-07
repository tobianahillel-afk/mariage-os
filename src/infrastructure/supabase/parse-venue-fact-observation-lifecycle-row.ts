import type { WithdrawnVenueFactObservationRecord } from "@application/facts/venue-fact-observation-lifecycle-service";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type UnknownRecord = Record<string, unknown>;

function invalidResponse(): never {
  throw new Error("Invalid venue fact observation lifecycle response.");
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

export function parseWithdrawnVenueFactObservationRow(
  value: unknown,
  expectedProjectId: string,
  expectedFactId: string,
  expectedObservationId: string,
): WithdrawnVenueFactObservationRecord {
  const row = recordValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  const factId = uuidValue(row.fact_id);
  if (
    id !== expectedObservationId ||
    projectId !== expectedProjectId ||
    factId !== expectedFactId ||
    row.observation_status !== "withdrawn" ||
    row.superseded_by_observation_id !== null
  ) {
    invalidResponse();
  }
  return {
    id,
    projectId,
    factId,
    status: "withdrawn",
    supersededByObservationId: null,
  };
}

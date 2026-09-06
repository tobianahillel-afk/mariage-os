import type {
  RetainedVenueFactRecord,
  VenueFactDefinitionRecord,
} from "@application/facts/venue-fact-service";
import { normalizeFactDefinition } from "@domain/facts/fact-definition";
import { normalizeRetainedFact } from "@domain/facts/retained-fact";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type UnknownRecord = Record<string, unknown>;

function invalidResponse(): never {
  throw new Error("Invalid venue fact response.");
}

function recordValue(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidResponse();
  }
  return value as UnknownRecord;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") invalidResponse();
  return value;
}

function uuidValue(value: unknown): string {
  const parsed = stringValue(value);
  if (!UUID_PATTERN.test(parsed)) invalidResponse();
  return parsed;
}

function revisionValue(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) invalidResponse();
  return value as number;
}

export function parseVenueFactDefinitionRow(
  value: unknown,
  expectedProjectId: string,
): VenueFactDefinitionRecord {
  const row = recordValue(value);
  const projectId = uuidValue(row.project_id);
  if (
    projectId !== expectedProjectId ||
    row.entity_type !== "venue" ||
    typeof row.system_defined !== "boolean"
  ) {
    invalidResponse();
  }
  const normalized = normalizeFactDefinition({
    key: row.key,
    label: row.label,
    valueType: row.value_type,
    unit: row.unit,
    priority: row.priority,
    weight: row.weight,
    freshnessPolicy: row.freshness_policy,
    optionsJson: row.options_json,
    evaluationRuleJson: row.evaluation_rule_json,
  });
  if (!normalized.ok) invalidResponse();
  return {
    id: uuidValue(row.id),
    projectId,
    entityType: "venue",
    systemDefined: row.system_defined,
    revision: revisionValue(row.revision),
    ...normalized.value,
  };
}

export function parseRetainedVenueFactRow(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
  definition: VenueFactDefinitionRecord,
): RetainedVenueFactRecord {
  const row = recordValue(value);
  const projectId = uuidValue(row.project_id);
  const venueId = uuidValue(row.target_id);
  const definitionId = uuidValue(row.definition_id);
  if (
    projectId !== expectedProjectId ||
    venueId !== expectedVenueId ||
    row.target_type !== "venue" ||
    definitionId !== definition.id
  ) {
    invalidResponse();
  }
  const normalized = normalizeRetainedFact(definition, {
    state: row.state,
    retainedValue: row.retained_value,
  });
  if (!normalized.ok) invalidResponse();
  return {
    id: uuidValue(row.id),
    projectId,
    venueId,
    definitionId,
    revision: revisionValue(row.revision),
    ...normalized.value,
  };
}

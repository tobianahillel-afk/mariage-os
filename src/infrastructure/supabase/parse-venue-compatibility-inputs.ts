import type { VenueCompatibilityInputs } from "@application/venues/venue-compatibility-query-port";
import { isFactObservationStatus } from "@domain/facts/fact-evidence-types";
import { normalizeFactInstant } from "@domain/facts/fact-observation";
import type {
  CriterionDefinition,
  CriterionFactSnapshot,
} from "@domain/facts/criterion-types";
import type {
  RetainedVenueFactRecord,
  VenueFactDefinitionRecord,
} from "@application/facts/venue-fact-service";
import {
  parseRetainedVenueFactRow,
  parseVenueFactDefinitionRow,
} from "./parse-venue-fact-row";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type UnknownRecord = Record<string, unknown>;

interface CompatibilityRows {
  readonly project: unknown;
  readonly venue: unknown;
  readonly definitions: readonly unknown[];
  readonly facts: readonly unknown[];
  readonly observations: readonly unknown[];
}

interface ParsedFact {
  readonly record: RetainedVenueFactRecord;
  readonly retainedObservationId: string | null;
  readonly staleAt: string | null;
}

function invalidResponse(): never {
  throw new Error("Invalid venue compatibility response.");
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

function optionalUuid(value: unknown): string | null {
  return value === null ? null : uuidValue(value);
}

function projectTarget(value: unknown, projectId: string): number | null {
  const row = recordValue(value);
  if (uuidValue(row.id) !== projectId) invalidResponse();
  if (row.target_guest_count === null) return null;
  if (!Number.isSafeInteger(row.target_guest_count) || row.target_guest_count < 0) {
    invalidResponse();
  }
  return row.target_guest_count as number;
}

function validateVenue(value: unknown, projectId: string, venueId: string): void {
  const row = recordValue(value);
  if (uuidValue(row.id) !== venueId || uuidValue(row.project_id) !== projectId) {
    invalidResponse();
  }
}

function criterionDefinition(
  record: VenueFactDefinitionRecord,
): CriterionDefinition {
  return {
    key: record.key,
    valueType: record.valueType,
    unit: record.unit,
    optionsJson: record.optionsJson,
    priority: record.priority,
    weight: record.weight,
    evaluationRuleJson: record.evaluationRuleJson,
    systemDefined: record.systemDefined,
  };
}

function definitions(
  rows: readonly unknown[],
  projectId: string,
): readonly VenueFactDefinitionRecord[] {
  const parsed = rows.map((row) => parseVenueFactDefinitionRow(row, projectId));
  const ids = new Set(parsed.map((item) => item.id));
  const keys = new Set(parsed.map((item) => item.key));
  if (ids.size !== parsed.length || keys.size !== parsed.length) invalidResponse();
  return Object.freeze([...parsed].sort((left, right) => left.key.localeCompare(right.key)));
}

function staleAt(value: unknown): string | null {
  if (value === null) return null;
  const normalized = normalizeFactInstant(value);
  if (normalized === null) invalidResponse();
  return normalized;
}

function parseFacts(
  rows: readonly unknown[],
  records: readonly VenueFactDefinitionRecord[],
  projectId: string,
  venueId: string,
): ReadonlyMap<string, ParsedFact> {
  const definitionsById = new Map(records.map((record) => [record.id, record]));
  const parsed = new Map<string, ParsedFact>();
  for (const value of rows) {
    const row = recordValue(value);
    const definitionId = uuidValue(row.definition_id);
    const definition = definitionsById.get(definitionId);
    if (definition === undefined || parsed.has(definitionId)) invalidResponse();
    parsed.set(definitionId, {
      record: parseRetainedVenueFactRow(value, projectId, venueId, definition),
      retainedObservationId: optionalUuid(row.retained_observation_id),
      staleAt: staleAt(row.stale_at),
    });
  }
  return parsed;
}

function observationStatuses(
  rows: readonly unknown[],
  facts: ReadonlyMap<string, ParsedFact>,
  projectId: string,
): ReadonlyMap<string, string> {
  const expected = new Map<string, string>();
  for (const fact of facts.values()) {
    if (fact.retainedObservationId !== null) {
      expected.set(fact.retainedObservationId, fact.record.id);
    }
  }
  const statuses = new Map<string, string>();
  for (const value of rows) {
    const row = recordValue(value);
    const id = uuidValue(row.id);
    const expectedFactId = expected.get(id);
    if (
      expectedFactId === undefined ||
      uuidValue(row.project_id) !== projectId ||
      uuidValue(row.fact_id) !== expectedFactId ||
      !isFactObservationStatus(row.observation_status) ||
      statuses.has(id)
    ) {
      invalidResponse();
    }
    statuses.set(id, row.observation_status);
  }
  if (statuses.size !== expected.size) invalidResponse();
  return statuses;
}

function snapshots(
  records: readonly VenueFactDefinitionRecord[],
  facts: ReadonlyMap<string, ParsedFact>,
  statuses: ReadonlyMap<string, string>,
): readonly CriterionFactSnapshot[] {
  return Object.freeze(
    records.map((definition) => {
      const fact = facts.get(definition.id);
      if (fact === undefined) {
        return {
          definition: criterionDefinition(definition),
          state: null,
          retainedValue: null,
          retainedObservationStatus: null,
          staleAt: null,
        };
      }
      return {
        definition: criterionDefinition(definition),
        state: fact.record.state,
        retainedValue: fact.record.retainedValue,
        retainedObservationStatus:
          fact.retainedObservationId === null
            ? null
            : (statuses.get(fact.retainedObservationId) as
                | "active"
                | "superseded"
                | "withdrawn"),
        staleAt: fact.staleAt,
      };
    }),
  );
}

export function retainedObservationIds(rows: readonly unknown[]): readonly string[] {
  const ids = rows.flatMap((value) => {
    const retainedId = recordValue(value).retained_observation_id;
    return retainedId === null ? [] : [uuidValue(retainedId)];
  });
  return Object.freeze([...new Set(ids)]);
}

export function parseVenueCompatibilityInputs(
  rows: CompatibilityRows,
  projectId: string,
  venueId: string,
): VenueCompatibilityInputs {
  const parsedDefinitions = definitions(rows.definitions, projectId);
  const parsedFacts = parseFacts(rows.facts, parsedDefinitions, projectId, venueId);
  const statuses = observationStatuses(rows.observations, parsedFacts, projectId);
  validateVenue(rows.venue, projectId, venueId);
  return Object.freeze({
    projectId,
    venueId,
    projectTargetGuestCount: projectTarget(rows.project, projectId),
    snapshots: snapshots(parsedDefinitions, parsedFacts, statuses),
  });
}

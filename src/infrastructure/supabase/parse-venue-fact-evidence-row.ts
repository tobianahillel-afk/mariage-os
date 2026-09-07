import type {
  ObservationSourceLinkRecord,
  ResolvedVenueFactRecord,
  VenueFactContext,
  VenueFactObservationRecord,
  VenueFactSourceRecord,
} from "@application/facts/venue-fact-evidence-service";
import type { VenueFactDefinitionRecord } from "@application/facts/venue-fact-service";
import {
  isFactObservationStatus,
  type FactObservationStatus,
} from "@domain/facts/fact-evidence-types";
import {
  normalizeFactInstant,
  normalizeFactObservation,
} from "@domain/facts/fact-observation";
import { normalizeFactResolution } from "@domain/facts/fact-resolution";
import { normalizeFactSource } from "@domain/facts/fact-source";
import { normalizeFactValue } from "@domain/facts/fact-value";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type UnknownRecord = Record<string, unknown>;

function invalidResponse(): never {
  throw new Error("Invalid venue fact evidence response.");
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

function nullableUuidValue(value: unknown): string | null {
  return value === null ? null : uuidValue(value);
}

function revisionValue(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) invalidResponse();
  return value as number;
}

function instantValue(value: unknown): string {
  const parsed = normalizeFactInstant(value);
  if (parsed === null) invalidResponse();
  return parsed;
}

function nullableInstantValue(value: unknown): string | null {
  return value === null ? null : instantValue(value);
}

export interface VenueFactContextIdentity {
  readonly factId: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly definitionId: string;
}

export function parseVenueFactContextIdentity(
  value: unknown,
  expectedProjectId: string,
  expectedFactId: string,
): VenueFactContextIdentity {
  const row = recordValue(value);
  const factId = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  if (
    factId !== expectedFactId ||
    projectId !== expectedProjectId ||
    row.target_type !== "venue"
  ) {
    invalidResponse();
  }
  return {
    factId,
    projectId,
    venueId: uuidValue(row.target_id),
    definitionId: uuidValue(row.definition_id),
  };
}

export function venueFactContextFromIdentity(
  identity: VenueFactContextIdentity,
  definition: VenueFactDefinitionRecord,
): VenueFactContext {
  if (
    definition.id !== identity.definitionId ||
    definition.projectId !== identity.projectId
  ) {
    invalidResponse();
  }
  return {
    factId: identity.factId,
    projectId: identity.projectId,
    venueId: identity.venueId,
    definition,
  };
}

export function parseVenueFactSourceRow(
  value: unknown,
  expectedProjectId: string,
  expectedSourceId: string | null = null,
): VenueFactSourceRecord {
  const row = recordValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  if (
    projectId !== expectedProjectId ||
    (expectedSourceId !== null && id !== expectedSourceId)
  ) {
    invalidResponse();
  }
  const normalized = normalizeFactSource({
    sourceType: row.source_type,
    title: row.title,
    url: row.url,
    evidenceLevel: row.evidence_level,
    observedAt: row.observed_at,
    notes: row.notes,
    status: row.status,
  });
  if (!normalized.ok) invalidResponse();
  return {
    id,
    projectId,
    revision: revisionValue(row.revision),
    ...normalized.value,
  };
}

function observationStatusValue(value: unknown): FactObservationStatus {
  if (!isFactObservationStatus(value)) invalidResponse();
  return value;
}

export function parseVenueFactObservationRow(
  value: unknown,
  context: VenueFactContext,
  expectedObservationId: string | null = null,
): VenueFactObservationRecord {
  const row = recordValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  const factId = uuidValue(row.fact_id);
  if (
    projectId !== context.projectId ||
    factId !== context.factId ||
    (expectedObservationId !== null && id !== expectedObservationId)
  ) {
    invalidResponse();
  }
  const normalized = normalizeFactObservation(context.definition, {
    value: row.value,
    rawValueText: row.raw_value_text,
    evidenceLevel: row.evidence_level,
    confidence: row.confidence,
    observedAt: row.observed_at,
    note: row.note,
  });
  if (!normalized.ok) invalidResponse();
  return {
    id,
    projectId,
    factId,
    status: observationStatusValue(row.observation_status),
    supersededByObservationId: nullableUuidValue(
      row.superseded_by_observation_id,
    ),
    createdBy: uuidValue(row.created_by),
    ...normalized.value,
  };
}

export function parseObservationSourceLinkRow(
  value: unknown,
  expectedProjectId: string,
  expectedObservationId: string,
  expectedSourceId: string,
): ObservationSourceLinkRecord {
  const row = recordValue(value);
  const projectId = uuidValue(row.project_id);
  const observationId = uuidValue(row.observation_id);
  const sourceId = uuidValue(row.source_id);
  if (
    projectId !== expectedProjectId ||
    observationId !== expectedObservationId ||
    sourceId !== expectedSourceId ||
    typeof row.is_primary !== "boolean"
  ) {
    invalidResponse();
  }
  return {
    projectId,
    observationId,
    sourceId,
    isPrimary: row.is_primary,
  };
}

interface ResolvedFactIdentity {
  readonly projectId: string;
  readonly factId: string;
  readonly venueId: string;
  readonly definitionId: string;
  readonly retainedObservationId: string;
}

function resolvedIdentityMatches(
  identity: ResolvedFactIdentity,
  context: VenueFactContext,
  expectedObservationId: string,
  targetType: unknown,
): boolean {
  return (
    identity.projectId === context.projectId &&
    identity.factId === context.factId &&
    identity.venueId === context.venueId &&
    identity.definitionId === context.definition.id &&
    identity.retainedObservationId === expectedObservationId &&
    targetType === "venue"
  );
}

export function parseResolvedVenueFactEvidenceRow(
  value: unknown,
  context: VenueFactContext,
  expectedObservationId: string,
): ResolvedVenueFactRecord {
  const row = recordValue(value);
  const identity: ResolvedFactIdentity = {
    projectId: uuidValue(row.project_id),
    factId: uuidValue(row.id),
    venueId: uuidValue(row.target_id),
    definitionId: uuidValue(row.definition_id),
    retainedObservationId: uuidValue(row.retained_observation_id),
  };
  if (!resolvedIdentityMatches(identity, context, expectedObservationId, row.target_type)) {
    invalidResponse();
  }
  const resolution = normalizeFactResolution({
    state: row.state,
    resolutionNote: row.resolution_note,
  });
  if (!resolution.ok || row.retained_value === null) invalidResponse();
  const retainedValue = normalizeFactValue(
    context.definition,
    row.retained_value,
  );
  if (!retainedValue.ok) invalidResponse();
  uuidValue(row.resolved_by);
  instantValue(row.resolved_at);
  nullableInstantValue(row.last_verified_at);
  nullableInstantValue(row.stale_at);
  return {
    id: identity.factId,
    projectId: identity.projectId,
    venueId: identity.venueId,
    definitionId: identity.definitionId,
    state: resolution.value.state,
    retainedValue: retainedValue.value,
    retainedObservationId: identity.retainedObservationId,
    resolutionNote: resolution.value.resolutionNote,
    revision: revisionValue(row.revision),
  };
}

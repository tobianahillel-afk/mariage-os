import {
  normalizeFactDefinition,
  type FactDefinitionDraft,
  type FactDefinitionError,
  type NormalizedFactDefinition,
} from "@domain/facts/fact-definition";
import {
  normalizeRetainedFact,
  type RetainedFactDraft,
  type RetainedFactError,
} from "@domain/facts/retained-fact";
import type { FactState } from "@domain/facts/fact-types";
import {
  validateExpectedVenueRevision,
  type VenueRevisionError,
} from "@domain/venues/venue-revision";
import {
  venueFactPersistenceErrorCode,
  type VenueFactPersistenceErrorCode,
} from "./venue-fact-persistence-error";

export interface VenueFactDefinitionRecord extends NormalizedFactDefinition {
  readonly id: string;
  readonly projectId: string;
  readonly entityType: "venue";
  readonly systemDefined: boolean;
  readonly revision: number;
}

export interface RetainedVenueFactRecord {
  readonly id: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly definitionId: string;
  readonly state: FactState;
  readonly retainedValue: unknown;
  readonly revision: number;
}

export interface CreateVenueFactDefinitionInput extends NormalizedFactDefinition {
  readonly projectId: string;
}

export interface UpdateVenueFactDefinitionInput {
  readonly projectId: string;
  readonly definitionId: string;
  readonly expectedRevision: number;
  readonly label: string;
  readonly priority: NormalizedFactDefinition["priority"];
  readonly weight: number | null;
  readonly freshnessPolicy: string | null;
  readonly optionsJson: NormalizedFactDefinition["optionsJson"];
  readonly evaluationRuleJson: NormalizedFactDefinition["evaluationRuleJson"];
}

export interface SetRetainedVenueFactInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly definitionId: string;
  readonly expectedRevision: number | null;
  readonly state: FactState;
  readonly retainedValue: unknown;
}

export interface VenueFactPort {
  getDefinition(
    projectId: string,
    definitionId: string,
  ): Promise<VenueFactDefinitionRecord>;
  createDefinition(
    input: CreateVenueFactDefinitionInput,
  ): Promise<VenueFactDefinitionRecord>;
  updateDefinition(
    input: UpdateVenueFactDefinitionInput,
  ): Promise<VenueFactDefinitionRecord>;
  setRetainedFact(
    input: SetRetainedVenueFactInput,
  ): Promise<RetainedVenueFactRecord>;
}

export interface CreateVenueFactDefinitionDraft extends FactDefinitionDraft {
  readonly projectId: string;
}

export interface UpdateVenueFactDefinitionDraft extends FactDefinitionDraft {
  readonly projectId: string;
  readonly definitionId: string;
  readonly expectedRevision: number;
}

export interface SetRetainedVenueFactDraft extends RetainedFactDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly definitionId: string;
  readonly expectedRevision: number | null;
}

type MutationError =
  | FactDefinitionError
  | RetainedFactError
  | VenueRevisionError
  | VenueFactPersistenceErrorCode;
export type DefinitionMutationResult =
  | { readonly ok: true; readonly definition: VenueFactDefinitionRecord }
  | { readonly ok: false; readonly error: MutationError };
export type RetainedFactMutationResult =
  | { readonly ok: true; readonly fact: RetainedVenueFactRecord }
  | { readonly ok: false; readonly error: MutationError };

function revisionError(value: number | null): VenueRevisionError | null {
  return value === null ? null : validateExpectedVenueRevision(value);
}

function persistenceError(error: unknown): VenueFactPersistenceErrorCode {
  return venueFactPersistenceErrorCode(error) ?? "persistence_failed";
}

export async function createVenueFactDefinition(
  port: VenueFactPort,
  draft: CreateVenueFactDefinitionDraft,
): Promise<DefinitionMutationResult> {
  const normalized = normalizeFactDefinition(draft);
  if (!normalized.ok) return normalized;
  try {
    const definition = await port.createDefinition({
      projectId: draft.projectId,
      ...normalized.value,
    });
    return { ok: true, definition };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

export async function updateVenueFactDefinition(
  port: VenueFactPort,
  draft: UpdateVenueFactDefinitionDraft,
): Promise<DefinitionMutationResult> {
  const normalized = normalizeFactDefinition(draft);
  if (!normalized.ok) return normalized;
  const invalidRevision = validateExpectedVenueRevision(draft.expectedRevision);
  if (invalidRevision !== null) return { ok: false, error: invalidRevision };
  try {
    const definition = await port.updateDefinition({
      projectId: draft.projectId,
      definitionId: draft.definitionId,
      expectedRevision: draft.expectedRevision,
      label: normalized.value.label,
      priority: normalized.value.priority,
      weight: normalized.value.weight,
      freshnessPolicy: normalized.value.freshnessPolicy,
      optionsJson: normalized.value.optionsJson,
      evaluationRuleJson: normalized.value.evaluationRuleJson,
    });
    return { ok: true, definition };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

export async function setRetainedVenueFact(
  port: VenueFactPort,
  draft: SetRetainedVenueFactDraft,
): Promise<RetainedFactMutationResult> {
  const invalidRevision = revisionError(draft.expectedRevision);
  if (invalidRevision !== null) return { ok: false, error: invalidRevision };
  try {
    const definition = await port.getDefinition(
      draft.projectId,
      draft.definitionId,
    );
    const normalized = normalizeRetainedFact(definition, draft);
    if (!normalized.ok) return normalized;
    const fact = await port.setRetainedFact({
      projectId: draft.projectId,
      venueId: draft.venueId,
      definitionId: draft.definitionId,
      expectedRevision: draft.expectedRevision,
      ...normalized.value,
    });
    return { ok: true, fact };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

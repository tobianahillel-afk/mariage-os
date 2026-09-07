import type { FactObservationStatus } from "@domain/facts/fact-evidence-types";
import {
  normalizeFactObservation,
  type FactObservationDraft,
  type FactObservationError,
  type NormalizedFactObservation,
} from "@domain/facts/fact-observation";
import {
  normalizeFactResolution,
  type FactResolutionError,
  type FactResolutionState,
} from "@domain/facts/fact-resolution";
import {
  normalizeFactSource,
  type FactSourceDraft,
  type FactSourceError,
  type NormalizedFactSource,
} from "@domain/facts/fact-source";
import {
  validateExpectedVenueRevision,
  type VenueRevisionError,
} from "@domain/venues/venue-revision";
import {
  venueFactPersistenceErrorCode,
  type VenueFactPersistenceErrorCode,
} from "./venue-fact-persistence-error";
import type { VenueFactDefinitionRecord } from "./venue-fact-service";

export interface VenueFactContext {
  readonly factId: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly definition: VenueFactDefinitionRecord;
}

export interface VenueFactObservationRecord extends NormalizedFactObservation {
  readonly id: string;
  readonly projectId: string;
  readonly factId: string;
  readonly status: FactObservationStatus;
  readonly supersededByObservationId: string | null;
  readonly createdBy: string;
}

export interface VenueFactSourceRecord extends NormalizedFactSource {
  readonly id: string;
  readonly projectId: string;
  readonly revision: number;
}

export interface ObservationSourceLinkRecord {
  readonly projectId: string;
  readonly observationId: string;
  readonly sourceId: string;
  readonly isPrimary: boolean;
}

export interface ResolvedVenueFactRecord {
  readonly id: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly definitionId: string;
  readonly state: FactResolutionState;
  readonly retainedValue: unknown;
  readonly retainedObservationId: string;
  readonly resolutionNote: string | null;
  readonly revision: number;
}

export interface CreateVenueFactSourceInput extends NormalizedFactSource {
  readonly projectId: string;
}

export interface UpdateVenueFactSourceInput extends NormalizedFactSource {
  readonly projectId: string;
  readonly sourceId: string;
  readonly expectedRevision: number;
}

export interface AppendVenueFactObservationInput extends NormalizedFactObservation {
  readonly projectId: string;
  readonly factId: string;
  readonly supersedesObservationId: string | null;
}

export interface LinkObservationSourceInput {
  readonly projectId: string;
  readonly observationId: string;
  readonly sourceId: string;
  readonly isPrimary: boolean;
}

export interface ResolveVenueFactObservationInput {
  readonly projectId: string;
  readonly factId: string;
  readonly observationId: string;
  readonly expectedRevision: number;
  readonly state: FactResolutionState;
  readonly resolutionNote: string | null;
}

export interface VenueFactEvidencePort {
  getFactContext(projectId: string, factId: string): Promise<VenueFactContext>;
  createSource(
    input: CreateVenueFactSourceInput,
  ): Promise<VenueFactSourceRecord>;
  updateSource(
    input: UpdateVenueFactSourceInput,
  ): Promise<VenueFactSourceRecord>;
  appendObservation(
    input: AppendVenueFactObservationInput,
  ): Promise<VenueFactObservationRecord>;
  linkObservationSource(
    input: LinkObservationSourceInput,
  ): Promise<ObservationSourceLinkRecord>;
  resolveFromObservation(
    input: ResolveVenueFactObservationInput,
  ): Promise<ResolvedVenueFactRecord>;
}

export interface CreateVenueFactSourceDraft extends FactSourceDraft {
  readonly projectId: string;
}

export interface UpdateVenueFactSourceDraft extends FactSourceDraft {
  readonly projectId: string;
  readonly sourceId: string;
  readonly expectedRevision: number;
}

export interface AppendVenueFactObservationDraft extends FactObservationDraft {
  readonly projectId: string;
  readonly factId: string;
  readonly supersedesObservationId: string | null;
}

export interface LinkObservationSourceDraft {
  readonly projectId: string;
  readonly observationId: string;
  readonly sourceId: string;
  readonly isPrimary: unknown;
}

export interface ResolveVenueFactObservationDraft {
  readonly projectId: string;
  readonly factId: string;
  readonly observationId: string;
  readonly expectedRevision: number;
  readonly state: unknown;
  readonly resolutionNote: unknown;
}

type EvidenceDomainError =
  | FactObservationError
  | FactSourceError
  | FactResolutionError
  | VenueRevisionError
  | "invalid_primary_flag";
type EvidenceMutationError =
  EvidenceDomainError | VenueFactPersistenceErrorCode;

export type SourceMutationResult =
  | { readonly ok: true; readonly source: VenueFactSourceRecord }
  | { readonly ok: false; readonly error: EvidenceMutationError };
export type ObservationMutationResult =
  | { readonly ok: true; readonly observation: VenueFactObservationRecord }
  | { readonly ok: false; readonly error: EvidenceMutationError };
export type ObservationLinkResult =
  | { readonly ok: true; readonly link: ObservationSourceLinkRecord }
  | { readonly ok: false; readonly error: EvidenceMutationError };
export type ObservationResolutionResult =
  | { readonly ok: true; readonly fact: ResolvedVenueFactRecord }
  | { readonly ok: false; readonly error: EvidenceMutationError };

function persistenceError(error: unknown): VenueFactPersistenceErrorCode {
  return venueFactPersistenceErrorCode(error) ?? "persistence_failed";
}

export async function createVenueFactSource(
  port: VenueFactEvidencePort,
  draft: CreateVenueFactSourceDraft,
): Promise<SourceMutationResult> {
  const normalized = normalizeFactSource(draft);
  if (!normalized.ok) return normalized;
  try {
    const source = await port.createSource({
      projectId: draft.projectId,
      ...normalized.value,
    });
    return { ok: true, source };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

export async function updateVenueFactSource(
  port: VenueFactEvidencePort,
  draft: UpdateVenueFactSourceDraft,
): Promise<SourceMutationResult> {
  const revisionError = validateExpectedVenueRevision(draft.expectedRevision);
  if (revisionError !== null) return { ok: false, error: revisionError };
  const normalized = normalizeFactSource(draft);
  if (!normalized.ok) return normalized;
  try {
    const source = await port.updateSource({
      projectId: draft.projectId,
      sourceId: draft.sourceId,
      expectedRevision: draft.expectedRevision,
      ...normalized.value,
    });
    return { ok: true, source };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

export async function appendVenueFactObservation(
  port: VenueFactEvidencePort,
  draft: AppendVenueFactObservationDraft,
): Promise<ObservationMutationResult> {
  try {
    const context = await port.getFactContext(draft.projectId, draft.factId);
    const normalized = normalizeFactObservation(context.definition, draft);
    if (!normalized.ok) return normalized;
    const observation = await port.appendObservation({
      projectId: draft.projectId,
      factId: draft.factId,
      supersedesObservationId: draft.supersedesObservationId,
      ...normalized.value,
    });
    return { ok: true, observation };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

export async function linkVenueFactObservationSource(
  port: VenueFactEvidencePort,
  draft: LinkObservationSourceDraft,
): Promise<ObservationLinkResult> {
  if (typeof draft.isPrimary !== "boolean") {
    return { ok: false, error: "invalid_primary_flag" };
  }
  try {
    const link = await port.linkObservationSource({
      projectId: draft.projectId,
      observationId: draft.observationId,
      sourceId: draft.sourceId,
      isPrimary: draft.isPrimary,
    });
    return { ok: true, link };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

export async function resolveVenueFactFromObservation(
  port: VenueFactEvidencePort,
  draft: ResolveVenueFactObservationDraft,
): Promise<ObservationResolutionResult> {
  const revisionError = validateExpectedVenueRevision(draft.expectedRevision);
  if (revisionError !== null) return { ok: false, error: revisionError };
  const normalized = normalizeFactResolution(draft);
  if (!normalized.ok) return normalized;
  try {
    const fact = await port.resolveFromObservation({
      projectId: draft.projectId,
      factId: draft.factId,
      observationId: draft.observationId,
      expectedRevision: draft.expectedRevision,
      ...normalized.value,
    });
    return { ok: true, fact };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

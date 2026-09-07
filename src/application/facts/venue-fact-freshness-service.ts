import {
  normalizeFactFreshness,
  type FactFreshnessDraft,
  type FactFreshnessError,
  type NormalizedFactFreshness,
} from "@domain/facts/fact-freshness";
import {
  validateExpectedVenueRevision,
  type VenueRevisionError,
} from "@domain/venues/venue-revision";
import {
  venueFactPersistenceErrorCode,
  type VenueFactPersistenceErrorCode,
} from "./venue-fact-persistence-error";

export interface VenueFactFreshnessRecord extends NormalizedFactFreshness {
  readonly id: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly definitionId: string;
  readonly revision: number;
}

export interface SetVenueFactFreshnessInput extends NormalizedFactFreshness {
  readonly projectId: string;
  readonly factId: string;
  readonly expectedRevision: number;
}

export interface VenueFactFreshnessPort {
  setFreshness(
    input: SetVenueFactFreshnessInput,
  ): Promise<VenueFactFreshnessRecord>;
}

export interface SetVenueFactFreshnessDraft extends FactFreshnessDraft {
  readonly projectId: string;
  readonly factId: string;
  readonly expectedRevision: number;
}

type FreshnessMutationError =
  | FactFreshnessError
  | VenueRevisionError
  | VenueFactPersistenceErrorCode;

export type FreshnessMutationResult =
  | { readonly ok: true; readonly fact: VenueFactFreshnessRecord }
  | { readonly ok: false; readonly error: FreshnessMutationError };

function persistenceError(error: unknown): VenueFactPersistenceErrorCode {
  return venueFactPersistenceErrorCode(error) ?? "persistence_failed";
}

export async function setVenueFactFreshness(
  port: VenueFactFreshnessPort,
  draft: SetVenueFactFreshnessDraft,
): Promise<FreshnessMutationResult> {
  const revisionError = validateExpectedVenueRevision(draft.expectedRevision);
  if (revisionError !== null) return { ok: false, error: revisionError };
  const normalized = normalizeFactFreshness(draft);
  if (!normalized.ok) return normalized;
  try {
    const fact = await port.setFreshness({
      projectId: draft.projectId,
      factId: draft.factId,
      expectedRevision: draft.expectedRevision,
      ...normalized.value,
    });
    return { ok: true, fact };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}

import {
  normalizeVenueInteraction,
  type NormalizedVenueInteractionDraft,
  type VenueInteractionRecord,
  type VenueInteractionValidationError,
} from "@domain/venues/venue-interaction";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";
import { venueInteractionPersistenceErrorCode } from "./venue-interaction-persistence-error";

export interface AppendVenueInteractionInput {
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly interactionId: unknown;
  readonly contactId: unknown;
  readonly interactionType: unknown;
  readonly occurredAt: unknown;
  readonly summary: unknown;
  readonly nextFollowUpAt: unknown;
  readonly sourceId: unknown;
}

export interface NormalizedAppendVenueInteractionInput extends NormalizedVenueInteractionDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly interactionId: string;
  readonly contactId: string | null;
  readonly sourceId: string | null;
}

export interface VenueInteractionPort {
  appendVenueInteraction(
    input: NormalizedAppendVenueInteractionInput,
  ): Promise<VenueInteractionRecord>;
  listVenueInteractionHistory(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueInteractionRecord[]>;
}

type VenueInteractionServiceError =
  | "invalid_identity"
  | VenueInteractionValidationError
  | "replay_conflict"
  | "persistence_failed";

export type VenueInteractionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueInteractionServiceError };

function normalizeOptionalUuid(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return isVenueCommercialUuid(value) ? value : undefined;
}

function persistenceFailure(error: unknown): VenueInteractionServiceError {
  return venueInteractionPersistenceErrorCode(error) === "conflict"
    ? "replay_conflict"
    : "persistence_failed";
}

export class VenueInteractionService {
  constructor(private readonly port: VenueInteractionPort) {}

  async appendVenueInteraction(
    input: AppendVenueInteractionInput,
  ): Promise<VenueInteractionResult<VenueInteractionRecord>> {
    if (
      !isVenueCommercialUuid(input.projectId) ||
      !isVenueCommercialUuid(input.venueId) ||
      !isVenueCommercialUuid(input.interactionId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }
    const contactId = normalizeOptionalUuid(input.contactId);
    const sourceId = normalizeOptionalUuid(input.sourceId);
    if (contactId === undefined || sourceId === undefined) {
      return { ok: false, error: "invalid_identity" };
    }

    const normalized = normalizeVenueInteraction(input);
    if (!normalized.ok) return normalized;

    try {
      const record = await this.port.appendVenueInteraction({
        projectId: input.projectId,
        venueId: input.venueId,
        interactionId: input.interactionId,
        contactId,
        sourceId,
        ...normalized.value,
      });
      return { ok: true, value: record };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  async listVenueInteractionHistory(
    projectId: unknown,
    venueId: unknown,
  ): Promise<VenueInteractionResult<readonly VenueInteractionRecord[]>> {
    if (!isVenueCommercialUuid(projectId) || !isVenueCommercialUuid(venueId)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      return {
        ok: true,
        value: await this.port.listVenueInteractionHistory(projectId, venueId),
      };
    } catch {
      return { ok: false, error: "persistence_failed" };
    }
  }
}

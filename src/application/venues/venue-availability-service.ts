import {
  effectiveVenueAvailabilityStatus,
  latestVenueAvailability,
  normalizeVenueAvailability,
  type NormalizedVenueAvailabilityDraft,
  type VenueAvailabilityRecord,
  type VenueAvailabilityValidationError,
} from "@domain/venues/venue-availability";
import {
  isCommercialCivilDate,
  isVenueCommercialUuid,
} from "@domain/venues/venue-commercial-values";
import { normalizeFactInstant } from "@domain/facts/fact-observation";
import { venueAvailabilityPersistenceErrorCode } from "./venue-availability-persistence-error";

export interface AppendVenueAvailabilityInput {
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly availabilityId: unknown;
  readonly dateOptionId: unknown;
  readonly eventDate: unknown;
  readonly status: unknown;
  readonly optionExpiresAt: unknown;
  readonly observedAt: unknown;
  readonly sourceId: unknown;
  readonly notes: unknown;
}

export interface NormalizedAppendVenueAvailabilityInput extends NormalizedVenueAvailabilityDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly availabilityId: string;
  readonly dateOptionId: string | null;
}

export interface VenueAvailabilityPort {
  appendVenueAvailability(
    input: NormalizedAppendVenueAvailabilityInput,
  ): Promise<VenueAvailabilityRecord>;
  listVenueAvailabilityHistory(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueAvailabilityRecord[]>;
}

export type VenueAvailabilityServiceError =
  | "invalid_identity"
  | VenueAvailabilityValidationError
  | "invalid_now"
  | "replay_conflict"
  | "persistence_failed";

export type VenueAvailabilityResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueAvailabilityServiceError };

export interface VenueAvailabilityLatestResult {
  readonly record: VenueAvailabilityRecord;
  readonly effectiveStatus: VenueAvailabilityRecord["status"];
}

function normalizeOptionalUuid(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return isVenueCommercialUuid(value) ? value : undefined;
}

function persistenceFailure(error: unknown): VenueAvailabilityServiceError {
  return venueAvailabilityPersistenceErrorCode(error) === "conflict"
    ? "replay_conflict"
    : "persistence_failed";
}

export class VenueAvailabilityService {
  constructor(private readonly port: VenueAvailabilityPort) {}

  async appendVenueAvailability(
    input: AppendVenueAvailabilityInput,
  ): Promise<VenueAvailabilityResult<VenueAvailabilityRecord>> {
    if (
      !isVenueCommercialUuid(input.projectId) ||
      !isVenueCommercialUuid(input.venueId) ||
      !isVenueCommercialUuid(input.availabilityId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }
    const dateOptionId = normalizeOptionalUuid(input.dateOptionId);
    if (dateOptionId === undefined) {
      return { ok: false, error: "invalid_identity" };
    }
    const normalized = normalizeVenueAvailability(input);
    if (!normalized.ok) return normalized;

    try {
      const record = await this.port.appendVenueAvailability({
        projectId: input.projectId,
        venueId: input.venueId,
        availabilityId: input.availabilityId,
        dateOptionId,
        ...normalized.value,
      });
      return { ok: true, value: record };
    } catch (error) {
      return { ok: false, error: persistenceFailure(error) };
    }
  }

  async listVenueAvailabilityHistory(
    projectId: unknown,
    venueId: unknown,
  ): Promise<VenueAvailabilityResult<readonly VenueAvailabilityRecord[]>> {
    if (!isVenueCommercialUuid(projectId) || !isVenueCommercialUuid(venueId)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      const records = await this.port.listVenueAvailabilityHistory(
        projectId,
        venueId,
      );
      return { ok: true, value: records };
    } catch {
      return { ok: false, error: "persistence_failed" };
    }
  }

  async latestVenueAvailability(
    projectId: unknown,
    venueId: unknown,
    eventDate: unknown,
    now: unknown,
  ): Promise<VenueAvailabilityResult<VenueAvailabilityLatestResult | null>> {
    if (!isCommercialCivilDate(eventDate)) {
      return { ok: false, error: "invalid_event_date" };
    }
    const normalizedNow = normalizeFactInstant(now);
    if (normalizedNow === null) return { ok: false, error: "invalid_now" };

    const history = await this.listVenueAvailabilityHistory(projectId, venueId);
    if (!history.ok) return history;
    const latest = latestVenueAvailability(
      history.value.filter((record) => record.eventDate === eventDate),
    );
    if (latest === null) return { ok: true, value: null };
    return {
      ok: true,
      value: {
        record: latest,
        effectiveStatus: effectiveVenueAvailabilityStatus(
          latest,
          normalizedNow,
        ),
      },
    };
  }
}

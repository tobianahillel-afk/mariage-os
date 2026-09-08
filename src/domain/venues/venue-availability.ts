import { normalizeFactInstant } from "@domain/facts/fact-observation";
import {
  isCommercialCivilDate,
  isVenueCommercialUuid,
  normalizeCommercialOptionalText,
} from "./venue-commercial-values";

export const VENUE_AVAILABILITY_STATUSES = [
  "unknown",
  "available",
  "unavailable",
  "option_held",
  "expired",
] as const;

export type VenueAvailabilityStatus =
  (typeof VENUE_AVAILABILITY_STATUSES)[number];

export interface VenueAvailabilityDraft {
  readonly eventDate: unknown;
  readonly status: unknown;
  readonly optionExpiresAt: unknown;
  readonly observedAt: unknown;
  readonly sourceId: unknown;
  readonly notes: unknown;
}

export interface NormalizedVenueAvailabilityDraft {
  readonly eventDate: string;
  readonly status: VenueAvailabilityStatus;
  readonly optionExpiresAt: string | null;
  readonly observedAt: string;
  readonly sourceId: string | null;
  readonly notes: string | null;
}

export interface VenueAvailabilityRecord extends NormalizedVenueAvailabilityDraft {
  readonly id: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly dateOptionId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly revision: number;
}

export type VenueAvailabilityValidationError =
  | "invalid_event_date"
  | "invalid_status"
  | "invalid_option_expires_at"
  | "invalid_observed_at"
  | "invalid_source_id"
  | "invalid_notes";

export type VenueAvailabilityValidationResult =
  | { readonly ok: true; readonly value: NormalizedVenueAvailabilityDraft }
  | { readonly ok: false; readonly error: VenueAvailabilityValidationError };

export function isVenueAvailabilityStatus(
  value: unknown,
): value is VenueAvailabilityStatus {
  return (
    typeof value === "string" &&
    (VENUE_AVAILABILITY_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeVenueAvailability(
  draft: VenueAvailabilityDraft,
): VenueAvailabilityValidationResult {
  if (!isCommercialCivilDate(draft.eventDate)) {
    return { ok: false, error: "invalid_event_date" };
  }
  if (!isVenueAvailabilityStatus(draft.status)) {
    return { ok: false, error: "invalid_status" };
  }

  const observedAt = normalizeFactInstant(draft.observedAt);
  if (observedAt === null) {
    return { ok: false, error: "invalid_observed_at" };
  }

  let optionExpiresAt: string | null = null;
  if (draft.optionExpiresAt !== null && draft.optionExpiresAt !== undefined) {
    optionExpiresAt = normalizeFactInstant(draft.optionExpiresAt);
    if (optionExpiresAt === null || draft.status !== "option_held") {
      return { ok: false, error: "invalid_option_expires_at" };
    }
  }

  let sourceId: string | null = null;
  if (draft.sourceId !== null && draft.sourceId !== undefined) {
    if (!isVenueCommercialUuid(draft.sourceId)) {
      return { ok: false, error: "invalid_source_id" };
    }
    sourceId = draft.sourceId;
  }

  if (
    draft.notes !== null &&
    draft.notes !== undefined &&
    typeof draft.notes !== "string"
  ) {
    return { ok: false, error: "invalid_notes" };
  }
  const notes = normalizeCommercialOptionalText(
    draft.notes as string | null | undefined,
    5_000,
  );
  if (notes === undefined) return { ok: false, error: "invalid_notes" };

  return {
    ok: true,
    value: {
      eventDate: draft.eventDate,
      status: draft.status,
      optionExpiresAt,
      observedAt,
      sourceId,
      notes,
    },
  };
}

export function venueAvailabilityPayloadEquals(
  left: Pick<
    VenueAvailabilityRecord,
    | "projectId"
    | "venueId"
    | "dateOptionId"
    | "eventDate"
    | "status"
    | "optionExpiresAt"
    | "observedAt"
    | "sourceId"
    | "notes"
  >,
  right: typeof left,
): boolean {
  return (
    left.projectId === right.projectId &&
    left.venueId === right.venueId &&
    left.dateOptionId === right.dateOptionId &&
    left.eventDate === right.eventDate &&
    left.status === right.status &&
    left.optionExpiresAt === right.optionExpiresAt &&
    left.observedAt === right.observedAt &&
    left.sourceId === right.sourceId &&
    left.notes === right.notes
  );
}

export function compareVenueAvailabilityRecency(
  left: VenueAvailabilityRecord,
  right: VenueAvailabilityRecord,
): number {
  if (left.observedAt !== right.observedAt) {
    return left.observedAt > right.observedAt ? -1 : 1;
  }
  if (left.createdAt !== right.createdAt) {
    return left.createdAt > right.createdAt ? -1 : 1;
  }
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export function latestVenueAvailability(
  records: readonly VenueAvailabilityRecord[],
): VenueAvailabilityRecord | null {
  if (records.length === 0) return null;
  return [...records].sort(compareVenueAvailabilityRecency)[0] ?? null;
}

export function effectiveVenueAvailabilityStatus(
  record: VenueAvailabilityRecord,
  now: string,
): VenueAvailabilityStatus {
  if (
    record.status === "option_held" &&
    record.optionExpiresAt !== null &&
    record.optionExpiresAt <= now
  ) {
    return "expired";
  }
  return record.status;
}

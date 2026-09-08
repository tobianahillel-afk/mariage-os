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

type VenueAvailabilityPayload = Pick<
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
>;

const VENUE_AVAILABILITY_PAYLOAD_KEYS: readonly (keyof VenueAvailabilityPayload)[] = [
  "projectId",
  "venueId",
  "dateOptionId",
  "eventDate",
  "status",
  "optionExpiresAt",
  "observedAt",
  "sourceId",
  "notes",
];

export function isVenueAvailabilityStatus(
  value: unknown,
): value is VenueAvailabilityStatus {
  return (
    typeof value === "string" &&
    (VENUE_AVAILABILITY_STATUSES as readonly string[]).includes(value)
  );
}

function normalizeOptionExpiresAt(
  value: unknown,
  status: VenueAvailabilityStatus,
): string | null | undefined {
  if (value === null || value === undefined) return null;
  const normalized = normalizeFactInstant(value);
  if (normalized === null || status !== "option_held") return undefined;
  return normalized;
}

function normalizeSourceId(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return isVenueCommercialUuid(value) ? value : undefined;
}

function normalizeNotes(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  return normalizeCommercialOptionalText(value, 5_000);
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

  const optionExpiresAt = normalizeOptionExpiresAt(
    draft.optionExpiresAt,
    draft.status,
  );
  if (optionExpiresAt === undefined) {
    return { ok: false, error: "invalid_option_expires_at" };
  }

  const sourceId = normalizeSourceId(draft.sourceId);
  if (sourceId === undefined) {
    return { ok: false, error: "invalid_source_id" };
  }

  const notes = normalizeNotes(draft.notes);
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
  left: VenueAvailabilityPayload,
  right: VenueAvailabilityPayload,
): boolean {
  return VENUE_AVAILABILITY_PAYLOAD_KEYS.every(
    (key) => left[key] === right[key],
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

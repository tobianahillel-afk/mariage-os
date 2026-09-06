export const venueStatuses = [
  "research",
  "shortlist",
  "reserve",
  "contacted",
  "quote_requested",
  "quote_received",
  "visit_planned",
  "visited",
  "reviewed",
  "finalist",
  "option_held",
  "selected",
  "contract_sent",
  "contract_signed",
  "deposit_paid",
  "confirmed",
  "completed",
  "archived",
  "rejected",
  "unavailable",
  "withdrawn",
  "paused",
] as const;

export type VenueStatus = (typeof venueStatuses)[number];

export type VenueTransitionError =
  | "unknown_status"
  | "rejection_reason_required"
  | "rejection_reason_too_long"
  | "rejection_reason_not_allowed";

export type VenueTransitionValidation =
  | {
      readonly ok: true;
      readonly status: VenueStatus;
      readonly rejectionReason: string | null;
    }
  | { readonly ok: false; readonly error: VenueTransitionError };

const venueStatusSet = new Set<string>(venueStatuses);
const MAX_REJECTION_REASON_LENGTH = 1_000;

export function isVenueStatus(value: string): value is VenueStatus {
  return venueStatusSet.has(value);
}

function normalizedReason(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

export function validateVenueTransitionInput(
  targetStatus: string,
  rejectionReason: string | null,
): VenueTransitionValidation {
  if (!isVenueStatus(targetStatus)) {
    return { ok: false, error: "unknown_status" };
  }

  const reason = normalizedReason(rejectionReason);
  if (targetStatus === "rejected") {
    if (reason === null) {
      return { ok: false, error: "rejection_reason_required" };
    }
    if (reason.length > MAX_REJECTION_REASON_LENGTH) {
      return { ok: false, error: "rejection_reason_too_long" };
    }
    return { ok: true, status: targetStatus, rejectionReason: reason };
  }

  if (reason !== null) {
    return { ok: false, error: "rejection_reason_not_allowed" };
  }

  return { ok: true, status: targetStatus, rejectionReason: null };
}

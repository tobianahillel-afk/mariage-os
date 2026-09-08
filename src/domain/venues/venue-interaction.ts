import { normalizeFactInstant } from "@domain/facts/fact-observation";
import {
  normalizeCommercialRequiredText,
} from "./venue-commercial-values";

export interface VenueInteractionDraft {
  readonly interactionType: unknown;
  readonly occurredAt: unknown;
  readonly summary: unknown;
  readonly nextFollowUpAt: unknown;
}

export interface NormalizedVenueInteractionDraft {
  readonly interactionType: string;
  readonly occurredAt: string;
  readonly summary: string;
  readonly nextFollowUpAt: string | null;
}

export interface VenueInteractionRecord extends NormalizedVenueInteractionDraft {
  readonly id: string;
  readonly projectId: string;
  readonly parentType: "venue";
  readonly venueId: string;
  readonly contactId: string | null;
  readonly sourceId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly revision: number;
}

export type VenueInteractionValidationError =
  | "invalid_interaction_type"
  | "invalid_occurred_at"
  | "invalid_summary"
  | "invalid_next_follow_up_at";

export type VenueInteractionValidationResult =
  | { readonly ok: true; readonly value: NormalizedVenueInteractionDraft }
  | { readonly ok: false; readonly error: VenueInteractionValidationError };

type VenueInteractionPayload = Pick<
  VenueInteractionRecord,
  | "projectId"
  | "venueId"
  | "contactId"
  | "interactionType"
  | "occurredAt"
  | "summary"
  | "nextFollowUpAt"
  | "sourceId"
>;

const VENUE_INTERACTION_PAYLOAD_KEYS: readonly (keyof VenueInteractionPayload)[] = [
  "projectId",
  "venueId",
  "contactId",
  "interactionType",
  "occurredAt",
  "summary",
  "nextFollowUpAt",
  "sourceId",
];

function requiredText(value: unknown, maximum: number): string | null {
  return typeof value === "string"
    ? normalizeCommercialRequiredText(value, maximum)
    : null;
}

function optionalInstant(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  const normalized = normalizeFactInstant(value);
  return normalized === null ? undefined : normalized;
}

export function normalizeVenueInteraction(
  draft: VenueInteractionDraft,
): VenueInteractionValidationResult {
  const interactionType = requiredText(draft.interactionType, 80);
  if (interactionType === null) {
    return { ok: false, error: "invalid_interaction_type" };
  }

  const occurredAt = normalizeFactInstant(draft.occurredAt);
  if (occurredAt === null) {
    return { ok: false, error: "invalid_occurred_at" };
  }

  const summary = requiredText(draft.summary, 5_000);
  if (summary === null) {
    return { ok: false, error: "invalid_summary" };
  }

  const nextFollowUpAt = optionalInstant(draft.nextFollowUpAt);
  if (nextFollowUpAt === undefined) {
    return { ok: false, error: "invalid_next_follow_up_at" };
  }

  return {
    ok: true,
    value: { interactionType, occurredAt, summary, nextFollowUpAt },
  };
}

export function venueInteractionPayloadEquals(
  left: VenueInteractionPayload,
  right: VenueInteractionPayload,
): boolean {
  return VENUE_INTERACTION_PAYLOAD_KEYS.every(
    (key) => left[key] === right[key],
  );
}

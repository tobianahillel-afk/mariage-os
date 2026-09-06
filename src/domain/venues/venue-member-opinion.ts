export const venueRatingDimensions = [
  "love_score",
  "interior_aesthetic_score_personal",
  "exterior_aesthetic_score_personal",
  "logistics_score_personal",
  "value_for_money_score_personal",
] as const;

export type VenueRatingDimension = (typeof venueRatingDimensions)[number];

export function isVenueRatingDimension(
  value: string,
): value is VenueRatingDimension {
  return (venueRatingDimensions as readonly string[]).includes(value);
}

export interface VenueMemberPreferenceDraft {
  readonly favorite: boolean;
  readonly personalNote?: string | null;
  readonly expectedRevision: number;
}

export interface VenueMemberRatingDraft {
  readonly dimensionKey: string;
  readonly rating: number;
  readonly expectedRevision: number;
}

export type VenueMemberPreferenceError =
  | "personal_note_too_long"
  | "expected_revision_invalid";

export type VenueMemberRatingError =
  | "rating_dimension_invalid"
  | "rating_invalid"
  | "expected_revision_invalid";

export type NormalizedVenueMemberPreference =
  | {
      readonly ok: true;
      readonly value: {
        readonly favorite: boolean;
        readonly personalNote: string | null;
        readonly expectedRevision: number;
      };
    }
  | { readonly ok: false; readonly error: VenueMemberPreferenceError };

export type NormalizedVenueMemberRating =
  | {
      readonly ok: true;
      readonly value: {
        readonly dimensionKey: VenueRatingDimension;
        readonly rating: number;
        readonly expectedRevision: number;
      };
    }
  | { readonly ok: false; readonly error: VenueMemberRatingError };

function validOpinionRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;
}

export function normalizeVenueMemberPreference(
  draft: VenueMemberPreferenceDraft,
): NormalizedVenueMemberPreference {
  if (!validOpinionRevision(draft.expectedRevision)) {
    return { ok: false, error: "expected_revision_invalid" };
  }

  const personalNote = draft.personalNote?.trim() ?? null;
  if (personalNote !== null && personalNote.length > 5_000) {
    return { ok: false, error: "personal_note_too_long" };
  }

  return {
    ok: true,
    value: {
      favorite: draft.favorite,
      personalNote: personalNote === "" ? null : personalNote,
      expectedRevision: draft.expectedRevision,
    },
  };
}

export function normalizeVenueMemberRating(
  draft: VenueMemberRatingDraft,
): NormalizedVenueMemberRating {
  if (!isVenueRatingDimension(draft.dimensionKey)) {
    return { ok: false, error: "rating_dimension_invalid" };
  }
  if (
    !Number.isFinite(draft.rating) ||
    draft.rating < 0 ||
    draft.rating > 10 ||
    !hasAtMostTwoDecimals(draft.rating)
  ) {
    return { ok: false, error: "rating_invalid" };
  }
  if (!validOpinionRevision(draft.expectedRevision)) {
    return { ok: false, error: "expected_revision_invalid" };
  }

  return {
    ok: true,
    value: {
      dimensionKey: draft.dimensionKey,
      rating: draft.rating,
      expectedRevision: draft.expectedRevision,
    },
  };
}

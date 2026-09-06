import {
  normalizeVenueMemberPreference,
  normalizeVenueMemberRating,
  type VenueMemberPreferenceDraft,
  type VenueMemberPreferenceError,
  type VenueMemberRatingDraft,
  type VenueMemberRatingError,
  type VenueRatingDimension,
} from "@domain/venues/venue-member-opinion";

export interface VenueMemberPreferenceRecord {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly venueId: string;
  readonly favorite: boolean;
  readonly personalNote: string | null;
  readonly revision: number;
}

export interface VenueMemberRatingRecord {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly venueId: string;
  readonly dimensionKey: VenueRatingDimension;
  readonly rating: number;
  readonly revision: number;
}

export interface SaveVenueMemberPreferenceInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly favorite: boolean;
  readonly personalNote: string | null;
  readonly expectedRevision: number;
}

export interface SaveVenueMemberRatingInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly dimensionKey: VenueRatingDimension;
  readonly rating: number;
  readonly expectedRevision: number;
}

export interface VenueMemberOpinionPort {
  getOwnVenuePreference(
    projectId: string,
    venueId: string,
  ): Promise<VenueMemberPreferenceRecord | null>;
  listVenueRatings(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueMemberRatingRecord[]>;
  saveVenuePreference(
    input: SaveVenueMemberPreferenceInput,
  ): Promise<VenueMemberPreferenceRecord>;
  saveVenueRating(
    input: SaveVenueMemberRatingInput,
  ): Promise<VenueMemberRatingRecord>;
}

export interface SaveVenuePreferenceDraft extends VenueMemberPreferenceDraft {
  readonly projectId: string;
  readonly venueId: string;
}

export interface SaveVenueRatingDraft extends VenueMemberRatingDraft {
  readonly projectId: string;
  readonly venueId: string;
}

type PreferenceMutationError = VenueMemberPreferenceError | "persistence_failed";
type RatingMutationError = VenueMemberRatingError | "persistence_failed";

export type PreferenceMutationResult =
  | { readonly ok: true; readonly preference: VenueMemberPreferenceRecord }
  | { readonly ok: false; readonly error: PreferenceMutationError };

export type RatingMutationResult =
  | { readonly ok: true; readonly rating: VenueMemberRatingRecord }
  | { readonly ok: false; readonly error: RatingMutationError };

export async function saveVenueMemberPreference(
  port: VenueMemberOpinionPort,
  draft: SaveVenuePreferenceDraft,
): Promise<PreferenceMutationResult> {
  const normalized = normalizeVenueMemberPreference(draft);
  if (!normalized.ok) return normalized;

  try {
    const preference = await port.saveVenuePreference({
      projectId: draft.projectId,
      venueId: draft.venueId,
      ...normalized.value,
    });
    return { ok: true, preference };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

export async function saveVenueMemberRating(
  port: VenueMemberOpinionPort,
  draft: SaveVenueRatingDraft,
): Promise<RatingMutationResult> {
  const normalized = normalizeVenueMemberRating(draft);
  if (!normalized.ok) return normalized;

  try {
    const rating = await port.saveVenueRating({
      projectId: draft.projectId,
      venueId: draft.venueId,
      ...normalized.value,
    });
    return { ok: true, rating };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

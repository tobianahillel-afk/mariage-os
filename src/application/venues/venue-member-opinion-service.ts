import { venueMemberOpinionPersistenceErrorCode } from "./venue-member-opinion-persistence-error";
import {
  normalizeVenueMemberPreference,
  normalizeVenueMemberRating,
  type VenueMemberPreferenceDraft,
  type VenueMemberPreferenceError,
  type VenueMemberRatingDraft,
  type VenueMemberRatingError,
  type VenueRatingDimension,
} from "@domain/venues/venue-member-opinion";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  readonly operationId: string;
  readonly deviceId: string;
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
  readonly operationId: string;
  readonly deviceId: string;
}

type PreferenceMutationError =
  VenueMemberPreferenceError | "persistence_failed";
type RatingMutationError =
  | VenueMemberRatingError
  | "operation_id_invalid"
  | "device_id_invalid"
  | "conflict"
  | "persistence_failed";

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

function validateRatingReplayIdentity(
  draft: SaveVenueRatingDraft,
): RatingMutationError | null {
  if (!UUID_PATTERN.test(draft.operationId)) return "operation_id_invalid";
  if (!UUID_PATTERN.test(draft.deviceId)) return "device_id_invalid";
  return null;
}

export async function saveVenueMemberRating(
  port: VenueMemberOpinionPort,
  draft: SaveVenueRatingDraft,
): Promise<RatingMutationResult> {
  const normalized = normalizeVenueMemberRating(draft);
  if (!normalized.ok) return normalized;

  const identityError = validateRatingReplayIdentity(draft);
  if (identityError !== null) return { ok: false, error: identityError };

  try {
    const rating = await port.saveVenueRating({
      projectId: draft.projectId,
      venueId: draft.venueId,
      operationId: draft.operationId,
      deviceId: draft.deviceId,
      ...normalized.value,
    });
    return { ok: true, rating };
  } catch (error) {
    return {
      ok: false,
      error:
        venueMemberOpinionPersistenceErrorCode(error) ?? "persistence_failed",
    };
  }
}

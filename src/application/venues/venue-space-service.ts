import {
  normalizeVenueSpaceDraft,
  type NormalizedVenueSpace,
  type VenueSpaceDraft,
  type VenueSpaceError,
} from "@domain/venues/venue-space";
import {
  validateExpectedVenueRevision,
  type VenueRevisionError,
} from "@domain/venues/venue-revision";

export interface VenueSpaceRecord extends NormalizedVenueSpace {
  readonly id: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly revision: number;
}

export interface CreateVenueSpaceInput extends NormalizedVenueSpace {
  readonly projectId: string;
  readonly venueId: string;
}

export interface UpdateVenueSpaceInput extends CreateVenueSpaceInput {
  readonly spaceId: string;
  readonly expectedRevision: number;
}

export interface VenueSpacePort {
  listVenueSpaces(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueSpaceRecord[]>;
  createVenueSpace(input: CreateVenueSpaceInput): Promise<VenueSpaceRecord>;
  updateVenueSpace(input: UpdateVenueSpaceInput): Promise<VenueSpaceRecord>;
}

export interface CreateVenueSpaceDraft extends VenueSpaceDraft {
  readonly projectId: string;
  readonly venueId: string;
}

export interface UpdateVenueSpaceDraft extends CreateVenueSpaceDraft {
  readonly spaceId: string;
  readonly expectedRevision: number;
}

type VenueSpaceMutationError =
  VenueSpaceError | VenueRevisionError | "persistence_failed";

export type VenueSpaceMutationResult =
  | { readonly ok: true; readonly space: VenueSpaceRecord }
  | { readonly ok: false; readonly error: VenueSpaceMutationError };

export async function createVenueSpace(
  port: VenueSpacePort,
  draft: CreateVenueSpaceDraft,
): Promise<VenueSpaceMutationResult> {
  const normalized = normalizeVenueSpaceDraft(draft);
  if (!normalized.ok) return normalized;

  try {
    const space = await port.createVenueSpace({
      projectId: draft.projectId,
      venueId: draft.venueId,
      ...normalized.value,
    });
    return { ok: true, space };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

export async function updateVenueSpace(
  port: VenueSpacePort,
  draft: UpdateVenueSpaceDraft,
): Promise<VenueSpaceMutationResult> {
  const normalized = normalizeVenueSpaceDraft(draft);
  if (!normalized.ok) return normalized;

  const revisionError = validateExpectedVenueRevision(draft.expectedRevision);
  if (revisionError !== null) return { ok: false, error: revisionError };

  try {
    const space = await port.updateVenueSpace({
      projectId: draft.projectId,
      venueId: draft.venueId,
      spaceId: draft.spaceId,
      expectedRevision: draft.expectedRevision,
      ...normalized.value,
    });
    return { ok: true, space };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

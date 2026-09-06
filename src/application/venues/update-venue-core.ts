import { validateExpectedVenueRevision } from "@domain/venues/venue-revision";
import type { VenueRevisionError } from "@domain/venues/venue-revision";
import { normalizeVenueQuickAdd } from "@domain/venues/venue-quick-add";
import type { VenueQuickAddError } from "@domain/venues/venue-quick-add";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "./venue-repository-port";

export interface UpdateVenueCoreDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly expectedRevision: number;
  readonly name: string;
  readonly code?: string | null;
  readonly websiteUrl?: string | null;
  readonly city?: string | null;
}

export type UpdateVenueCoreResult =
  | { readonly ok: true; readonly venue: VenueCoreRecord }
  | {
      readonly ok: false;
      readonly error: VenueQuickAddError | VenueRevisionError | "persistence_failed";
    };

export async function updateVenueCore(
  port: VenueRepositoryPort,
  draft: UpdateVenueCoreDraft,
): Promise<UpdateVenueCoreResult> {
  const normalized = normalizeVenueQuickAdd(draft);
  if (!normalized.ok) return normalized;

  const revisionError = validateExpectedVenueRevision(draft.expectedRevision);
  if (revisionError !== null) return { ok: false, error: revisionError };

  try {
    const venue = await port.updateVenueCore({
      projectId: draft.projectId,
      venueId: draft.venueId,
      expectedRevision: draft.expectedRevision,
      ...normalized.value,
    });
    return { ok: true, venue };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

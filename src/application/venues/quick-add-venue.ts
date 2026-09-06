import type {
  CreatedVenue,
  VenueCommandPort,
} from "@application/venues/venue-command-port";
import {
  normalizeVenueQuickAdd,
  type VenueQuickAddDraft,
  type VenueQuickAddError,
} from "@domain/venues/venue-quick-add";

export type QuickAddVenueResult =
  | { readonly ok: true; readonly venue: CreatedVenue }
  | {
      readonly ok: false;
      readonly error: VenueQuickAddError | "persistence_failed";
    };

export async function quickAddVenue(
  port: VenueCommandPort,
  projectId: string,
  draft: VenueQuickAddDraft,
): Promise<QuickAddVenueResult> {
  const normalized = normalizeVenueQuickAdd(draft);
  if (!normalized.ok) return normalized;

  try {
    const venue = await port.createVenue({ projectId, ...normalized.value });
    return { ok: true, venue };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

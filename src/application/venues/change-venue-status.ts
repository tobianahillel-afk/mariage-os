import type { VenueCommandPort } from "@application/venues/venue-command-port";
import { validateExpectedVenueRevision } from "@domain/venues/venue-revision";
import type { VenueRevisionError } from "@domain/venues/venue-revision";
import {
  validateVenueTransitionInput,
  type VenueTransitionError,
} from "@domain/venues/venue-status";

export interface ChangeVenueStatusInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly status: string;
  readonly rejectionReason: string | null;
  readonly expectedRevision: number;
}

export type ChangeVenueStatusResult =
  | { readonly ok: true; readonly revision: number }
  | {
      readonly ok: false;
      readonly error:
        | VenueTransitionError
        | VenueRevisionError
        | "persistence_failed";
    };

export async function changeVenueStatus(
  port: VenueCommandPort,
  input: ChangeVenueStatusInput,
): Promise<ChangeVenueStatusResult> {
  const validated = validateVenueTransitionInput(
    input.status,
    input.rejectionReason,
  );
  if (!validated.ok) return validated;

  const revisionError = validateExpectedVenueRevision(input.expectedRevision);
  if (revisionError !== null) return { ok: false, error: revisionError };

  try {
    const revision = await port.transitionVenue({
      projectId: input.projectId,
      venueId: input.venueId,
      status: validated.status,
      rejectionReason: validated.rejectionReason,
      expectedRevision: input.expectedRevision,
    });
    return { ok: true, revision };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

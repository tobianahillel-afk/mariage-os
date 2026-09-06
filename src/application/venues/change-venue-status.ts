import type { VenueCommandPort } from "@application/venues/venue-command-port";
import {
  validateVenueTransitionInput,
  type VenueTransitionError,
} from "@domain/venues/venue-status";

export interface ChangeVenueStatusInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly status: string;
  readonly rejectionReason: string | null;
  readonly operationId: string | null;
}

export type ChangeVenueStatusResult =
  | { readonly ok: true; readonly revision: number }
  | {
      readonly ok: false;
      readonly error: VenueTransitionError | "persistence_failed";
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

  try {
    const revision = await port.transitionVenue({
      projectId: input.projectId,
      venueId: input.venueId,
      status: validated.status,
      rejectionReason: validated.rejectionReason,
      operationId: input.operationId,
    });
    return { ok: true, revision };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

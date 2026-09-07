import type { CriterionFactSnapshot } from "@domain/facts/criterion-types";

export interface VenueCompatibilityInputs {
  readonly projectId: string;
  readonly venueId: string;
  readonly projectTargetGuestCount: number | null;
  readonly snapshots: readonly CriterionFactSnapshot[];
}

export interface VenueCompatibilityQueryPort {
  loadVenueCompatibilityInputs(
    projectId: string,
    venueId: string,
  ): Promise<VenueCompatibilityInputs | null>;
}

interface Ar006DiscoveryResult {
  readonly apiSuccess: boolean;
  readonly eventPageComplete: boolean;
  readonly discovery: { readonly pass: boolean };
}

interface Ar006ObservationResult {
  readonly pages: {
    readonly apiSuccess: boolean;
    readonly eventPageComplete: boolean;
  };
  readonly durableObject: {
    readonly apiSuccess: boolean;
    readonly eventPageComplete: boolean;
  };
  readonly evaluation: { readonly pass: boolean };
}

export function campaignPassed(
  invocations: ReadonlyArray<{
    readonly success: boolean;
    readonly status: number;
    readonly finalized: boolean;
  }>,
  markerPreflight: Ar006DiscoveryResult | null,
  discovery: Ar006DiscoveryResult | null,
  observation: Ar006ObservationResult | null,
  expectedCount: number,
): boolean;

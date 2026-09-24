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

interface Ar006CampaignVerdictInput {
  readonly invocations: ReadonlyArray<{
    readonly success: boolean;
    readonly status: number;
    readonly finalized: boolean;
  }>;
  readonly markerPreflight: Ar006DiscoveryResult | null;
  readonly discovery: Ar006DiscoveryResult | null;
  readonly observation: Ar006ObservationResult | null;
  readonly expectedCount: number;
}

export function campaignPassed(input: Ar006CampaignVerdictInput): boolean;

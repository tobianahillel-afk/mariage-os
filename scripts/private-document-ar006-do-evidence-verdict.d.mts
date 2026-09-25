interface Ar006QueryResult {
  readonly apiSuccess: boolean;
  readonly eventPageComplete: boolean;
}

interface Ar006MarkerPreflight {
  readonly ingress: Ar006QueryResult;
  readonly durableObject: Ar006QueryResult;
  readonly discovery: { readonly pass: boolean };
}

interface Ar006ObservationResult {
  readonly ingress: Ar006QueryResult;
  readonly durableObject: Ar006QueryResult;
  readonly evaluation: { readonly pass: boolean };
}

interface Ar006CampaignVerdictInput {
  readonly invocations: ReadonlyArray<{
    readonly success: boolean;
    readonly status: number;
    readonly finalized: boolean;
  }>;
  readonly markerPreflight: Ar006MarkerPreflight | null;
  readonly observation: Ar006ObservationResult | null;
  readonly expectedCount: number;
}

export function campaignPassed(input: Ar006CampaignVerdictInput): boolean;

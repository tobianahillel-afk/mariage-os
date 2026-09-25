export interface Ar006ProviderInvocationDiagnostic {
  readonly cpuTimeMs: number | null;
  readonly cpuBudgetMs: number;
  readonly outcome: string | null;
  readonly executionModel: string | null;
  readonly eventType: string | null;
  readonly statusCode: number | null;
  readonly durableObjectIdPresent: boolean;
  readonly scriptVersionId: string | null;
  readonly truncated: boolean;
}

export interface Ar006ScriptDiscoveryFailure {
  readonly code: string;
  readonly evidenceId: string | null;
  readonly surface?: string;
  readonly reasons?: ReadonlyArray<string>;
  readonly diagnostic?: Ar006ProviderInvocationDiagnostic | null;
}

export interface Ar006ScriptDiscovery {
  readonly ingressScriptName: string | null;
  readonly markerCount: number;
  readonly attributedInvocationCount: number;
  readonly failures: ReadonlyArray<Ar006ScriptDiscoveryFailure>;
  readonly pass: boolean;
}

export function discoverAr006SurfaceScripts(input: {
  readonly events: ReadonlyArray<unknown>;
  readonly expectedEvidenceIds: ReadonlyArray<string>;
  readonly ingressScriptName: string;
  readonly durableObjectScriptName: string;
  readonly ingressVersionId: string;
  readonly durableObjectVersionId: string;
}): Ar006ScriptDiscovery;

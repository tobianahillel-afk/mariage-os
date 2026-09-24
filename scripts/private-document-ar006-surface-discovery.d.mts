export interface Ar006ScriptDiscoveryFailure {
  readonly code: string;
  readonly evidenceId: string | null;
}

export interface Ar006ScriptDiscovery {
  readonly pagesScriptName: string | null;
  readonly markerCount: number;
  readonly failures: ReadonlyArray<Ar006ScriptDiscoveryFailure>;
  readonly pass: boolean;
}

export function discoverAr006SurfaceScripts(input: {
  readonly events: ReadonlyArray<unknown>;
  readonly expectedEvidenceIds: ReadonlyArray<string>;
  readonly durableObjectScriptName: string;
}): Ar006ScriptDiscovery;

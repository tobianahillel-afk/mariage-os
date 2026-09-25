export const INGRESS_CPU_BUDGET_MS: 10;
export const DURABLE_OBJECT_CPU_BUDGET_MS: 30000;
export const AR006_EVIDENCE_COUNT: 10;

export type Ar006EvidenceSurface = "worker-ingress" | "durable-object";

export interface Ar006SurfaceContract {
  readonly surface: Ar006EvidenceSurface;
  readonly scriptName: string;
  readonly executionModel: "stateless" | "durableObject";
  readonly cpuBudgetMs: number;
  readonly requireDurableObjectId: boolean;
  readonly expectedScriptVersionId: string | null;
}

export interface Ar006SurfaceMeasurement {
  readonly surface: Ar006EvidenceSurface;
  readonly evidenceId: string;
  readonly requestId: string;
  readonly applicationStatus: number;
  readonly providerStatusCode: number | null;
  readonly providerOutcome: string | null;
  readonly executionModel: string | null;
  readonly eventType: string | null;
  readonly durableObjectId: string | null;
  readonly scriptVersionId: string | null;
  readonly traceId: string | null;
  readonly cpuTimeMs: number | null;
  readonly cpuBudgetMs: number;
  readonly valid: boolean;
}

export interface Ar006SurfaceFailure {
  readonly code: string;
  readonly evidenceId: string | null;
  readonly surface: Ar006EvidenceSurface;
}

export interface Ar006SurfaceEvaluation {
  readonly measurements: ReadonlyArray<Ar006SurfaceMeasurement>;
  readonly failures: ReadonlyArray<Ar006SurfaceFailure>;
  readonly pass: boolean;
}

export interface Ar006TwoSurfaceEvaluation {
  readonly ingress: Ar006SurfaceEvaluation;
  readonly durableObject: Ar006SurfaceEvaluation;
  readonly exactEvidenceCount: boolean;
  readonly uniqueDurableObjects: boolean;
  readonly pass: boolean;
}

export function evaluateAr006Surface(
  events: ReadonlyArray<unknown>,
  expectedEvidenceIds: ReadonlyArray<string>,
  contract: Ar006SurfaceContract,
): Ar006SurfaceEvaluation;

export function evaluateAr006TwoSurfaceEvents(input: {
  readonly ingressEvents: ReadonlyArray<unknown>;
  readonly durableObjectEvents: ReadonlyArray<unknown>;
  readonly expectedEvidenceIds: ReadonlyArray<string>;
  readonly ingressScriptName: string;
  readonly durableObjectScriptName: string;
  readonly ingressVersionId?: string | null;
  readonly durableObjectVersionId: string;
}): Ar006TwoSurfaceEvaluation;

export const PAGES_CPU_BUDGET_MS: number;
export const DURABLE_OBJECT_CPU_BUDGET_MS: number;

export interface Ar006TwoSurfaceMeasurement {
  evidenceId: string;
  surface: "pages" | "durable-object";
  requestId: string;
  scriptName: string;
  executionModel: "stateless" | "durableObject";
  durableObjectId: string | null;
  cpuTimeMs: number;
  cpuBudgetMs: number;
  valid: boolean;
}

export interface Ar006TwoSurfaceEvaluation {
  measurements: Ar006TwoSurfaceMeasurement[];
  failures: Array<{
    code: string;
    evidenceId: string | null;
    surface: "pages" | "durable-object" | null;
  }>;
  pass: boolean;
}

export function evaluateAr006TwoSurfaceEvents(
  events: unknown[],
  expectedEvidenceIds: string[],
): Ar006TwoSurfaceEvaluation;

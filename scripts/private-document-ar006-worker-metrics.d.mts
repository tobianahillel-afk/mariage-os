export const CPU_BUDGET_MS: number;

export interface Ar006WorkerMeasurement {
  evidenceId: string;
  workerRequestId: string;
  applicationStatus: number;
  providerStatusCode: number | null;
  providerOutcome: string | null;
  cpuTimeMs: number | null;
  withinFreeCpuBudget: boolean;
  exceededCpu: boolean;
  valid: boolean;
}

export interface Ar006WorkerFailure {
  code:
    | "missing_marker"
    | "duplicate_marker"
    | "missing_invocation"
    | "duplicate_invocation"
    | "invalid_provider_measurement";
  evidenceId: string;
}

export function evaluateAr006WorkerEvents(
  events: unknown[],
  expectedEvidenceIds: string[],
  scriptName: string,
): {
  measurements: Ar006WorkerMeasurement[];
  failures: Ar006WorkerFailure[];
  pass: boolean;
};

export function observabilityEvents(payload: unknown): unknown[];
export function observabilityErrorCodes(payload: unknown): number[];

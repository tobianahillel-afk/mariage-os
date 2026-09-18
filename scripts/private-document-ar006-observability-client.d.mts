export interface Ar006ObservabilityResult {
  httpStatus: number;
  apiSuccess: boolean;
  providerErrorCodes: number[];
  events: unknown[];
  retryAfterMs: number | null;
}

export function retryAfterDelayMs(headers: Headers): number | null;

export function nextObservabilityDelayMs(
  result: Pick<Ar006ObservabilityResult, "httpStatus" | "retryAfterMs">,
  fallbackMs: number,
): number;

export function queryWorkersObservability(input: {
  accountId: string;
  workerName: string;
  token: string;
  timeframe: { from: number; to: number };
  queryId: string;
}): Promise<Ar006ObservabilityResult>;

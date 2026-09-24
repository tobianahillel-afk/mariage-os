export interface Ar006ObservabilityResult {
  httpStatus: number;
  apiSuccess: boolean;
  providerErrorCodes: number[];
  events: unknown[];
  totalEventCount: number | null;
  eventPageComplete: boolean;
  retryAfterMs: number | null;
}

export interface Ar006ObservabilityTokenVerification {
  httpStatus: number;
  apiSuccess: boolean;
  tokenActive: boolean;
  providerErrorCodes: number[];
}

export function verifyObservabilityAccountToken(input: {
  accountId: string;
  token: string;
}): Promise<Ar006ObservabilityTokenVerification>;

export function verifyObservabilityUserToken(input: {
  token: string;
}): Promise<Ar006ObservabilityTokenVerification>;

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

export function queryAr006MarkerObservability(input: {
  accountId: string;
  token: string;
  timeframe: { from: number; to: number };
  queryId: string;
}): Promise<Ar006ObservabilityResult>;

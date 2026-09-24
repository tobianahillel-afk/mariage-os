interface DeniedRequest {
  readonly routeUrl: URL;
  readonly label: string;
  readonly expectedStatus: number;
  readonly init?: RequestInit;
  readonly fetcher?: typeof fetch;
}

interface EventuallyDeniedRequest extends DeniedRequest {
  readonly transientStatus?: number;
  readonly maxAttempts?: number;
  readonly delayMs?: number;
  readonly waiter?: (milliseconds: number) => Promise<unknown>;
}

export function assertDenied(input: DeniedRequest): Promise<void>;
export function assertEventuallyDenied(
  input: EventuallyDeniedRequest,
): Promise<number>;

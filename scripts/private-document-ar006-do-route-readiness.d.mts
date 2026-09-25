export interface LifecycleRouteProbeInput {
  readonly routeUrl: string | URL;
  readonly token: string;
  readonly projectId: string;
  readonly documentId: string;
  readonly evidenceId?: string;
  readonly maxAttempts?: number;
  readonly delayMs?: number;
  readonly fetcher?: typeof fetch;
  readonly waiter?: (milliseconds: number) => Promise<unknown>;
}
export interface LifecycleRouteReadiness {
  readonly attempts: number;
  readonly statuses: number[];
}
export function probePrivateDocumentLifecycle(
  input: LifecycleRouteProbeInput,
): Promise<LifecycleRouteReadiness>;

export type MarkerReadiness =
  "ready" | "retry_marker" | "await_logs" | "blocked";

export type MarkerDiscovery = {
  pass: boolean;
  markerCount: number;
  attributedInvocationCount: number;
  failures: Array<{
    code: string;
    surface?: string;
    reasons?: string[];
  }>;
};

export function markerReadiness(
  queriesComplete: boolean,
  discovery: MarkerDiscovery,
): MarkerReadiness;

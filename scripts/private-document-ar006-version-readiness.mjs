const DELAYED_LOG_CODES = new Set([
  "missing_marker",
  "missing_provider_invocation",
]);

function isExpectedAttribution(discovery) {
  return (
    discovery.markerCount === 2 &&
    discovery.attributedInvocationCount === 2 &&
    discovery.failures.length === 0
  );
}

function isIngressVersionSkew(discovery) {
  if (
    discovery.markerCount !== 2 ||
    discovery.attributedInvocationCount !== 1 ||
    discovery.failures.length !== 1
  ) {
    return false;
  }
  const failure = discovery.failures[0];
  return (
    failure.code === "invalid_provider_invocation" &&
    failure.surface === "worker-ingress" &&
    failure.reasons?.length === 1 &&
    failure.reasons[0] === "script_version_mismatch"
  );
}

function awaitingPersistedLogs(discovery) {
  return (
    discovery.failures.length > 0 &&
    discovery.failures.every((failure) => DELAYED_LOG_CODES.has(failure.code))
  );
}

export function markerReadiness(queriesComplete, discovery) {
  if (!queriesComplete) return "await_logs";
  if (discovery.pass === true) {
    return isExpectedAttribution(discovery) ? "ready" : "blocked";
  }
  if (isIngressVersionSkew(discovery)) return "retry_marker";
  return awaitingPersistedLogs(discovery) ? "await_logs" : "blocked";
}

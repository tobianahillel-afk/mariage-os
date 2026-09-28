function invocationsPassed(invocations, expectedCount, expectedBytes) {
  const hashes = invocations.map((item) => item.sha256);
  return (
    invocations.length === expectedCount &&
    hashes.every(
      (hash) => typeof hash === "string" && /^[0-9a-f]{64}$/.test(hash),
    ) &&
    new Set(hashes).size === expectedCount &&
    invocations.every(
      (item) =>
        item.success &&
        item.status === 200 &&
        item.finalized === true &&
        item.sizeBytes === expectedBytes,
    )
  );
}

function queryPassed(query) {
  return (
    query !== null &&
    query !== undefined &&
    query.apiSuccess === true &&
    query.eventPageComplete === true
  );
}

function markerPreflightPassed(preflight) {
  return (
    preflight !== null &&
    preflight !== undefined &&
    queryPassed(preflight.ingress) &&
    queryPassed(preflight.durableObject) &&
    preflight.discovery.pass === true
  );
}

function observationPassed(observation) {
  return (
    observation !== null &&
    observation !== undefined &&
    queryPassed(observation.ingress) &&
    queryPassed(observation.durableObject) &&
    observation.evaluation.pass === true
  );
}

export function campaignPassed({
  invocations,
  markerPreflight,
  observation,
  expectedCount,
  expectedBytes,
}) {
  return (
    invocationsPassed(invocations, expectedCount, expectedBytes) &&
    markerPreflightPassed(markerPreflight) &&
    observationPassed(observation)
  );
}

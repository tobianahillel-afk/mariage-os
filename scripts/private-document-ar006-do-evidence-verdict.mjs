function invocationsPassed(invocations, expectedCount) {
  return (
    invocations.length === expectedCount &&
    invocations.every(
      (item) => item.success && item.status === 200 && item.finalized === true,
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
}) {
  return (
    invocationsPassed(invocations, expectedCount) &&
    markerPreflightPassed(markerPreflight) &&
    observationPassed(observation)
  );
}

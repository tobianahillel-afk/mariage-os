function invocationsPassed(invocations, expectedCount) {
  return (
    invocations.length === expectedCount &&
    invocations.every(
      (item) =>
        item.success && item.status === 200 && item.finalized === true,
    )
  );
}

function queryPassed(query) {
  if (query === null || query === undefined) return false;
  return query.apiSuccess === true && query.eventPageComplete === true;
}

function discoveryPassed(discovery) {
  if (discovery === null || discovery === undefined) return false;
  return queryPassed(discovery) && discovery.discovery.pass === true;
}

function observationPassed(observation) {
  if (observation === null || observation === undefined) return false;
  return (
    queryPassed(observation.pages) &&
    queryPassed(observation.durableObject) &&
    observation.evaluation.pass === true
  );
}

export function campaignPassed(
  invocations,
  discovery,
  observation,
  expectedCount,
) {
  return (
    invocationsPassed(invocations, expectedCount) &&
    discoveryPassed(discovery) &&
    observationPassed(observation)
  );
}

function invocationsPassed(invocations, expectedCount) {
  return (
    invocations.length === expectedCount &&
    invocations.every((item) => item.success && item.status === 200)
  );
}

function discoveryPassed(discovery) {
  return (
    discovery?.apiSuccess === true &&
    discovery?.eventPageComplete === true &&
    discovery?.discovery.pass === true
  );
}

function observationPassed(observation) {
  const pages = observation?.pages;
  const durableObject = observation?.durableObject;
  return (
    pages?.apiSuccess === true &&
    pages?.eventPageComplete === true &&
    durableObject?.apiSuccess === true &&
    durableObject?.eventPageComplete === true &&
    observation?.evaluation.pass === true
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

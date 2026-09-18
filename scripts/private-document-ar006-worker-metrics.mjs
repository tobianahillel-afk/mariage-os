const CPU_BUDGET_MS = 10;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function property(value, key) {
  return isRecord(value) ? value[key] : undefined;
}

function stringOrNull(value) {
  return typeof value === "string" ? value : null;
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function markerFields(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    if (!isRecord(parsed)) return null;
    return {
      event: parsed.event,
      evidenceId: stringOrNull(parsed.evidenceId),
      status: finiteNumber(parsed.status),
    };
  } catch {
    return null;
  }
}

function validMarker(marker) {
  if (marker === null) return false;
  if (marker.event !== "mariage-os.ar006.promotion") return false;
  if (marker.evidenceId === null || !UUID_PATTERN.test(marker.evidenceId)) {
    return false;
  }
  return marker.status !== null && Number.isInteger(marker.status);
}

function parseMarker(value) {
  const marker = markerFields(value);
  return validMarker(marker) ? marker : null;
}

function workerFields(event) {
  const workers = property(event, "$workers");
  return isRecord(workers) ? workers : null;
}

function metadataFields(event) {
  const metadata = property(event, "$metadata");
  return isRecord(metadata) ? metadata : null;
}

function markerRecords(events, expectedIds, scriptName) {
  const records = [];
  for (const event of events) {
    const workers = workerFields(event);
    const metadata = metadataFields(event);
    if (workers === null || metadata === null) continue;
    if (workers.scriptName !== scriptName) continue;
    const marker = parseMarker(metadata.message);
    if (marker === null || !expectedIds.has(marker.evidenceId)) continue;
    const requestId = stringOrNull(workers.requestId);
    if (requestId !== null) records.push({ ...marker, requestId });
  }
  return records;
}

function invocationRecord(events, scriptName, requestId) {
  const matches = [];
  for (const event of events) {
    const workers = workerFields(event);
    const metadata = metadataFields(event);
    if (workers === null || metadata === null) continue;
    if (workers.scriptName !== scriptName) continue;
    if (
      workers.requestId !== requestId ||
      metadata.type !== "cf-worker-event"
    ) {
      continue;
    }
    matches.push({
      cpuTimeMs: finiteNumber(workers.cpuTimeMs),
      statusCode: finiteNumber(metadata.statusCode),
      outcome: stringOrNull(workers.outcome),
    });
  }
  return matches;
}

function failure(code, evidenceId) {
  return { code, evidenceId };
}

function invalidMeasurement(marker, invocation) {
  const withinFreeCpuBudget =
    invocation.cpuTimeMs !== null &&
    invocation.cpuTimeMs >= 0 &&
    invocation.cpuTimeMs <= CPU_BUDGET_MS;
  const exceededCpu =
    invocation.outcome !== null && /exceeded?cpu/iu.test(invocation.outcome);
  const valid =
    marker.status === 200 &&
    invocation.statusCode === 200 &&
    invocation.cpuTimeMs !== null &&
    withinFreeCpuBudget &&
    !exceededCpu;
  return {
    evidenceId: marker.evidenceId,
    workerRequestId: marker.requestId,
    applicationStatus: marker.status,
    providerStatusCode: invocation.statusCode,
    providerOutcome: invocation.outcome,
    cpuTimeMs: invocation.cpuTimeMs,
    withinFreeCpuBudget,
    exceededCpu,
    valid,
  };
}

function evaluateExpectedEvidence(events, scriptName, markers, evidenceId) {
  const matchedMarkers = markers.filter(
    (marker) => marker.evidenceId === evidenceId,
  );
  if (matchedMarkers.length !== 1) {
    const code =
      matchedMarkers.length === 0 ? "missing_marker" : "duplicate_marker";
    return { measurement: null, failure: failure(code, evidenceId) };
  }
  const marker = matchedMarkers[0];
  const invocations = invocationRecord(events, scriptName, marker.requestId);
  if (invocations.length !== 1) {
    const code =
      invocations.length === 0 ? "missing_invocation" : "duplicate_invocation";
    return { measurement: null, failure: failure(code, evidenceId) };
  }
  const measurement = invalidMeasurement(marker, invocations[0]);
  return {
    measurement,
    failure: measurement.valid
      ? null
      : failure("invalid_provider_measurement", evidenceId),
  };
}

export function evaluateAr006WorkerEvents(
  events,
  expectedEvidenceIds,
  scriptName,
) {
  const expectedIds = new Set(expectedEvidenceIds);
  const markers = markerRecords(events, expectedIds, scriptName);
  const results = expectedEvidenceIds.map((evidenceId) =>
    evaluateExpectedEvidence(events, scriptName, markers, evidenceId),
  );
  const measurements = results.flatMap((result) =>
    result.measurement === null ? [] : [result.measurement],
  );
  const failures = results.flatMap((result) =>
    result.failure === null ? [] : [result.failure],
  );
  const pass =
    expectedIds.size === expectedEvidenceIds.length &&
    expectedIds.size > 0 &&
    measurements.length === expectedIds.size &&
    failures.length === 0 &&
    measurements.every((measurement) => measurement.valid);
  return { measurements, failures, pass };
}

export function observabilityEvents(payload) {
  if (!isRecord(payload) || !isRecord(payload.result)) return [];
  const events = payload.result.events;
  return isRecord(events) && Array.isArray(events.events) ? events.events : [];
}

export function observabilityErrorCodes(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.errors)) return [];
  return payload.errors.map((error) => {
    if (!isRecord(error) || !Number.isFinite(Number(error.code))) return null;
    return Number(error.code);
  });
}

export { CPU_BUDGET_MS };

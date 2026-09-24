export const PAGES_CPU_BUDGET_MS = 10;
export const DURABLE_OBJECT_CPU_BUDGET_MS = 30_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MARKER_EVENT = "mariage-os.ar006.promotion";

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function property(value, key) {
  return isRecord(value) ? value[key] : undefined;
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function workers(event) {
  const value = property(event, "$workers");
  return isRecord(value) ? value : null;
}

function metadata(event) {
  const value = property(event, "$metadata");
  return isRecord(value) ? value : null;
}

function eventRequestId(event) {
  const workerId = stringOrNull(property(workers(event), "requestId"));
  if (workerId !== null) return workerId;
  return stringOrNull(property(metadata(event), "requestId"));
}

function markerPayload(event) {
  const message = property(metadata(event), "message");
  if (typeof message !== "string") return null;
  try {
    const parsed = JSON.parse(message);
    if (!isRecord(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parsedMarker(event, scriptName, surface) {
  const worker = workers(event);
  if (worker === null || worker.scriptName !== scriptName) return null;
  const payload = markerPayload(event);
  if (payload === null || payload.event !== MARKER_EVENT) return null;
  if (payload.surface !== surface) return null;
  const evidenceId = stringOrNull(payload.evidenceId);
  const status = finiteNumber(payload.status);
  const requestId = eventRequestId(event);
  if (evidenceId === null || !UUID_PATTERN.test(evidenceId)) return null;
  if (status === null || !Number.isInteger(status)) return null;
  if (requestId === null) return null;
  return { evidenceId, requestId, status };
}

function providerStatus(event) {
  const direct = finiteNumber(property(metadata(event), "statusCode"));
  if (direct !== null) return direct;
  const invocation = property(workers(event), "event");
  const response = property(invocation, "response");
  return finiteNumber(property(response, "status"));
}

function invocationMeasurement(event, contract) {
  const worker = workers(event);
  const meta = metadata(event);
  if (worker === null || meta === null) return null;
  if (worker.scriptName !== contract.scriptName) return null;
  if (meta.type !== "cf-worker-event") return null;
  if (eventRequestId(event) !== contract.requestId) return null;

  const cpuTimeMs = finiteNumber(worker.cpuTimeMs);
  const outcome = stringOrNull(worker.outcome);
  const executionModel = stringOrNull(worker.executionModel);
  const eventType = stringOrNull(worker.eventType);
  const durableObjectId = stringOrNull(worker.durableObjectId);
  const statusCode = providerStatus(event);
  return {
    cpuTimeMs,
    outcome,
    executionModel,
    eventType,
    durableObjectId,
    statusCode,
    traceId: stringOrNull(worker.traceId),
  };
}

function validInvocation(marker, invocation, contract) {
  if (marker.status !== 200) return false;
  if (invocation.cpuTimeMs === null || invocation.cpuTimeMs < 0) return false;
  if (invocation.cpuTimeMs > contract.cpuBudgetMs) return false;
  if (invocation.outcome !== "ok") return false;
  if (invocation.executionModel !== contract.executionModel) return false;
  if (invocation.eventType !== "fetch") return false;
  if (invocation.statusCode !== null && invocation.statusCode !== 200) {
    return false;
  }
  if (contract.requireDurableObjectId && invocation.durableObjectId === null) {
    return false;
  }
  return true;
}

function failure(code, evidenceId, surface) {
  return { code, evidenceId, surface };
}

function markersFor(events, contract) {
  return events
    .map((event) => parsedMarker(event, contract.scriptName, contract.surface))
    .filter((marker) => marker !== null);
}

function evaluateEvidence(events, markers, contract, evidenceId) {
  const matched = markers.filter((marker) => marker.evidenceId === evidenceId);
  if (matched.length !== 1) {
    const code = matched.length === 0 ? "missing_marker" : "duplicate_marker";
    return { measurement: null, failure: failure(code, evidenceId, contract.surface) };
  }
  const marker = matched[0];
  const invocations = events
    .map((event) =>
      invocationMeasurement(event, {
        ...contract,
        requestId: marker.requestId,
      }),
    )
    .filter((invocation) => invocation !== null);
  if (invocations.length !== 1) {
    const code =
      invocations.length === 0 ? "missing_invocation" : "duplicate_invocation";
    return { measurement: null, failure: failure(code, evidenceId, contract.surface) };
  }
  const invocation = invocations[0];
  const valid = validInvocation(marker, invocation, contract);
  return {
    measurement: {
      surface: contract.surface,
      evidenceId,
      requestId: marker.requestId,
      applicationStatus: marker.status,
      providerStatusCode: invocation.statusCode,
      providerOutcome: invocation.outcome,
      executionModel: invocation.executionModel,
      eventType: invocation.eventType,
      durableObjectId: invocation.durableObjectId,
      traceId: invocation.traceId,
      cpuTimeMs: invocation.cpuTimeMs,
      cpuBudgetMs: contract.cpuBudgetMs,
      valid,
    },
    failure: valid
      ? null
      : failure("invalid_provider_measurement", evidenceId, contract.surface),
  };
}

function unexpectedMarkers(markers, expectedIds, surface) {
  return markers
    .filter((marker) => !expectedIds.has(marker.evidenceId))
    .map((marker) => failure("unexpected_marker", marker.evidenceId, surface));
}

export function evaluateAr006Surface(events, expectedEvidenceIds, contract) {
  const expectedIds = new Set(expectedEvidenceIds);
  const markers = markersFor(events, contract);
  const results = expectedEvidenceIds.map((evidenceId) =>
    evaluateEvidence(events, markers, contract, evidenceId),
  );
  const measurements = results.flatMap((result) =>
    result.measurement === null ? [] : [result.measurement],
  );
  const failures = [
    ...results.flatMap((result) =>
      result.failure === null ? [] : [result.failure],
    ),
    ...unexpectedMarkers(markers, expectedIds, contract.surface),
  ];
  const uniqueIds = expectedIds.size === expectedEvidenceIds.length;
  const pass =
    uniqueIds &&
    expectedIds.size > 0 &&
    measurements.length === expectedIds.size &&
    failures.length === 0 &&
    measurements.every((measurement) => measurement.valid);
  return { measurements, failures, pass };
}

export function evaluateAr006TwoSurfaceEvents({
  pagesEvents,
  durableObjectEvents,
  expectedEvidenceIds,
  pagesScriptName,
  durableObjectScriptName,
}) {
  const pages = evaluateAr006Surface(pagesEvents, expectedEvidenceIds, {
    surface: "pages-ingress",
    scriptName: pagesScriptName,
    executionModel: "stateless",
    cpuBudgetMs: PAGES_CPU_BUDGET_MS,
    requireDurableObjectId: false,
  });
  const durableObject = evaluateAr006Surface(
    durableObjectEvents,
    expectedEvidenceIds,
    {
      surface: "durable-object",
      scriptName: durableObjectScriptName,
      executionModel: "durableObject",
      cpuBudgetMs: DURABLE_OBJECT_CPU_BUDGET_MS,
      requireDurableObjectId: true,
    },
  );
  return {
    pages,
    durableObject,
    pass: pages.pass && durableObject.pass,
  };
}

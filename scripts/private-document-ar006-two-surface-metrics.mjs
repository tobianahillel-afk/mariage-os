export const INGRESS_CPU_BUDGET_MS = 10;
export const PAGES_CPU_BUDGET_MS = INGRESS_CPU_BUDGET_MS;
export const DURABLE_OBJECT_CPU_BUDGET_MS = 30_000;
export const AR006_EVIDENCE_COUNT = 10;

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
  const metadataId = stringOrNull(property(metadata(event), "requestId"));
  if (workerId !== null && metadataId !== null && workerId !== metadataId) {
    return null;
  }
  return workerId ?? metadataId;
}

function jsonRecord(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function markerPayload(event) {
  const source = property(event, "source");
  if (isRecord(source)) return source;
  const parsedSource = jsonRecord(source);
  if (parsedSource !== null) return parsedSource;
  return jsonRecord(property(metadata(event), "message"));
}

function scriptMatches(event, scriptName) {
  const worker = workers(event);
  return worker !== null && worker.scriptName === scriptName;
}

function markerMatches(payload, surface) {
  return (
    payload !== null &&
    payload.event === MARKER_EVENT &&
    payload.surface === surface
  );
}

function markerValuesValid(evidenceId, status, requestId) {
  return (
    evidenceId !== null &&
    UUID_PATTERN.test(evidenceId) &&
    status !== null &&
    Number.isInteger(status) &&
    requestId !== null
  );
}

function parsedMarker(event, scriptName, surface) {
  if (!scriptMatches(event, scriptName)) return null;
  const payload = markerPayload(event);
  if (!markerMatches(payload, surface)) return null;
  const evidenceId = stringOrNull(payload.evidenceId);
  const status = finiteNumber(payload.status);
  const requestId = eventRequestId(event);
  if (!markerValuesValid(evidenceId, status, requestId)) return null;
  return { evidenceId, requestId, status };
}

function providerStatus(event) {
  const direct = finiteNumber(property(metadata(event), "statusCode"));
  const invocation = property(workers(event), "event");
  const response = property(invocation, "response");
  const responseStatus = finiteNumber(property(response, "status"));
  if (direct !== null && responseStatus !== null && direct !== responseStatus) {
    return null;
  }
  return direct ?? responseStatus;
}

function scriptVersionId(event) {
  const version = property(workers(event), "scriptVersion");
  return stringOrNull(property(version, "id"));
}

function invocationMeasurement(event, contract) {
  const worker = workers(event);
  const meta = metadata(event);
  if (worker === null || meta === null) return null;
  if (worker.scriptName !== contract.scriptName) return null;
  if (meta.type !== "cf-worker-event") return null;
  if (eventRequestId(event) !== contract.requestId) return null;

  return {
    cpuTimeMs: finiteNumber(worker.cpuTimeMs),
    outcome: stringOrNull(worker.outcome),
    executionModel: stringOrNull(worker.executionModel),
    eventType: stringOrNull(worker.eventType),
    durableObjectId: stringOrNull(worker.durableObjectId),
    scriptVersionId: scriptVersionId(event),
    statusCode: providerStatus(event),
    traceId: stringOrNull(worker.traceId),
    truncated: worker.truncated === true,
  };
}

function validInvocation(marker, invocation, contract) {
  const scriptVersionAccepted =
    contract.expectedScriptVersionId === null ||
    invocation.scriptVersionId === contract.expectedScriptVersionId;
  const durableIdentityAccepted =
    !contract.requireDurableObjectId || invocation.durableObjectId !== null;
  return [
    marker.status === 200,
    invocation.cpuTimeMs !== null,
    invocation.cpuTimeMs >= 0,
    invocation.cpuTimeMs <= contract.cpuBudgetMs,
    invocation.outcome === "ok",
    invocation.executionModel === contract.executionModel,
    invocation.eventType === "fetch",
    invocation.statusCode === 200,
    durableIdentityAccepted,
    scriptVersionAccepted,
    invocation.truncated === false,
  ].every(Boolean);
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
    return {
      measurement: null,
      failure: failure(
        matched.length === 0 ? "missing_marker" : "duplicate_marker",
        evidenceId,
        contract.surface,
      ),
    };
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
    return {
      measurement: null,
      failure: failure(
        invocations.length === 0
          ? "missing_invocation"
          : "duplicate_invocation",
        evidenceId,
        contract.surface,
      ),
    };
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
      scriptVersionId: invocation.scriptVersionId,
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
  const pass =
    expectedIds.size === expectedEvidenceIds.length &&
    expectedIds.size > 0 &&
    measurements.length === expectedIds.size &&
    failures.length === 0 &&
    measurements.every((measurement) => measurement.valid);
  return { measurements, failures, pass };
}

function distinctDurableObjects(evaluation) {
  const ids = evaluation.measurements
    .map((measurement) => measurement.durableObjectId)
    .filter((value) => value !== null);
  return (
    ids.length === AR006_EVIDENCE_COUNT &&
    new Set(ids).size === AR006_EVIDENCE_COUNT
  );
}

export function evaluateAr006TwoSurfaceEvents({
  ingressEvents,
  durableObjectEvents,
  expectedEvidenceIds,
  ingressScriptName,
  durableObjectScriptName,
  ingressVersionId = null,
  durableObjectVersionId,
}) {
  const ingress = evaluateAr006Surface(ingressEvents, expectedEvidenceIds, {
    surface: "worker-ingress",
    scriptName: ingressScriptName,
    executionModel: "stateless",
    cpuBudgetMs: INGRESS_CPU_BUDGET_MS,
    requireDurableObjectId: false,
    expectedScriptVersionId: ingressVersionId,
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
      expectedScriptVersionId: durableObjectVersionId,
    },
  );
  const exactEvidenceCount =
    expectedEvidenceIds.length === AR006_EVIDENCE_COUNT;
  const uniqueDurableObjects = distinctDurableObjects(durableObject);
  return {
    ingress,
    durableObject,
    exactEvidenceCount,
    uniqueDurableObjects,
    pass:
      exactEvidenceCount &&
      uniqueDurableObjects &&
      ingress.pass &&
      durableObject.pass,
  };
}

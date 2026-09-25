const MARKER_EVENT = "mariage-os.ar006.promotion";
const INGRESS_CPU_BUDGET_MS = 10;
const DURABLE_OBJECT_CPU_BUDGET_MS = 30_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

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

function validEvidenceId(value) {
  return value !== null && UUID_PATTERN.test(value);
}

function validSurface(value) {
  return (
    value === "worker-ingress" ||
    value === "pages-ingress" ||
    value === "durable-object"
  );
}

function normalizedMarker(payload, worker, event) {
  const evidenceId = stringOrNull(payload.evidenceId);
  const surface = stringOrNull(payload.surface);
  const scriptName = stringOrNull(worker.scriptName);
  const status = Number.isInteger(payload.status) ? payload.status : null;
  if (!validEvidenceId(evidenceId) || !validSurface(surface)) return null;
  if (scriptName === null || status === null) return null;
  return {
    evidenceId,
    surface,
    scriptName,
    status,
    requestId: eventRequestId(event),
  };
}

function markerRecord(event) {
  const payload = markerPayload(event);
  if (!isRecord(payload) || payload.event !== MARKER_EVENT) return null;
  const worker = workers(event);
  if (worker === null) return null;
  return normalizedMarker(payload, worker, event);
}

function isMarkerCandidate(event) {
  const payload = markerPayload(event);
  return isRecord(payload) && payload.event === MARKER_EVENT;
}

function failure(code, evidenceId = null) {
  return { code, evidenceId };
}

function expectedMarker(markers, evidenceId, surface) {
  return markers.filter(
    (marker) => marker.evidenceId === evidenceId && marker.surface === surface,
  );
}

function surfaceScripts(markers, expectedIds, surface) {
  const failures = [];
  const scripts = [];
  for (const evidenceId of expectedIds) {
    const matched = expectedMarker(markers, evidenceId, surface);
    if (matched.length !== 1) {
      failures.push(
        failure(
          matched.length === 0 ? "missing_marker" : "duplicate_marker",
          evidenceId,
        ),
      );
      continue;
    }
    scripts.push(matched[0].scriptName);
  }
  return { failures, scripts };
}

function unexpectedMarkers(markers, expectedIds) {
  const expected = new Set(expectedIds);
  return markers
    .filter((marker) => !expected.has(marker.evidenceId))
    .map((marker) => failure("unexpected_marker", marker.evidenceId));
}

function campaignShapeFailures(events, markers, expectedEvidenceIds) {
  const failures = unexpectedMarkers(markers, expectedEvidenceIds);
  const candidateCount = events.filter(isMarkerCandidate).length;
  if (candidateCount !== markers.length) {
    failures.push(failure("malformed_marker_event"));
  }
  if (new Set(expectedEvidenceIds).size !== expectedEvidenceIds.length) {
    failures.push(failure("duplicate_expected_id"));
  }
  return failures;
}

function providerStatus(event) {
  const direct = finiteNumber(property(metadata(event), "statusCode"));
  const response = property(property(workers(event), "event"), "response");
  const nested = finiteNumber(property(response, "status"));
  if (direct !== null && nested !== null && direct !== nested) return null;
  return direct ?? nested;
}

function invocationRecord(event, scriptName, requestId) {
  const worker = workers(event);
  const meta = metadata(event);
  if (worker === null || meta === null || meta.type !== "cf-worker-event") {
    return null;
  }
  if (worker.scriptName !== scriptName || eventRequestId(event) !== requestId) {
    return null;
  }
  return {
    cpuTimeMs: finiteNumber(worker.cpuTimeMs),
    outcome: stringOrNull(worker.outcome),
    executionModel: stringOrNull(worker.executionModel),
    eventType: stringOrNull(worker.eventType),
    durableObjectId: stringOrNull(worker.durableObjectId),
    statusCode: providerStatus(event),
    truncated: worker.truncated === true,
  };
}

function invocationValid(invocation, marker, contract) {
  return (
    invocation.cpuTimeMs !== null &&
    invocation.cpuTimeMs >= 0 &&
    invocation.cpuTimeMs <= contract.cpuBudgetMs &&
    invocation.outcome === "ok" &&
    invocation.executionModel === contract.executionModel &&
    invocation.eventType === "fetch" &&
    invocation.statusCode === marker.status &&
    (!contract.requireDurableObjectId || invocation.durableObjectId !== null) &&
    invocation.truncated === false
  );
}

function attributionForMarker(events, marker, contract) {
  if (marker.requestId === null) {
    return { attributed: false, failure: "missing_marker_request_id" };
  }
  const invocations = events
    .map((event) =>
      invocationRecord(event, contract.scriptName, marker.requestId),
    )
    .filter((value) => value !== null);
  if (invocations.length !== 1) {
    return {
      attributed: false,
      failure:
        invocations.length === 0
          ? "missing_provider_invocation"
          : "duplicate_provider_invocation",
    };
  }
  return invocationValid(invocations[0], marker, contract)
    ? { attributed: true, failure: null }
    : { attributed: false, failure: "invalid_provider_invocation" };
}

function attributionFailures(events, markers, expectedIds, contract) {
  const failures = [];
  let attributedInvocationCount = 0;
  for (const evidenceId of expectedIds) {
    const matched = expectedMarker(markers, evidenceId, contract.surface);
    if (matched.length !== 1) continue;
    const result = attributionForMarker(events, matched[0], contract);
    if (result.attributed) {
      attributedInvocationCount += 1;
    } else {
      failures.push(failure(result.failure, evidenceId));
    }
  }
  return { failures, attributedInvocationCount };
}

function scriptIdentityFailures(
  ingressNames,
  durableNames,
  expectedIngress,
  expectedDurable,
) {
  const failures = [];
  if (ingressNames.size !== 1 || !ingressNames.has(expectedIngress)) {
    failures.push(failure("unexpected_ingress_script"));
  }
  if (durableNames.size !== 1 || !durableNames.has(expectedDurable)) {
    failures.push(failure("unexpected_durable_object_script"));
  }
  return failures;
}

export function discoverAr006SurfaceScripts({
  events,
  expectedEvidenceIds,
  ingressScriptName,
  durableObjectScriptName,
}) {
  const markers = events.map(markerRecord).filter((marker) => marker !== null);
  const ingress = surfaceScripts(markers, expectedEvidenceIds, "worker-ingress");
  const durable = surfaceScripts(markers, expectedEvidenceIds, "durable-object");
  const ingressAttribution = attributionFailures(
    events,
    markers,
    expectedEvidenceIds,
    {
      surface: "worker-ingress",
      scriptName: ingressScriptName,
      executionModel: "stateless",
      cpuBudgetMs: INGRESS_CPU_BUDGET_MS,
      requireDurableObjectId: false,
    },
  );
  const durableAttribution = attributionFailures(
    events,
    markers,
    expectedEvidenceIds,
    {
      surface: "durable-object",
      scriptName: durableObjectScriptName,
      executionModel: "durableObject",
      cpuBudgetMs: DURABLE_OBJECT_CPU_BUDGET_MS,
      requireDurableObjectId: true,
    },
  );
  const failures = [
    ...ingress.failures,
    ...durable.failures,
    ...campaignShapeFailures(events, markers, expectedEvidenceIds),
    ...scriptIdentityFailures(
      new Set(ingress.scripts),
      new Set(durable.scripts),
      ingressScriptName,
      durableObjectScriptName,
    ),
    ...ingressAttribution.failures,
    ...durableAttribution.failures,
  ];
  const attributedInvocationCount =
    ingressAttribution.attributedInvocationCount +
    durableAttribution.attributedInvocationCount;
  return {
    ingressScriptName: failures.length === 0 ? ingressScriptName : null,
    markerCount: markers.length,
    attributedInvocationCount,
    failures,
    pass:
      failures.length === 0 &&
      markers.length === expectedEvidenceIds.length * 2 &&
      attributedInvocationCount === expectedEvidenceIds.length * 2,
  };
}

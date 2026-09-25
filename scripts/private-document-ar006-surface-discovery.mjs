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

function failure(code, evidenceId = null, details = null) {
  return details === null
    ? { code, evidenceId }
    : { code, evidenceId, ...details };
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

function scriptVersionId(event) {
  const version = property(workers(event), "scriptVersion");
  return stringOrNull(property(version, "id"));
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
    scriptVersionId: scriptVersionId(event),
    statusCode: providerStatus(event),
    truncated: worker.truncated === true,
  };
}

function cpuValidationReasons(invocation, contract) {
  if (invocation.cpuTimeMs === null) return ["missing_cpu_time"];
  const reasons = [];
  if (invocation.cpuTimeMs < 0) reasons.push("negative_cpu_time");
  if (invocation.cpuTimeMs > contract.cpuBudgetMs) {
    reasons.push("cpu_over_budget");
  }
  return reasons;
}

function eventValidationReasons(invocation, contract) {
  const reasons = [];
  if (invocation.outcome !== "ok") reasons.push("unexpected_outcome");
  if (invocation.executionModel !== contract.executionModel) {
    reasons.push("unexpected_execution_model");
  }
  if (invocation.eventType !== "fetch") reasons.push("unexpected_event_type");
  return reasons;
}

function statusValidationReasons(invocation, marker) {
  if (invocation.statusCode === null) return ["missing_provider_status"];
  return invocation.statusCode === marker.status
    ? []
    : ["provider_status_mismatch"];
}

function identityValidationReasons(invocation, contract) {
  const reasons = [];
  if (contract.requireDurableObjectId && invocation.durableObjectId === null) {
    reasons.push("missing_durable_object_id");
  }
  if (invocation.scriptVersionId === null) {
    reasons.push("missing_script_version");
  } else if (invocation.scriptVersionId !== contract.expectedScriptVersionId) {
    reasons.push("script_version_mismatch");
  }
  return reasons;
}

function providerValidationReasons(invocation, marker, contract) {
  return [
    ...eventValidationReasons(invocation, contract),
    ...statusValidationReasons(invocation, marker),
    ...identityValidationReasons(invocation, contract),
    ...(invocation.truncated ? ["truncated_provider_event"] : []),
  ];
}

function invocationValidationReasons(invocation, marker, contract) {
  return [
    ...cpuValidationReasons(invocation, contract),
    ...providerValidationReasons(invocation, marker, contract),
  ];
}

function safeInvocationDiagnostic(invocation, contract) {
  return {
    cpuTimeMs: invocation.cpuTimeMs,
    cpuBudgetMs: contract.cpuBudgetMs,
    outcome: invocation.outcome,
    executionModel: invocation.executionModel,
    eventType: invocation.eventType,
    statusCode: invocation.statusCode,
    durableObjectIdPresent: invocation.durableObjectId !== null,
    scriptVersionId: invocation.scriptVersionId,
    truncated: invocation.truncated,
  };
}

function attributionForMarker(events, marker, contract) {
  if (marker.requestId === null) {
    return {
      attributed: false,
      failure: "missing_marker_request_id",
      reasons: [],
      diagnostic: null,
    };
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
      reasons: [],
      diagnostic: null,
    };
  }
  const invocation = invocations[0];
  const reasons = invocationValidationReasons(invocation, marker, contract);
  if (reasons.length === 0) {
    return { attributed: true, failure: null, reasons, diagnostic: null };
  }
  return {
    attributed: false,
    failure: "invalid_provider_invocation",
    reasons,
    diagnostic: safeInvocationDiagnostic(invocation, contract),
  };
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
      failures.push(
        failure(result.failure, evidenceId, {
          surface: contract.surface,
          reasons: result.reasons,
          diagnostic: result.diagnostic,
        }),
      );
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

function surfaceAttributions(input, markers) {
  const ingress = attributionFailures(
    input.events,
    markers,
    input.expectedEvidenceIds,
    {
      surface: "worker-ingress",
      scriptName: input.ingressScriptName,
      executionModel: "stateless",
      cpuBudgetMs: INGRESS_CPU_BUDGET_MS,
      requireDurableObjectId: false,
      expectedScriptVersionId: input.ingressVersionId,
    },
  );
  const durableObject = attributionFailures(
    input.events,
    markers,
    input.expectedEvidenceIds,
    {
      surface: "durable-object",
      scriptName: input.durableObjectScriptName,
      executionModel: "durableObject",
      cpuBudgetMs: DURABLE_OBJECT_CPU_BUDGET_MS,
      requireDurableObjectId: true,
      expectedScriptVersionId: input.durableObjectVersionId,
    },
  );
  return { ingress, durableObject };
}

function discoveryFailures(input, state) {
  return [
    ...state.ingress.failures,
    ...state.durable.failures,
    ...campaignShapeFailures(
      input.events,
      state.markers,
      input.expectedEvidenceIds,
    ),
    ...scriptIdentityFailures(
      new Set(state.ingress.scripts),
      new Set(state.durable.scripts),
      input.ingressScriptName,
      input.durableObjectScriptName,
    ),
    ...state.attribution.ingress.failures,
    ...state.attribution.durableObject.failures,
  ];
}

export function discoverAr006SurfaceScripts(input) {
  const markers = input.events
    .map(markerRecord)
    .filter((marker) => marker !== null);
  const ingress = surfaceScripts(
    markers,
    input.expectedEvidenceIds,
    "worker-ingress",
  );
  const durable = surfaceScripts(
    markers,
    input.expectedEvidenceIds,
    "durable-object",
  );
  const attribution = surfaceAttributions(input, markers);
  const failures = discoveryFailures(input, {
    markers,
    ingress,
    durable,
    attribution,
  });
  const attributedInvocationCount =
    attribution.ingress.attributedInvocationCount +
    attribution.durableObject.attributedInvocationCount;
  const expectedCount = input.expectedEvidenceIds.length * 2;
  return {
    ingressScriptName: failures.length === 0 ? input.ingressScriptName : null,
    markerCount: markers.length,
    attributedInvocationCount,
    failures,
    pass:
      failures.length === 0 &&
      markers.length === expectedCount &&
      attributedInvocationCount === expectedCount,
  };
}

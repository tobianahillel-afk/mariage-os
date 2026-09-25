const MARKER_EVENT = "mariage-os.ar006.promotion";
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
  const metadata = property(event, "$metadata");
  return jsonRecord(property(metadata, "message"));
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

function normalizedMarker(payload, workers) {
  const evidenceId = stringOrNull(payload.evidenceId);
  const surface = stringOrNull(payload.surface);
  const scriptName = stringOrNull(workers.scriptName);
  const status = Number.isInteger(payload.status) ? payload.status : null;
  if (!validEvidenceId(evidenceId)) return null;
  if (!validSurface(surface)) return null;
  if (scriptName === null || status === null) return null;
  return { evidenceId, surface, scriptName, status };
}

function markerRecord(event) {
  const payload = markerPayload(event);
  if (!isRecord(payload) || payload.event !== MARKER_EVENT) return null;
  const workers = property(event, "$workers");
  if (!isRecord(workers)) return null;
  return normalizedMarker(payload, workers);
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

function durableScriptMatches(durableNames, expectedName) {
  return durableNames.size === 1 && durableNames.has(expectedName);
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
  if (!durableScriptMatches(durableNames, expectedDurable)) {
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
  const ingress = surfaceScripts(
    markers,
    expectedEvidenceIds,
    "worker-ingress",
  );
  const durable = surfaceScripts(
    markers,
    expectedEvidenceIds,
    "durable-object",
  );
  const ingressNames = new Set(ingress.scripts);
  const durableNames = new Set(durable.scripts);
  const failures = [
    ...ingress.failures,
    ...durable.failures,
    ...campaignShapeFailures(events, markers, expectedEvidenceIds),
    ...scriptIdentityFailures(
      ingressNames,
      durableNames,
      ingressScriptName,
      durableObjectScriptName,
    ),
  ];
  return {
    ingressScriptName: failures.length === 0 ? ingressScriptName : null,
    markerCount: markers.length,
    failures,
    pass:
      failures.length === 0 &&
      markers.length === expectedEvidenceIds.length * 2,
  };
}

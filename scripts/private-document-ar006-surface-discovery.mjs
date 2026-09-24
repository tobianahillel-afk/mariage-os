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

function markerPayload(event) {
  const metadata = property(event, "$metadata");
  const message = property(metadata, "message");
  if (typeof message !== "string") return null;
  try {
    const parsed = JSON.parse(message);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function markerRecord(event) {
  const payload = markerPayload(event);
  const workers = property(event, "$workers");
  if (!isRecord(payload) || !isRecord(workers)) return null;
  if (payload.event !== MARKER_EVENT) return null;
  const evidenceId = stringOrNull(payload.evidenceId);
  const surface = stringOrNull(payload.surface);
  const scriptName = stringOrNull(workers.scriptName);
  const status = Number.isInteger(payload.status) ? payload.status : null;
  if (
    evidenceId === null ||
    !UUID_PATTERN.test(evidenceId) ||
    scriptName === null ||
    status === null
  ) {
    return null;
  }
  if (surface !== "pages-ingress" && surface !== "durable-object") return null;
  return { evidenceId, surface, scriptName, status };
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

export function discoverAr006SurfaceScripts({
  events,
  expectedEvidenceIds,
  durableObjectScriptName,
}) {
  const markers = events.map(markerRecord).filter((marker) => marker !== null);
  const malformedCount = events.length - markers.length;
  const uniqueIds = new Set(expectedEvidenceIds);
  const pages = surfaceScripts(markers, expectedEvidenceIds, "pages-ingress");
  const durable = surfaceScripts(
    markers,
    expectedEvidenceIds,
    "durable-object",
  );
  const failures = [
    ...pages.failures,
    ...durable.failures,
    ...unexpectedMarkers(markers, expectedEvidenceIds),
  ];
  if (malformedCount > 0) failures.push(failure("unparseable_marker_event"));
  if (uniqueIds.size !== expectedEvidenceIds.length) {
    failures.push(failure("duplicate_expected_id"));
  }

  const pageNames = new Set(pages.scripts);
  const durableNames = new Set(durable.scripts);
  if (pageNames.size !== 1) failures.push(failure("ambiguous_pages_script"));
  if (durableNames.size !== 1 || !durableNames.has(durableObjectScriptName)) {
    failures.push(failure("unexpected_durable_object_script"));
  }

  const pagesScriptName =
    failures.length === 0 ? ([...pageNames][0] ?? null) : null;
  return {
    pagesScriptName,
    markerCount: markers.length,
    failures,
    pass:
      failures.length === 0 &&
      pagesScriptName !== null &&
      markers.length === expectedEvidenceIds.length * 2,
  };
}

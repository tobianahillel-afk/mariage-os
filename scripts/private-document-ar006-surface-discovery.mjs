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

function validEvidenceId(value) {
  if (value === null) return false;
  return UUID_PATTERN.test(value);
}

function validSurface(value) {
  return value === "pages-ingress" || value === "durable-object";
}

function normalizedMarker(payload, workers) {
  const evidenceId = stringOrNull(payload.evidenceId);
  const surface = stringOrNull(payload.surface);
  const scriptName = stringOrNull(workers.scriptName);
  const status = Number.isInteger(payload.status) ? payload.status : null;
  if (!validEvidenceId(evidenceId)) return null;
  if (!validSurface(surface)) return null;
  if (scriptName === null) return null;
  if (status === null) return null;
  return { evidenceId, surface, scriptName, status };
}

function markerRecord(event) {
  const payload = markerPayload(event);
  if (!isRecord(payload)) return null;
  if (payload.event !== MARKER_EVENT) return null;
  const workers = property(event, "$workers");
  if (!isRecord(workers)) return null;
  return normalizedMarker(payload, workers);
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
  if (events.length !== markers.length) {
    failures.push(failure("unparseable_marker_event"));
  }
  if (new Set(expectedEvidenceIds).size !== expectedEvidenceIds.length) {
    failures.push(failure("duplicate_expected_id"));
  }
  return failures;
}

function durableScriptMatches(durableNames, expectedName) {
  if (durableNames.size !== 1) return false;
  return durableNames.has(expectedName);
}

function scriptIdentityFailures(pageNames, durableNames, expectedDurableName) {
  const failures = [];
  if (pageNames.size !== 1) failures.push(failure("ambiguous_pages_script"));
  if (!durableScriptMatches(durableNames, expectedDurableName)) {
    failures.push(failure("unexpected_durable_object_script"));
  }
  return failures;
}

function discoveryPass(failures, pagesScriptName, markerCount, expectedCount) {
  return [
    failures.length === 0,
    pagesScriptName !== null,
    markerCount === expectedCount * 2,
  ].every(Boolean);
}

export function discoverAr006SurfaceScripts({
  events,
  expectedEvidenceIds,
  durableObjectScriptName,
}) {
  const markers = events.map(markerRecord).filter((marker) => marker !== null);
  const pages = surfaceScripts(markers, expectedEvidenceIds, "pages-ingress");
  const durable = surfaceScripts(
    markers,
    expectedEvidenceIds,
    "durable-object",
  );
  const pageNames = new Set(pages.scripts);
  const durableNames = new Set(durable.scripts);
  const failures = [
    ...pages.failures,
    ...durable.failures,
    ...campaignShapeFailures(events, markers, expectedEvidenceIds),
    ...scriptIdentityFailures(
      pageNames,
      durableNames,
      durableObjectScriptName,
    ),
  ];
  const pagesScriptName =
    failures.length === 0 ? ([...pageNames][0] ?? null) : null;
  return {
    pagesScriptName,
    markerCount: markers.length,
    failures,
    pass: discoveryPass(
      failures,
      pagesScriptName,
      markers.length,
      expectedEvidenceIds.length,
    ),
  };
}

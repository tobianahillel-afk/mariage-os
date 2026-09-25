import { URL } from "node:url";

const DEFAULT_ATTEMPTS = 8;
const DEFAULT_DELAY_MS = 1_500;
const TRANSIENT_STATUSES = new Set([404, 503]);

function defaultWaiter(milliseconds) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function unavailablePayload(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    value.error === "private_document_unavailable"
  );
}

function requireAttempts(value) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(
      "Lifecycle readiness maxAttempts must be a positive integer.",
    );
  }
}

async function requireReadyResponse(response) {
  if (response.status !== 409) {
    throw new Error(`expected HTTP 409, received ${response.status}`);
  }
  if (response.headers.get("access-control-allow-origin") === "*") {
    throw new Error("wildcard CORS must not be emitted");
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("route resolved to non-JSON content/fallback");
  }
  const payload = await response.json().catch(() => null);
  if (!unavailablePayload(payload)) {
    throw new Error("route returned an unexpected response shape");
  }
}

async function requireReadyWithHistory(response, statuses) {
  try {
    await requireReadyResponse(response);
  } catch (error) {
    throw new Error(
      `Lifecycle route readiness failed after statuses [${statuses.join(",")}]: ${error instanceof Error ? error.message : String(error)}.`,
      { cause: error },
    );
  }
}

function lifecycleHeaders({
  token,
  origin,
  projectId,
  documentId,
  evidenceId,
}) {
  const headers = {
    authorization: `Bearer ${token}`,
    origin,
    "x-project-id": projectId,
    "x-document-id": documentId,
  };
  if (evidenceId !== undefined) {
    headers["x-mariage-os-ar006-evidence-id"] = evidenceId;
  }
  return headers;
}

function canRetry(status, attempt, maxAttempts) {
  return TRANSIENT_STATUSES.has(status) && attempt < maxAttempts;
}

function readinessFailure(statuses, status) {
  return new Error(
    `Lifecycle route readiness failed after statuses [${statuses.join(",")}]: expected HTTP 409, received ${status}.`,
  );
}

async function fetchLifecycle({
  routeUrl,
  token,
  origin,
  projectId,
  documentId,
  evidenceId,
  fetcher,
}) {
  return fetcher(routeUrl, {
    method: "POST",
    redirect: "manual",
    headers: lifecycleHeaders({
      token,
      origin,
      projectId,
      documentId,
      evidenceId,
    }),
  });
}

export async function probePrivateDocumentLifecycle({
  routeUrl,
  token,
  projectId,
  documentId,
  evidenceId,
  maxAttempts = DEFAULT_ATTEMPTS,
  delayMs = DEFAULT_DELAY_MS,
  fetcher = globalThis.fetch,
  waiter = defaultWaiter,
}) {
  requireAttempts(maxAttempts);
  const origin = new URL(routeUrl).origin;
  const statuses = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetchLifecycle({
      routeUrl,
      token,
      origin,
      projectId,
      documentId,
      evidenceId,
      fetcher,
    });
    statuses.push(response.status);

    if (response.status === 409) {
      await requireReadyWithHistory(response, statuses);
      return { attempts: attempt, statuses };
    }
    if (!canRetry(response.status, attempt, maxAttempts)) {
      throw readinessFailure(statuses, response.status);
    }
    await waiter(delayMs);
  }
  throw new Error(
    `Lifecycle route readiness exhausted after statuses [${statuses.join(",")}].`,
  );
}

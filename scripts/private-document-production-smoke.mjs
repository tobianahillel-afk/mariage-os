const DEFAULT_READY_ATTEMPTS = 8;
const DEFAULT_READY_DELAY_MS = 1_500;

function unavailablePayload(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    value.error === "private_document_unavailable"
  );
}

function defaultWaiter(milliseconds) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

async function requireDeniedResponse(label, expectedStatus, response) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label}: expected HTTP ${expectedStatus}, received ${response.status}.`,
    );
  }
  if (response.headers.get("access-control-allow-origin") === "*") {
    throw new Error(`${label}: wildcard CORS must not be emitted.`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`${label}: route resolved to non-JSON content/fallback.`);
  }
  const payload = await response.json();
  if (!unavailablePayload(payload)) {
    throw new Error(`${label}: route returned an unexpected response shape.`);
  }
}

export async function assertDenied({
  routeUrl,
  label,
  expectedStatus,
  init,
  fetcher = globalThis.fetch,
}) {
  const response = await fetcher(routeUrl, {
    redirect: "manual",
    ...init,
  });
  await requireDeniedResponse(label, expectedStatus, response);
}

function requirePositiveAttempts(maxAttempts) {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("Smoke readiness maxAttempts must be a positive integer.");
  }
}

function shouldRetry(response, attempt, maxAttempts, transientStatus) {
  return response.status === transientStatus && attempt < maxAttempts;
}

export async function assertEventuallyDenied({
  routeUrl,
  label,
  expectedStatus,
  init,
  transientStatus = 404,
  maxAttempts = DEFAULT_READY_ATTEMPTS,
  delayMs = DEFAULT_READY_DELAY_MS,
  fetcher = globalThis.fetch,
  waiter = defaultWaiter,
}) {
  requirePositiveAttempts(maxAttempts);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetcher(routeUrl, {
      redirect: "manual",
      ...init,
    });
    if (shouldRetry(response, attempt, maxAttempts, transientStatus)) {
      await waiter(delayMs);
      continue;
    }
    await requireDeniedResponse(label, expectedStatus, response);
    return attempt;
  }

  throw new Error(`${label}: readiness attempts exhausted.`);
}

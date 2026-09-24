import {
  observabilityErrorCodes,
  observabilityEvents,
} from "./private-document-ar006-worker-metrics.mjs";

const API_ROOT = "https://api.cloudflare.com/client/v4/accounts";
const DEFAULT_LIMIT = 100;

async function verifyToken(url, token) {
  const response = await globalThis.fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);
  const apiSuccess =
    response.ok &&
    typeof payload === "object" &&
    payload !== null &&
    payload.success === true;
  return {
    httpStatus: response.status,
    apiSuccess,
    tokenActive: apiSuccess && payload.result?.status === "active",
    providerErrorCodes: observabilityErrorCodes(payload),
  };
}

export function verifyObservabilityAccountToken({ accountId, token }) {
  return verifyToken(
    `${API_ROOT}/${encodeURIComponent(accountId)}/tokens/verify`,
    token,
  );
}

export function verifyObservabilityUserToken({ token }) {
  return verifyToken(
    "https://api.cloudflare.com/client/v4/user/tokens/verify",
    token,
  );
}

function eventQueryBody(timeframe, queryId, filters) {
  return {
    queryId,
    timeframe,
    view: "events",
    limit: DEFAULT_LIMIT,
    dry: true,
    parameters: {
      datasets: [],
      filterCombination: "and",
      filters,
    },
  };
}

function scriptFilter(workerName) {
  return {
    kind: "filter",
    key: "$workers.scriptName",
    operation: "eq",
    type: "string",
    value: workerName,
  };
}

function markerFilter() {
  return {
    kind: "filter",
    key: "$metadata.message",
    operation: "includes",
    type: "string",
    value: "mariage-os.ar006.promotion",
  };
}

export function retryAfterDelayMs(headers) {
  const value = headers.get("retry-after")?.trim();
  if (value === undefined || !/^\d+$/u.test(value)) return null;
  const milliseconds = Number(value) * 1_000;
  return Number.isSafeInteger(milliseconds) && milliseconds > 0
    ? milliseconds
    : null;
}

export function nextObservabilityDelayMs(result, fallbackMs) {
  if (result.httpStatus !== 429 || result.retryAfterMs === null) {
    return fallbackMs;
  }
  return result.retryAfterMs;
}

async function runObservabilityQuery({ accountId, token, query }) {
  const response = await globalThis.fetch(
    `${API_ROOT}/${encodeURIComponent(accountId)}/workers/observability/telemetry/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(query),
    },
  );
  const payload = await response.json().catch(() => null);
  return {
    httpStatus: response.status,
    apiSuccess:
      response.ok &&
      typeof payload === "object" &&
      payload !== null &&
      payload.success === true,
    providerErrorCodes: observabilityErrorCodes(payload),
    events: observabilityEvents(payload),
    retryAfterMs: retryAfterDelayMs(response.headers),
  };
}

export function queryWorkersObservability({
  accountId,
  workerName,
  token,
  timeframe,
  queryId,
}) {
  return runObservabilityQuery({
    accountId,
    token,
    query: eventQueryBody(timeframe, queryId, [scriptFilter(workerName)]),
  });
}

export function queryAr006MarkerObservability({
  accountId,
  token,
  timeframe,
  queryId,
}) {
  return runObservabilityQuery({
    accountId,
    token,
    query: eventQueryBody(timeframe, queryId, [markerFilter()]),
  });
}

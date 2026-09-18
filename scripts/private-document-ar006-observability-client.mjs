import {
  observabilityErrorCodes,
  observabilityEvents,
} from "./private-document-ar006-worker-metrics.mjs";

const API_ROOT = "https://api.cloudflare.com/client/v4/accounts";
const DEFAULT_LIMIT = 100;

function queryBody(workerName, timeframe, queryId) {
  return {
    queryId,
    timeframe,
    view: "events",
    limit: DEFAULT_LIMIT,
    dry: true,
    parameters: {
      datasets: [],
      filterCombination: "and",
      filters: [
        {
          kind: "filter",
          key: "$workers.scriptName",
          operation: "eq",
          type: "string",
          value: workerName,
        },
      ],
    },
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

export async function queryWorkersObservability({
  accountId,
  workerName,
  token,
  timeframe,
  queryId,
}) {
  const response = await globalThis.fetch(
    `${API_ROOT}/${encodeURIComponent(accountId)}/workers/observability/telemetry/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(queryBody(workerName, timeframe, queryId)),
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

import { writeFile } from "node:fs/promises";

const API_ROOT = "https://api.cloudflare.com/client/v4/accounts";
const OUTPUT_PATH = "ar006-workers-observability-preflight.json";
const CPU_BUDGET_MS = 10;
const LOOKBACK_MS = 10 * 60 * 1000;
const FUTURE_SLOP_MS = 5_000;
const QUERY_LIMIT = 100;

function envValue(name) {
  return process.env[name]?.trim() ?? "";
}

function requiredEnv(name) {
  const value = envValue(name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function assertContext() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error(
      "Workers Free isolated-environment attestation is required.",
    );
  }
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    pagesProject: requiredEnv("AR006_PAGES_PROJECT"),
    deploymentId: requiredEnv("AR006_OBS_DEPLOYMENT_ID"),
    scriptName: requiredEnv("AR006_OBS_SCRIPT_NAME"),
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function recordProperty(value, key) {
  if (!isRecord(value)) return undefined;
  return value[key];
}

function stringOrNull(value) {
  return typeof value === "string" ? value : null;
}

function numberPropertyOrNull(value, key) {
  const candidate = recordProperty(value, key);
  if (typeof candidate !== "number") return null;
  if (!Number.isFinite(candidate)) return null;
  return candidate;
}

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function queryBody(scriptName, timeframe) {
  return {
    queryId: "mariage-os-ar006-observability-preflight",
    timeframe,
    view: "events",
    limit: QUERY_LIMIT,
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
          value: scriptName,
        },
      ],
    },
  };
}

function apiErrors(payload) {
  const errors = recordProperty(payload, "errors");
  if (!Array.isArray(errors)) return [];
  return errors.map((error) => ({
    code: numberPropertyOrNull(error, "code"),
  }));
}

function responseEvents(payload) {
  const result = recordProperty(payload, "result");
  const eventGroup = recordProperty(result, "events");
  const events = recordProperty(eventGroup, "events");
  return Array.isArray(events) ? events : [];
}

function workerRecord(event) {
  const workers = recordProperty(event, "$workers");
  return isRecord(workers) ? workers : null;
}

function metadataValue(event, key) {
  const metadata = recordProperty(event, "$metadata");
  return recordProperty(metadata, key);
}

function withinFreeCpuBudget(cpuTimeMs) {
  if (cpuTimeMs === null) return null;
  return cpuTimeMs <= CPU_BUDGET_MS;
}

function sanitizeEvent(event, scriptName) {
  const workers = workerRecord(event);
  if (workers === null) return null;
  if (recordProperty(workers, "scriptName") !== scriptName) return null;
  const cpuTimeMs = finiteNumber(recordProperty(workers, "cpuTimeMs"));
  return {
    eventId: stringOrNull(metadataValue(event, "id")),
    cloudService: stringOrNull(metadataValue(event, "cloudService")),
    requestId: stringOrNull(recordProperty(workers, "requestId")),
    scriptName,
    eventType: stringOrNull(recordProperty(workers, "eventType")),
    outcome: stringOrNull(recordProperty(workers, "outcome")),
    cpuTimeMs,
    wallTimeMs: finiteNumber(recordProperty(workers, "wallTimeMs")),
    statusCode: finiteNumber(recordProperty(workers, "statusCode")),
    withinFreeCpuBudget: withinFreeCpuBudget(cpuTimeMs),
  };
}

function sanitizeEvents(events, scriptName) {
  return events
    .map((event) => sanitizeEvent(event, scriptName))
    .filter((event) => event !== null);
}

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function queryObservability(context, token, timeframe) {
  const url =
    `${API_ROOT}/${encodeURIComponent(context.accountId)}` +
    "/workers/observability/telemetry/query";
  const response = await globalThis.fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(queryBody(context.scriptName, timeframe)),
  });
  const payload = await parseJsonResponse(response);
  return { response, payload };
}

function responseOk(response) {
  if (!isRecord(response)) return false;
  return response.ok === true;
}

function payloadSucceeded(payload) {
  if (!isRecord(payload)) return false;
  return payload.success === true;
}

async function collect(context, token) {
  const from = Date.now() - LOOKBACK_MS;
  let latest = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const timeframe = { from, to: Date.now() + FUTURE_SLOP_MS };
    const result = await queryObservability(context, token, timeframe);
    const events = sanitizeEvents(
      responseEvents(result.payload),
      context.scriptName,
    );
    latest = { ...result, timeframe, events, attempt };
    if (!responseOk(result.response) || !payloadSucceeded(result.payload))
      break;
    if (events.some((event) => event.cpuTimeMs !== null)) break;
    if (attempt < 3) await delay(5_000);
  }
  return latest;
}

function resultField(result, key) {
  const value = recordProperty(result, key);
  if (value === undefined) return null;
  return value;
}

function resultEvents(result) {
  const events = resultField(result, "events");
  return Array.isArray(events) ? events : [];
}

function contextField(context, key) {
  const value = recordProperty(context, key);
  if (value === undefined) return null;
  return value;
}

function planAttestation(context) {
  if (!isRecord(context)) return null;
  return "Workers Free / isolated non-production";
}

function responseStatus(response) {
  if (!isRecord(response)) return null;
  return finiteNumber(response.status);
}

function capabilityPass(tokenPresent, response, payload, cpuEvents) {
  if (!tokenPresent) return false;
  if (!responseOk(response)) return false;
  if (!payloadSucceeded(payload)) return false;
  return cpuEvents.length > 0;
}

async function writeEvidence(context, result, tokenPresent) {
  const response = resultField(result, "response");
  const payload = resultField(result, "payload");
  const events = resultEvents(result);
  const cpuEvents = events.filter((event) => event.cpuTimeMs !== null);
  const pass = capabilityPass(tokenPresent, response, payload, cpuEvents);
  const evidence = {
    schema: "mariage-os.wp29c.ar006.observability-preflight.v1",
    generatedAt: new Date().toISOString(),
    pagesProject: contextField(context, "pagesProject"),
    deploymentId: contextField(context, "deploymentId"),
    scriptName: contextField(context, "scriptName"),
    workersPlanAttestation: planAttestation(context),
    tokenPresent,
    httpStatus: responseStatus(response),
    apiSuccess: payloadSucceeded(payload),
    providerErrorMetadata: apiErrors(payload),
    queryAttempt: resultField(result, "attempt"),
    timeframe: resultField(result, "timeframe"),
    matchingEventCount: events.length,
    cpuEventCount: cpuEvents.length,
    cpuBudgetMs: CPU_BUDGET_MS,
    providerEvents: events,
    pass,
  };
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `AR-006 Workers Observability preflight written to ${OUTPUT_PATH}.`,
  );
  return pass;
}

async function loadContext() {
  try {
    return assertContext();
  } catch (error) {
    await writeEvidence(null, null, false);
    throw error;
  }
}

async function requireObservabilityToken(context) {
  const token = envValue("CLOUDFLARE_OBSERVABILITY_API_TOKEN");
  if (token) return token;
  await writeEvidence(context, null, false);
  throw new Error(
    "Dedicated Cloudflare Workers Observability token is required.",
  );
}

async function main() {
  const context = await loadContext();
  const token = await requireObservabilityToken(context);
  const result = await collect(context, token);
  const pass = await writeEvidence(context, result, true);
  if (!pass) {
    throw new Error(
      "Workers Observability did not expose attributable provider CPU telemetry for the exact Pages script.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

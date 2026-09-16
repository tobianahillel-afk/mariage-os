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
  if (!Array.isArray(payload?.errors)) return [];
  return payload.errors.map((error) => ({
    code: typeof error?.code === "number" ? error.code : null,
  }));
}

function responseEvents(payload) {
  const events = payload?.result?.events?.events;
  return Array.isArray(events) ? events : [];
}

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizeEvent(event, scriptName) {
  const workers = event?.$workers;
  if (!workers || workers.scriptName !== scriptName) return null;
  const cpuTimeMs = finiteNumber(workers.cpuTimeMs);
  return {
    eventId:
      typeof event?.$metadata?.id === "string" ? event.$metadata.id : null,
    cloudService:
      typeof event?.$metadata?.cloudService === "string"
        ? event.$metadata.cloudService
        : null,
    requestId: typeof workers.requestId === "string" ? workers.requestId : null,
    scriptName: workers.scriptName,
    eventType: typeof workers.eventType === "string" ? workers.eventType : null,
    outcome: typeof workers.outcome === "string" ? workers.outcome : null,
    cpuTimeMs,
    wallTimeMs: finiteNumber(workers.wallTimeMs),
    statusCode: finiteNumber(workers.statusCode),
    withinFreeCpuBudget: cpuTimeMs === null ? null : cpuTimeMs <= CPU_BUDGET_MS,
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
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { response, payload };
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
    if (!result.response.ok || result.payload?.success !== true) break;
    if (events.some((event) => event.cpuTimeMs !== null)) break;
    if (attempt < 3) await delay(5_000);
  }
  return latest;
}

async function writeEvidence(context, result, tokenPresent) {
  const response = result?.response ?? null;
  const payload = result?.payload ?? null;
  const events = result?.events ?? [];
  const cpuEvents = events.filter((event) => event.cpuTimeMs !== null);
  const pass =
    tokenPresent &&
    response?.ok === true &&
    payload?.success === true &&
    cpuEvents.length > 0;
  const evidence = {
    schema: "mariage-os.wp29c.ar006.observability-preflight.v1",
    generatedAt: new Date().toISOString(),
    pagesProject: context?.pagesProject ?? null,
    deploymentId: context?.deploymentId ?? null,
    scriptName: context?.scriptName ?? null,
    workersPlanAttestation:
      context === null ? null : "Workers Free / isolated non-production",
    tokenPresent,
    httpStatus: response?.status ?? null,
    apiSuccess: payload?.success === true,
    providerErrorMetadata: apiErrors(payload),
    queryAttempt: result?.attempt ?? null,
    timeframe: result?.timeframe ?? null,
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

async function main() {
  let context = null;
  try {
    context = assertContext();
  } catch (error) {
    await writeEvidence(null, null, false);
    throw error;
  }

  const token = envValue("CLOUDFLARE_OBSERVABILITY_API_TOKEN");
  if (!token) {
    await writeEvidence(context, null, false);
    throw new Error(
      "Dedicated Cloudflare Workers Observability token is required.",
    );
  }

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

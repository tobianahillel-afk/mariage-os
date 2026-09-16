import { writeFile } from "node:fs/promises";
import {
  metricEvidence,
  metricsPass,
} from "./private-document-ar006-metrics.mjs";

const ANALYTICS_URL = "https://api.cloudflare.com/client/v4/graphql";
const CPU_BUDGET_MS = 10;
const EVIDENCE_PATH = "ar006-workers-free-requery.json";
const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function isoInstant(name) {
  const value = requiredEnv(name);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be an ISO instant.`);
  return { value, parsed };
}

function expectedRequestCount() {
  const count = Number(requiredEnv("AR006_REQUERY_EXPECTED_REQUESTS"));
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("AR006_REQUERY_EXPECTED_REQUESTS must be a positive integer.");
  }
  return count;
}

function assertContext() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error("Workers Free isolated-environment attestation is required.");
  }
  const targetGitCommit = requiredEnv("AR006_REQUERY_TARGET_SHA");
  if (!SHA_PATTERN.test(targetGitCommit)) {
    throw new Error("AR006_REQUERY_TARGET_SHA must be a full Git SHA.");
  }
  const deploymentId = requiredEnv("AR006_REQUERY_DEPLOYMENT_ID");
  if (!UUID_PATTERN.test(deploymentId)) {
    throw new Error("AR006_REQUERY_DEPLOYMENT_ID must be a UUID.");
  }
  const start = isoInstant("AR006_REQUERY_WINDOW_START");
  const end = isoInstant("AR006_REQUERY_WINDOW_END");
  if (start.parsed >= end.parsed) {
    throw new Error("AR-006 requery analytics window is invalid.");
  }
  return {
    targetGitCommit,
    deploymentId,
    scriptName: requiredEnv("AR006_REQUERY_SCRIPT_NAME"),
    window: { start: start.value, end: end.value },
    expectedRequests: expectedRequestCount(),
  };
}

function analyticsRows(payload) {
  try {
    const rows = payload.data.viewer.accounts[0].workersInvocationsAdaptive;
    if (!Array.isArray(rows)) throw new Error("Unexpected analytics rows.");
    return rows;
  } catch {
    throw new Error("Cloudflare analytics response shape is invalid.");
  }
}

async function queryAnalytics(scriptName, window) {
  const query = `query Evidence($accountTag: string, $start: string, $end: string, $scriptName: string) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        workersInvocationsAdaptive(limit: 100, filter: {
          scriptName: $scriptName,
          datetime_geq: $start,
          datetime_leq: $end
        }) {
          sum { requests errors }
          quantiles { cpuTimeP50 cpuTimeP99 }
          dimensions { datetime scriptName status }
        }
      }
    }
  }`;
  const response = await globalThis.fetch(ANALYTICS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${requiredEnv("CLOUDFLARE_ANALYTICS_API_TOKEN")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
        start: window.start,
        end: window.end,
        scriptName,
      },
    }),
  });
  const payload = await response.json();
  if (!response.ok || (Array.isArray(payload.errors) && payload.errors.length > 0)) {
    throw new Error("Cloudflare analytics query failed.");
  }
  return analyticsRows(payload);
}

function requestCount(rows) {
  return rows.reduce((sum, row) => sum + Number(row.sum.requests), 0);
}

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function collectRows(context) {
  let rows = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    rows = await queryAnalytics(context.scriptName, context.window);
    if (requestCount(rows) >= context.expectedRequests) break;
    if (attempt < 2) await delay(10_000);
  }
  return rows;
}

async function writeEvidence(context, measurements, pass) {
  const evidence = {
    schema: "mariage-os.wp29c.ar006.requery.v1",
    generatedAt: new Date().toISOString(),
    targetGitCommit: context.targetGitCommit,
    pagesProject: requiredEnv("AR006_PAGES_PROJECT"),
    deploymentId: context.deploymentId,
    scriptName: context.scriptName,
    analyticsWindow: context.window,
    expectedRequestCount: context.expectedRequests,
    sourceEvidenceArtifactId: requiredEnv("AR006_REQUERY_SOURCE_ARTIFACT_ID"),
    sourceEvidenceZipSha256: requiredEnv(
      "AR006_REQUERY_SOURCE_ARTIFACT_ZIP_SHA256",
    ),
    workersPlanAttestation: "Workers Free / isolated non-production",
    providerCpuMeasurements: measurements,
    cpuBudgetMs: CPU_BUDGET_MS,
    pass,
  };
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  console.log(`AR-006 delayed telemetry requery written to ${EVIDENCE_PATH}.`);
}

async function main() {
  const context = assertContext();
  const rows = await collectRows(context);
  const measurements = metricEvidence(rows);
  const pass = metricsPass(
    measurements,
    context.expectedRequests,
    CPU_BUDGET_MS,
  );
  await writeEvidence(context, measurements, pass);
  if (!pass) {
    throw new Error("AR-006 delayed provider telemetry still does not satisfy the CPU gate.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

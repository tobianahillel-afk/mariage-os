import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import {
  assertUuid,
  httpsOrigin,
  requiredEnv,
} from "./private-document-ar006-do-evidence-env.mjs";
import {
  signInAr006SyntheticUser,
} from "./private-document-ar006-do-evidence-flow.mjs";
import {
  probePrivateDocumentLifecycle,
} from "./private-document-ar006-do-route-readiness.mjs";
import {
  nextObservabilityDelayMs,
  queryAr006MarkerObservability,
  queryWorkersObservability,
} from "./private-document-ar006-observability-client.mjs";
import {
  workerEvidenceTimeframe,
} from "./private-document-ar006-observability-timeframe.mjs";
import {
  discoverAr006SurfaceScripts,
} from "./private-document-ar006-surface-discovery.mjs";

const RECEIPT_PATH = "ar006-do-marker-recheck.json";
const ATTEMPTS = 12;
const FALLBACK_DELAY_MS = 15_000;

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function sanitizedQuery(result) {
  return {
    httpStatus: result.httpStatus,
    apiSuccess: result.apiSuccess,
    providerErrorCodes: result.providerErrorCodes,
    totalEventCount: result.totalEventCount,
    eventPageComplete: result.eventPageComplete,
    retryAfterMs: result.retryAfterMs,
  };
}

function sanitizedAttempt(attempt, query, discovery, elapsedMs) {
  return {
    attempt,
    elapsedMs,
    query: sanitizedQuery(query),
    markerCount: discovery.markerCount,
    failures: discovery.failures,
    pagesScriptName: discovery.pagesScriptName,
    pass:
      query.apiSuccess === true &&
      query.eventPageComplete === true &&
      discovery.pass === true,
  };
}

function context() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error(
      "Workers Free isolated-environment attestation is required.",
    );
  }
  const projectId = requiredEnv("AR006_PROJECT_ID");
  assertUuid("AR006_PROJECT_ID", projectId);
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    durableObjectScriptName: requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER"),
    deploymentUrl: httpsOrigin("AR006_DEPLOYMENT_URL"),
    projectId,
    token: requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN"),
  };
}

async function markerQuery(state, startedAt, attempt) {
  const timeframe = workerEvidenceTimeframe(startedAt);
  const query = await queryAr006MarkerObservability({
    accountId: state.accountId,
    token: state.token,
    timeframe: timeframe.request,
    queryId: `mariage-os-ar006-do-marker-recheck-${attempt}`,
  });
  return { timeframe, query };
}

async function targetedDurableDiagnostic(state, startedAt) {
  const timeframe = workerEvidenceTimeframe(startedAt);
  const query = await queryWorkersObservability({
    accountId: state.accountId,
    workerName: state.durableObjectScriptName,
    token: state.token,
    timeframe: timeframe.request,
    queryId: "mariage-os-ar006-do-marker-recheck-durable-final",
  });
  return { window: timeframe.record, query: sanitizedQuery(query) };
}

async function writeReceipt(data) {
  const record = {
    schema: "mariage-os.wp29c.ar006.do-marker-recheck.v1",
    generatedAt: new Date().toISOString(),
    diagnosticCommit: process.env.GITHUB_SHA ?? null,
    candidateSha: requiredEnv("AR006_MARKER_RECHECK_CANDIDATE_SHA"),
    pagesProject: requiredEnv("AR006_PAGES_PROJECT"),
    deployment: {
      id: requiredEnv("AR006_MARKER_RECHECK_DEPLOYMENT_ID"),
      url: data.state.deploymentUrl,
    },
    worker: {
      name: data.state.durableObjectScriptName,
      deploymentId: requiredEnv("AR006_MARKER_RECHECK_WORKER_DEPLOYMENT_ID"),
      versionId: requiredEnv("AR006_MARKER_RECHECK_WORKER_VERSION_ID"),
    },
    evidenceId: data.evidenceId,
    startedAt: data.startedAt,
    routeReadiness: data.routeReadiness,
    attempts: data.attempts,
    durableDiagnostic: data.durableDiagnostic,
    documentMutation: false,
    exactSizeMutation: false,
    pass: data.pass,
  };
  await writeFile(
    RECEIPT_PATH,
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
}

async function run() {
  const state = context();
  const identity = await signInAr006SyntheticUser();
  const evidenceId = randomUUID();
  const startedAt = new Date().toISOString();
  const routeReadiness = await probePrivateDocumentLifecycle({
    routeUrl: `${state.deploymentUrl}/api/private-document-promote`,
    token: identity.token,
    projectId: state.projectId,
    documentId: randomUUID(),
    evidenceId,
  });
  const attempts = [];
  let pass = false;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const { timeframe, query } = await markerQuery(state, startedAt, attempt);
    const discovery = discoverAr006SurfaceScripts({
      events: query.events,
      expectedEvidenceIds: [evidenceId],
      durableObjectScriptName: state.durableObjectScriptName,
    });
    const elapsedMs = Date.now() - new Date(startedAt).getTime();
    const receiptAttempt = {
      ...sanitizedAttempt(attempt, query, discovery, elapsedMs),
      window: timeframe.record,
    };
    attempts.push(receiptAttempt);
    if (receiptAttempt.pass) {
      pass = true;
      break;
    }
    if (attempt < ATTEMPTS) {
      await delay(nextObservabilityDelayMs(query, FALLBACK_DELAY_MS));
    }
  }

  const durableDiagnostic = pass
    ? null
    : await targetedDurableDiagnostic(state, startedAt);
  await writeReceipt({
    state,
    evidenceId,
    routeReadiness,
    startedAt,
    attempts,
    durableDiagnostic,
    pass,
  });
  if (!pass) {
    throw new Error(
      "ADR 0012 marker-only Observability recheck failed closed.",
    );
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

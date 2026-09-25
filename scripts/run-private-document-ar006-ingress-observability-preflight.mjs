import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import {
  assertUuid,
  httpsOrigin,
  requiredEnv,
} from "./private-document-ar006-do-evidence-env.mjs";
import { signInAr006SyntheticUser } from "./private-document-ar006-do-evidence-flow.mjs";
import { probePrivateDocumentLifecycle } from "./private-document-ar006-do-route-readiness.mjs";
import {
  nextObservabilityDelayMs,
  queryWorkersObservability,
} from "./private-document-ar006-observability-client.mjs";
import { workerEvidenceTimeframe } from "./private-document-ar006-observability-timeframe.mjs";
import { discoverAr006SurfaceScripts } from "./private-document-ar006-surface-discovery.mjs";

const RECEIPT_PATH = "ar006-adr0013-ingress-preflight.json";
const ATTEMPTS = 10;
const DELAY_MS = 10_000;

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
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
    ingressScriptName: requiredEnv("AR006_PRIVATE_DOCUMENT_INGRESS"),
    durableObjectScriptName: requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER"),
    deploymentUrl: httpsOrigin("AR006_DEPLOYMENT_URL"),
    projectId,
    token: requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN"),
  };
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

async function queryScript(state, scriptName, timeframe, queryId) {
  return queryWorkersObservability({
    accountId: state.accountId,
    workerName: scriptName,
    token: state.token,
    timeframe,
    queryId,
  });
}

async function observeMarker(state, evidenceId, startedAt) {
  const attempts = [];
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const timeframe = workerEvidenceTimeframe(startedAt);
    const ingress = await queryScript(
      state,
      state.ingressScriptName,
      timeframe.request,
      `mariage-os-ar006-ingress-preflight-${attempt}`,
    );
    const durableObject = await queryScript(
      state,
      state.durableObjectScriptName,
      timeframe.request,
      `mariage-os-ar006-do-preflight-${attempt}`,
    );
    const discovery = discoverAr006SurfaceScripts({
      events: [...ingress.events, ...durableObject.events],
      expectedEvidenceIds: [evidenceId],
      ingressScriptName: state.ingressScriptName,
      durableObjectScriptName: state.durableObjectScriptName,
    });
    const receipt = {
      attempt,
      window: timeframe.record,
      ingress: sanitizedQuery(ingress),
      durableObject: sanitizedQuery(durableObject),
      markerCount: discovery.markerCount,
      failures: discovery.failures,
      pass:
        ingress.apiSuccess === true &&
        ingress.eventPageComplete === true &&
        durableObject.apiSuccess === true &&
        durableObject.eventPageComplete === true &&
        discovery.pass === true,
    };
    attempts.push(receipt);
    if (receipt.pass) return { attempts, pass: true };
    if (attempt < ATTEMPTS) {
      const waitMs = Math.max(
        nextObservabilityDelayMs(ingress, DELAY_MS),
        nextObservabilityDelayMs(durableObject, DELAY_MS),
      );
      await delay(waitMs);
    }
  }
  return { attempts, pass: false };
}

async function main() {
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
  const observation = await observeMarker(state, evidenceId, startedAt);
  const record = {
    schema: "mariage-os.wp29c.ar006.adr0013-ingress-preflight.v1",
    generatedAt: new Date().toISOString(),
    gitCommit: process.env.GITHUB_SHA ?? null,
    ingressScript: state.ingressScriptName,
    durableObjectScript: state.durableObjectScriptName,
    evidenceId,
    routeReadiness,
    attempts: observation.attempts,
    documentMutation: false,
    exactSizeMutation: false,
    pass: observation.pass,
  };
  await writeFile(RECEIPT_PATH, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  if (!observation.pass) {
    throw new Error(
      "ADR 0013 structured Observability preflight failed closed.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import { writeFile } from "node:fs/promises";
import { requiredEnv } from "./private-document-ar006-do-evidence-env.mjs";
import { queryWorkersObservability } from "./private-document-ar006-observability-client.mjs";
import { discoverAr006SurfaceScripts } from "./private-document-ar006-surface-discovery.mjs";

const RECEIPT_PATH = "ar006-adr0013-diagnostic-requery.json";
const FAILED_SOURCE_SHA = "f7951e99eb31bcc63d9cbd93f67db80548340ed6";
const EVIDENCE_ID = "a5848756-d76c-4848-9312-eab1b883a063";
const WINDOW_FROM = "2026-09-25T16:06:26.252Z";
const WINDOW_TO = "2026-09-25T16:07:53.815Z";
const INGRESS_SCRIPT = "mariage-os-ar006-ingress";
const INGRESS_VERSION = "8c48646c-c9a3-410b-98c4-b42a98e75244";
const DURABLE_OBJECT_SCRIPT = "mariage-os-private-document-promotion";
const DURABLE_OBJECT_VERSION = "683829d6-abb8-4340-8bf1-2a5c78d527a1";

function exactTimeframe() {
  return {
    from: Date.parse(WINDOW_FROM),
    to: Date.parse(WINDOW_TO),
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

function diagnosticContext() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error("Workers Free isolated attestation is required.");
  }
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    token: requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN"),
  };
}

async function queryExactSurface(accountId, token, workerName, queryId) {
  return queryWorkersObservability({
    accountId,
    token,
    workerName,
    timeframe: exactTimeframe(),
    queryId,
  });
}

async function queryFailedWindow(context) {
  const ingress = await queryExactSurface(
    context.accountId,
    context.token,
    INGRESS_SCRIPT,
    "mariage-os-ar006-ingress-failed-window-diagnostic",
  );
  const durableObject = await queryExactSurface(
    context.accountId,
    context.token,
    DURABLE_OBJECT_SCRIPT,
    "mariage-os-ar006-do-failed-window-diagnostic",
  );
  return { ingress, durableObject };
}

function queriesComplete(ingress, durableObject) {
  return (
    ingress.apiSuccess === true &&
    ingress.eventPageComplete === true &&
    durableObject.apiSuccess === true &&
    durableObject.eventPageComplete === true
  );
}

function discoverFailedInvocation(ingress, durableObject) {
  return discoverAr006SurfaceScripts({
    events: [...ingress.events, ...durableObject.events],
    expectedEvidenceIds: [EVIDENCE_ID],
    ingressScriptName: INGRESS_SCRIPT,
    durableObjectScriptName: DURABLE_OBJECT_SCRIPT,
    ingressVersionId: INGRESS_VERSION,
    durableObjectVersionId: DURABLE_OBJECT_VERSION,
  });
}

function diagnosticReceipt(ingress, durableObject, discovery) {
  const diagnosticComplete =
    queriesComplete(ingress, durableObject) && discovery.markerCount === 2;
  return {
    schema: "mariage-os.wp29c.ar006.adr0013-diagnostic-requery.v1",
    generatedAt: new Date().toISOString(),
    diagnosticCommit: process.env.GITHUB_SHA ?? null,
    failedSourceSha: FAILED_SOURCE_SHA,
    evidenceId: EVIDENCE_ID,
    timeframe: { from: WINDOW_FROM, to: WINDOW_TO },
    ingress: {
      scriptName: INGRESS_SCRIPT,
      scriptVersionId: INGRESS_VERSION,
      query: sanitizedQuery(ingress),
    },
    durableObject: {
      scriptName: DURABLE_OBJECT_SCRIPT,
      scriptVersionId: DURABLE_OBJECT_VERSION,
      query: sanitizedQuery(durableObject),
    },
    markerCount: discovery.markerCount,
    attributedInvocationCount: discovery.attributedInvocationCount,
    failures: discovery.failures,
    discoveryPass: discovery.pass,
    deploymentMutation: false,
    supabaseAuthentication: false,
    newMarker: false,
    documentMutation: false,
    exactSizeMutation: false,
    providerAcceptance: false,
    diagnosticComplete,
  };
}

async function writeReceipt(receipt) {
  await writeFile(
    RECEIPT_PATH,
    `${JSON.stringify(receipt, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const { ingress, durableObject } =
    await queryFailedWindow(diagnosticContext());
  const discovery = discoverFailedInvocation(ingress, durableObject);
  const receipt = diagnosticReceipt(ingress, durableObject, discovery);
  await writeReceipt(receipt);
  if (!receipt.diagnosticComplete) {
    throw new Error("ADR 0013 exact-window diagnostic was incomplete.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

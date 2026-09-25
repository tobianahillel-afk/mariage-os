import { randomUUID } from "node:crypto";
import {
  assertUuid,
  httpsOrigin,
  requiredEnv,
  sha256Hex,
} from "./private-document-ar006-do-evidence-env.mjs";
import {
  signInAr006SyntheticUser,
  runAr006Promotions,
} from "./private-document-ar006-do-evidence-flow.mjs";
import { probePrivateDocumentLifecycle } from "./private-document-ar006-do-route-readiness.mjs";
import {
  nextObservabilityDelayMs,
  queryWorkersObservability,
} from "./private-document-ar006-observability-client.mjs";
import { workerEvidenceTimeframe } from "./private-document-ar006-observability-timeframe.mjs";
import { discoverAr006SurfaceScripts } from "./private-document-ar006-surface-discovery.mjs";
import { createExactPdf } from "./private-document-ar006-synthetic-pdf.mjs";
import {
  AR006_EVIDENCE_COUNT,
  evaluateAr006TwoSurfaceEvents,
} from "./private-document-ar006-two-surface-metrics.mjs";
import {
  buildEvidenceRecord,
  buildFailureEvidenceRecord,
  writeEvidence,
} from "./private-document-ar006-do-evidence-record.mjs";
import { campaignPassed } from "./private-document-ar006-do-evidence-verdict.mjs";

const MAX_BYTES = 25_000_000;
const OBSERVABILITY_ATTEMPTS = 8;
const OBSERVABILITY_DELAY_MS = 10_000;

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function evidenceContext() {
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
  httpsOrigin("AR006_SUPABASE_URL");
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    ingressScriptName: requiredEnv("AR006_PRIVATE_DOCUMENT_INGRESS"),
    durableObjectScriptName: requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER"),
    ingressDeploymentId: requiredEnv("AR006_INGRESS_DEPLOYMENT_ID"),
    ingressVersionId: requiredEnv("AR006_INGRESS_VERSION_ID"),
    workerDeploymentId: requiredEnv("AR006_WORKER_DEPLOYMENT_ID"),
    workerVersionId: requiredEnv("AR006_WORKER_VERSION_ID"),
    projectId,
    deploymentUrl: httpsOrigin("AR006_DEPLOYMENT_URL"),
    token: requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN"),
    bytes: null,
    sha256: null,
  };
}

async function querySurface(context, scriptName, timeframe, queryId) {
  return queryWorkersObservability({
    accountId: context.accountId,
    workerName: scriptName,
    token: context.token,
    timeframe,
    queryId,
  });
}

function queriesComplete(ingress, durableObject) {
  return (
    ingress.apiSuccess &&
    ingress.eventPageComplete &&
    durableObject.apiSuccess &&
    durableObject.eventPageComplete
  );
}

async function markerPreflight(context, identity) {
  const evidenceId = randomUUID();
  const startedAt = new Date().toISOString();
  const routeReadiness = await probePrivateDocumentLifecycle({
    routeUrl: `${context.deploymentUrl}/api/private-document-promote`,
    token: identity.token,
    projectId: context.projectId,
    documentId: randomUUID(),
    evidenceId,
  });
  let latest = null;
  for (let attempt = 1; attempt <= OBSERVABILITY_ATTEMPTS; attempt += 1) {
    const timeframe = workerEvidenceTimeframe(startedAt);
    const ingress = await querySurface(
      context,
      context.ingressScriptName,
      timeframe.request,
      `mariage-os-ar006-ingress-marker-${attempt}`,
    );
    const durableObject = await querySurface(
      context,
      context.durableObjectScriptName,
      timeframe.request,
      `mariage-os-ar006-do-marker-${attempt}`,
    );
    const discovery = discoverAr006SurfaceScripts({
      events: [...ingress.events, ...durableObject.events],
      expectedEvidenceIds: [evidenceId],
      ingressScriptName: context.ingressScriptName,
      durableObjectScriptName: context.durableObjectScriptName,
      ingressVersionId: context.ingressVersionId,
      durableObjectVersionId: context.workerVersionId,
    });
    latest = {
      attempt,
      window: timeframe.record,
      ingress,
      durableObject,
      discovery,
      routeReadiness,
    };
    if (queriesComplete(ingress, durableObject) && discovery.pass)
      return latest;
    if (attempt < OBSERVABILITY_ATTEMPTS) {
      await delay(
        Math.max(
          nextObservabilityDelayMs(ingress, OBSERVABILITY_DELAY_MS),
          nextObservabilityDelayMs(durableObject, OBSERVABILITY_DELAY_MS),
        ),
      );
    }
  }
  return latest;
}

async function collectEvidence(context, invocations) {
  const ids = invocations.map((item) => item.evidenceId);
  const startedAt = invocations[0].startedAt;
  let latest = null;
  for (let attempt = 1; attempt <= OBSERVABILITY_ATTEMPTS; attempt += 1) {
    const timeframe = workerEvidenceTimeframe(startedAt);
    const ingress = await querySurface(
      context,
      context.ingressScriptName,
      timeframe.request,
      `mariage-os-ar006-ingress-evidence-${attempt}`,
    );
    const durableObject = await querySurface(
      context,
      context.durableObjectScriptName,
      timeframe.request,
      `mariage-os-ar006-do-evidence-${attempt}`,
    );
    const evaluation = evaluateAr006TwoSurfaceEvents({
      ingressEvents: ingress.events,
      durableObjectEvents: durableObject.events,
      expectedEvidenceIds: ids,
      ingressScriptName: context.ingressScriptName,
      durableObjectScriptName: context.durableObjectScriptName,
      ingressVersionId: context.ingressVersionId,
      durableObjectVersionId: context.workerVersionId,
    });
    latest = {
      attempt,
      window: timeframe.record,
      ingress,
      durableObject,
      evaluation,
    };
    if (queriesComplete(ingress, durableObject) && evaluation.pass)
      return latest;
    if (attempt < OBSERVABILITY_ATTEMPTS) {
      await delay(
        Math.max(
          nextObservabilityDelayMs(ingress, OBSERVABILITY_DELAY_MS),
          nextObservabilityDelayMs(durableObject, OBSERVABILITY_DELAY_MS),
        ),
      );
    }
  }
  return latest;
}

function state(context) {
  return {
    context,
    invocations: [],
    markerPreflight: null,
    observation: null,
    failureStage: "campaign_setup",
  };
}

function markerPreflightPassed(result) {
  return (
    result !== null &&
    queriesComplete(result.ingress, result.durableObject) &&
    result.discovery.pass
  );
}

async function main() {
  const current = state(evidenceContext());
  try {
    current.failureStage = "authentication";
    const identity = await signInAr006SyntheticUser();
    current.failureStage = "marker_preflight";
    current.markerPreflight = await markerPreflight(current.context, identity);
    if (!markerPreflightPassed(current.markerPreflight)) {
      throw new Error("ADR 0013 structured marker preflight failed.");
    }

    current.failureStage = "exact_size_setup";
    const bytes = createExactPdf(MAX_BYTES);
    if (bytes.byteLength !== MAX_BYTES)
      throw new Error("Synthetic PDF size drifted.");
    current.context.bytes = bytes;
    current.context.sha256 = sha256Hex(bytes);

    current.failureStage = "exact_size_flows";
    await runAr006Promotions(
      current.context,
      identity,
      current.invocations,
      AR006_EVIDENCE_COUNT,
    );

    current.failureStage = "provider_observability";
    current.observation = await collectEvidence(
      current.context,
      current.invocations,
    );
    const pass = campaignPassed({
      invocations: current.invocations,
      markerPreflight: current.markerPreflight,
      observation: current.observation,
      expectedCount: AR006_EVIDENCE_COUNT,
    });
    current.failureStage = "evidence_write";
    await writeEvidence(
      buildEvidenceRecord({
        ...current,
        pass,
        exactBytes: MAX_BYTES,
        invocationCount: AR006_EVIDENCE_COUNT,
      }),
    );
    if (!pass) throw new Error("ADR 0013 provider CPU evidence failed closed.");
  } catch (error) {
    await writeEvidence(
      buildFailureEvidenceRecord({
        ...current,
        exactBytes: MAX_BYTES,
        invocationCount: AR006_EVIDENCE_COUNT,
      }),
    );
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

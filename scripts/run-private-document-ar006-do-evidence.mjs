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
  queryAr006MarkerObservability,
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
const OBSERVABILITY_ATTEMPTS = 6;
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
  const bytes = createExactPdf(MAX_BYTES);
  if (bytes.byteLength !== MAX_BYTES) {
    throw new Error("Synthetic PDF size drifted.");
  }
  const workerDeploymentId = requiredEnv("AR006_WORKER_DEPLOYMENT_ID");
  const workerVersionId = requiredEnv("AR006_WORKER_VERSION_ID");
  assertUuid("AR006_WORKER_DEPLOYMENT_ID", workerDeploymentId);
  assertUuid("AR006_WORKER_VERSION_ID", workerVersionId);
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    durableObjectScriptName: requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER"),
    workerDeploymentId,
    workerVersionId,
    projectId,
    deploymentUrl: httpsOrigin("AR006_DEPLOYMENT_URL"),
    bytes,
    sha256: sha256Hex(bytes),
    token: requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN"),
  };
}

async function queryMarkers(
  context,
  startedAt,
  attempt,
  label = "marker-discovery",
) {
  const timeframe = workerEvidenceTimeframe(startedAt);
  const result = await queryAr006MarkerObservability({
    accountId: context.accountId,
    token: context.token,
    timeframe: timeframe.request,
    queryId: `mariage-os-ar006-do-${label}-${attempt}`,
  });
  return { ...result, window: timeframe.record, attempt };
}

async function invokeMarkerPreflight(context, identity, evidenceId) {
  return probePrivateDocumentLifecycle({
    routeUrl: `${context.deploymentUrl}/api/private-document-promote`,
    token: identity.token,
    projectId: context.projectId,
    documentId: randomUUID(),
    evidenceId,
  });
}

function markerPreflightPassed(result) {
  return (
    result !== null &&
    result.apiSuccess === true &&
    result.eventPageComplete === true &&
    result.discovery.pass === true
  );
}

async function verifyMarkerObservability(context, identity) {
  const evidenceId = randomUUID();
  const startedAt = new Date().toISOString();
  const routeReadiness = await invokeMarkerPreflight(
    context,
    identity,
    evidenceId,
  );
  let latest = null;
  for (let attempt = 1; attempt <= OBSERVABILITY_ATTEMPTS; attempt += 1) {
    const result = await queryMarkers(
      context,
      startedAt,
      attempt,
      "marker-preflight",
    );
    const discovery = discoverAr006SurfaceScripts({
      events: result.events,
      expectedEvidenceIds: [evidenceId],
      durableObjectScriptName: context.durableObjectScriptName,
    });
    latest = { ...result, discovery, routeReadiness };
    if (markerPreflightPassed(latest)) return latest;
    if (attempt < OBSERVABILITY_ATTEMPTS) {
      await delay(nextObservabilityDelayMs(result, OBSERVABILITY_DELAY_MS));
    }
  }
  return latest;
}

async function discoverPagesScript(context, invocations) {
  const expectedEvidenceIds = invocations.map((item) => item.evidenceId);
  const startedAt = invocations[0].startedAt;
  let latest = null;
  for (let attempt = 1; attempt <= OBSERVABILITY_ATTEMPTS; attempt += 1) {
    const result = await queryMarkers(context, startedAt, attempt);
    const discovery = discoverAr006SurfaceScripts({
      events: result.events,
      expectedEvidenceIds,
      durableObjectScriptName: context.durableObjectScriptName,
    });
    latest = { ...result, discovery };
    if (result.apiSuccess && result.eventPageComplete && discovery.pass) {
      return latest;
    }
    if (attempt < OBSERVABILITY_ATTEMPTS) {
      await delay(nextObservabilityDelayMs(result, OBSERVABILITY_DELAY_MS));
    }
  }
  return latest;
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

function maxDelay(...results) {
  return Math.max(
    ...results.map((result) =>
      nextObservabilityDelayMs(result, OBSERVABILITY_DELAY_MS),
    ),
  );
}

async function collectTwoSurfaceEvidence(
  context,
  invocations,
  pagesScriptName,
) {
  const expectedEvidenceIds = invocations.map((item) => item.evidenceId);
  const startedAt = invocations[0].startedAt;
  let latest = null;
  for (let attempt = 1; attempt <= OBSERVABILITY_ATTEMPTS; attempt += 1) {
    const timeframe = workerEvidenceTimeframe(startedAt);
    const pages = await querySurface(
      context,
      pagesScriptName,
      timeframe.request,
      `mariage-os-ar006-pages-evidence-${attempt}`,
    );
    const durableObject = await querySurface(
      context,
      context.durableObjectScriptName,
      timeframe.request,
      `mariage-os-ar006-do-evidence-${attempt}`,
    );
    const evaluation = evaluateAr006TwoSurfaceEvents({
      pagesEvents: pages.events,
      durableObjectEvents: durableObject.events,
      expectedEvidenceIds,
      pagesScriptName,
      durableObjectScriptName: context.durableObjectScriptName,
      durableObjectVersionId: context.workerVersionId,
    });
    latest = {
      pages,
      durableObject,
      evaluation,
      window: timeframe.record,
      attempt,
    };
    if (
      pages.apiSuccess &&
      pages.eventPageComplete &&
      durableObject.apiSuccess &&
      durableObject.eventPageComplete &&
      evaluation.pass
    ) {
      break;
    }
    if (attempt < OBSERVABILITY_ATTEMPTS) {
      await delay(maxDelay(pages, durableObject));
    }
  }
  return latest;
}

async function observeCampaign(context, invocations) {
  const discovery = await discoverPagesScript(context, invocations);
  const pagesScriptName = discovery?.discovery.pagesScriptName ?? null;
  if (pagesScriptName === null) {
    return { discovery, observation: null };
  }
  const observation = await collectTwoSurfaceEvidence(
    context,
    invocations,
    pagesScriptName,
  );
  return { discovery, observation };
}

async function executeCampaign(state) {
  state.failureStage = "authentication";
  const identity = await signInAr006SyntheticUser();
  state.failureStage = "marker_preflight";
  state.markerPreflight = await verifyMarkerObservability(
    state.context,
    identity,
  );
  if (!markerPreflightPassed(state.markerPreflight)) {
    throw new Error("ADR 0012 two-surface marker preflight failed.");
  }
  await delay(20_000);
  state.failureStage = "exact_size_flows";
  await runAr006Promotions(
    state.context,
    identity,
    state.invocations,
    AR006_EVIDENCE_COUNT,
  );
  state.failureStage = "provider_observability";
  const observed = await observeCampaign(state.context, state.invocations);
  state.discovery = observed.discovery;
  state.observation = observed.observation;
}

function evidenceState(context) {
  return {
    context,
    invocations: [],
    markerPreflight: null,
    discovery: null,
    observation: null,
    failureStage: "campaign_setup",
  };
}

async function writeFailedCampaign(state) {
  await writeEvidence(
    buildFailureEvidenceRecord({
      ...state,
      exactBytes: MAX_BYTES,
      invocationCount: AR006_EVIDENCE_COUNT,
    }),
  );
}

async function main() {
  const state = evidenceState(evidenceContext());
  try {
    await executeCampaign(state);
    state.failureStage = "campaign_verdict";
    const pass = campaignPassed({
      invocations: state.invocations,
      markerPreflight: state.markerPreflight,
      discovery: state.discovery,
      observation: state.observation,
      expectedCount: AR006_EVIDENCE_COUNT,
    });
    state.failureStage = "evidence_write";
    await writeEvidence(
      buildEvidenceRecord({
        context: state.context,
        invocations: state.invocations,
        markerPreflight: state.markerPreflight,
        discovery: state.discovery,
        observation: state.observation,
        pass,
        exactBytes: MAX_BYTES,
        invocationCount: AR006_EVIDENCE_COUNT,
      }),
    );
    if (!pass) {
      state.failureStage = "campaign_verdict";
      throw new Error(
        "ADR 0012 provider evidence did not satisfy both CPU gates.",
      );
    }
  } catch (error) {
    await writeFailedCampaign(state);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

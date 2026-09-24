import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import {
  assertUuid,
  httpsOrigin,
  requiredEnv,
  sha256Hex,
} from "./private-document-ar006-do-evidence-env.mjs";
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

const MAX_BYTES = 25_000_000;
const EVIDENCE_PATH = "ar006-adr0012-two-surface-evidence.json";
const OBSERVABILITY_ATTEMPTS = 6;
const OBSERVABILITY_DELAY_MS = 10_000;
function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function signIn() {
  const client = createClient(
    requiredEnv("AR006_SUPABASE_URL"),
    requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const result = await client.auth.signInWithPassword({
    email: requiredEnv("AR006_TEST_USER_EMAIL"),
    password: requiredEnv("AR006_TEST_USER_PASSWORD"),
  });
  if (result.error || !result.data.session?.access_token) {
    throw new Error("Synthetic AR-006 user authentication failed.");
  }
  return { client, token: result.data.session.access_token };
}

async function reserve({
  client,
  projectId,
  documentId,
  bytes,
  sha256,
  index,
}) {
  const result = await client.rpc("manage_private_document", {
    target_action: "reserve_upload",
    target_operation_id: randomUUID(),
    target_project_id: projectId,
    target_document_id: documentId,
    target_venue_id: null,
    target_link_id: null,
    target_expected_revision: null,
    target_document_type: "venue_contract",
    target_title: `AR-006 ADR 0012 exact-size proof ${index + 1}`,
    target_original_filename: `ar006-do-${index + 1}.pdf`,
    target_mime_type: "application/pdf",
    target_size_bytes: bytes.byteLength,
    target_sha256: sha256,
    target_source_id: null,
  });
  if (result.error) throw new Error("Synthetic reservation failed.");
}

async function stage(client, projectId, documentId, bytes) {
  const path = `${projectId}/documents/${documentId}/original`;
  const result = await client.storage
    .from("document-ingest-staging")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (result.error) throw new Error("Synthetic staging upload failed.");
}

async function finalize(client, projectId, documentId) {
  const result = await client.rpc("manage_private_document", {
    target_action: "finalize_upload",
    target_operation_id: randomUUID(),
    target_project_id: projectId,
    target_document_id: documentId,
    target_venue_id: null,
    target_link_id: null,
    target_expected_revision: null,
    target_document_type: null,
    target_title: null,
    target_original_filename: null,
    target_mime_type: null,
    target_size_bytes: null,
    target_sha256: null,
    target_source_id: null,
  });
  if (result.error) throw new Error("Synthetic finalization failed.");
}

async function promote({ baseUrl, token, projectId, documentId, evidenceId }) {
  try {
    const response = await globalThis.fetch(
      `${baseUrl}/api/private-document-promote`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          origin: baseUrl,
          "x-project-id": projectId,
          "x-document-id": documentId,
          "x-mariage-os-ar006-evidence-id": evidenceId,
        },
      },
    );
    const payload = await response.json().catch(() => null);
    return {
      status: response.status,
      success: response.ok && payload?.ok === true,
    };
  } catch {
    return { status: 0, success: false };
  }
}

async function runPromotion(context, identity, index) {
  const documentId = randomUUID();
  const evidenceId = randomUUID();
  await reserve({
    client: identity.client,
    projectId: context.projectId,
    documentId,
    bytes: context.bytes,
    sha256: context.sha256,
    index,
  });
  await stage(identity.client, context.projectId, documentId, context.bytes);
  const startedAt = new Date().toISOString();
  const result = await promote({
    baseUrl: context.deploymentUrl,
    token: identity.token,
    projectId: context.projectId,
    documentId,
    evidenceId,
  });
  const completedAt = new Date().toISOString();
  if (result.success) {
    await finalize(identity.client, context.projectId, documentId);
  }
  return { documentId, evidenceId, startedAt, completedAt, ...result };
}

async function runPromotions(context, identity) {
  const invocations = [];
  for (let index = 0; index < AR006_EVIDENCE_COUNT; index += 1) {
    invocations.push(await runPromotion(context, identity, index));
    if (index + 1 < AR006_EVIDENCE_COUNT) await delay(1_500);
  }
  return invocations;
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

async function queryMarkers(context, startedAt, attempt) {
  const timeframe = workerEvidenceTimeframe(startedAt);
  const result = await queryAr006MarkerObservability({
    accountId: context.accountId,
    token: context.token,
    timeframe: timeframe.request,
    queryId: `mariage-os-ar006-do-marker-discovery-${attempt}`,
  });
  return { ...result, window: timeframe.record, attempt };
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
    if (result.apiSuccess && discovery.pass) return latest;
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
    });
    latest = {
      pages,
      durableObject,
      evaluation,
      window: timeframe.record,
      attempt,
    };
    if (pages.apiSuccess && durableObject.apiSuccess && evaluation.pass) break;
    if (attempt < OBSERVABILITY_ATTEMPTS) {
      await delay(maxDelay(pages, durableObject));
    }
  }
  return latest;
}

function sanitizedQuery(result) {
  if (result === null) return null;
  return {
    httpStatus: result.httpStatus,
    apiSuccess: result.apiSuccess,
    providerErrorCodes: result.providerErrorCodes,
    retryAfterMs: result.retryAfterMs,
  };
}

function sanitizedDiscovery(result) {
  if (result === null) return null;
  return {
    attempt: result.attempt,
    window: result.window,
    query: sanitizedQuery(result),
    markerCount: result.discovery.markerCount,
    failures: result.discovery.failures,
    pagesScriptName: result.discovery.pagesScriptName,
    pass: result.discovery.pass,
  };
}

function sanitizedEvaluation(observation) {
  if (observation === null) return null;
  return {
    attempt: observation.attempt,
    window: observation.window,
    pagesQuery: sanitizedQuery(observation.pages),
    durableObjectQuery: sanitizedQuery(observation.durableObject),
    evaluation: observation.evaluation,
  };
}

function evidenceRecord({
  context,
  invocations,
  discovery,
  observation,
  pass,
}) {
  return {
    schema: "mariage-os.wp29c.ar006.adr0012-two-surface.v1",
    generatedAt: new Date().toISOString(),
    gitCommit: requiredEnv("AR006_EXPECTED_SHA"),
    pagesProject: requiredEnv("AR006_PAGES_PROJECT"),
    deployment: {
      id: requiredEnv("AR006_DEPLOYMENT_ID"),
      url: context.deploymentUrl,
      branch: requiredEnv("AR006_DEPLOYMENT_BRANCH"),
    },
    worker: {
      name: context.durableObjectScriptName,
      deploymentId: context.workerDeploymentId,
      versionId: context.workerVersionId,
    },
    workersPlanAttestation: "Workers Free / isolated non-production",
    exactBytes: MAX_BYTES,
    sha256: context.sha256,
    projectId: context.projectId,
    invocationCount: AR006_EVIDENCE_COUNT,
    invocations,
    discovery: sanitizedDiscovery(discovery),
    provider: sanitizedEvaluation(observation),
    paidCpuEntitlementAttestedAbsent: true,
    pass,
  };
}

async function writeEvidence(record) {
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
  console.log(`ADR 0012 provider evidence written to ${EVIDENCE_PATH}.`);
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

function campaignPassed(invocations, discovery, observation) {
  return [
    invocations.length === AR006_EVIDENCE_COUNT,
    invocations.every((item) => item.success && item.status === 200),
    discovery?.apiSuccess === true,
    discovery?.discovery.pass === true,
    observation?.pages.apiSuccess === true,
    observation?.durableObject.apiSuccess === true,
    observation?.evaluation.pass === true,
  ].every(Boolean);
}

async function main() {
  const context = evidenceContext();
  const identity = await signIn();
  await delay(3_000);
  const invocations = await runPromotions(context, identity);
  const { discovery, observation } = await observeCampaign(
    context,
    invocations,
  );
  const pass = campaignPassed(invocations, discovery, observation);
  await writeEvidence(
    evidenceRecord({ context, invocations, discovery, observation, pass }),
  );
  if (!pass) {
    throw new Error(
      "ADR 0012 provider evidence did not satisfy both CPU gates.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { URL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  CPU_BUDGET_MS,
  evaluateAr006WorkerEvents,
  observabilityErrorCodes,
  observabilityEvents,
} from "./private-document-ar006-worker-metrics.mjs";
import { workerEvidenceTimeframe } from "./private-document-ar006-observability-timeframe.mjs";
import { createExactPdf } from "./private-document-ar006-synthetic-pdf.mjs";

const MAX_BYTES = 25_000_000;
const INVOCATION_COUNT = 10;
const API_ROOT = "https://api.cloudflare.com/client/v4/accounts";
const EVIDENCE_PATH = "ar006-workers-free-evidence.json";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const QUERY_LIMIT = 100;
const OBSERVABILITY_ATTEMPTS = 6;
const OBSERVABILITY_DELAY_MS = 10_000;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function httpsOrigin(name) {
  const value = new URL(requiredEnv(name));
  if (value.protocol !== "https:") throw new Error(`${name} must use HTTPS.`);
  return value.origin;
}

function assertUuid(name, value) {
  if (!UUID_PATTERN.test(value)) throw new Error(`${name} must be a UUID.`);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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
    target_title: `AR-006 exact-size proof ${index + 1}`,
    target_original_filename: `ar006-${index + 1}.pdf`,
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

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function runPromotion({
  identity,
  deploymentUrl,
  projectId,
  bytes,
  sha256,
  index,
}) {
  const documentId = randomUUID();
  const evidenceId = randomUUID();
  await reserve({
    client: identity.client,
    projectId,
    documentId,
    bytes,
    sha256,
    index,
  });
  await stage(identity.client, projectId, documentId, bytes);
  const startedAt = new Date().toISOString();
  const result = await promote({
    baseUrl: deploymentUrl,
    token: identity.token,
    projectId,
    documentId,
    evidenceId,
  });
  const completedAt = new Date().toISOString();
  if (result.success) await finalize(identity.client, projectId, documentId);
  return { documentId, evidenceId, startedAt, completedAt, ...result };
}

async function runPromotions({
  identity,
  deploymentUrl,
  projectId,
  bytes,
  sha256,
}) {
  const invocations = [];
  for (let index = 0; index < INVOCATION_COUNT; index += 1) {
    invocations.push(
      await runPromotion({
        identity,
        deploymentUrl,
        projectId,
        bytes,
        sha256,
        index,
      }),
    );
    if (index + 1 < INVOCATION_COUNT) await delay(1_500);
  }
  return invocations;
}

function queryBody(workerName, timeframe) {
  return {
    queryId: "mariage-os-ar006-worker-evidence",
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
          value: workerName,
        },
      ],
    },
  };
}

async function queryObservability(context, timeframe) {
  const response = await globalThis.fetch(
    `${API_ROOT}/${encodeURIComponent(context.accountId)}/workers/observability/telemetry/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(queryBody(context.workerName, timeframe)),
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
  };
}

async function collectWorkerEvidence(context, invocations) {
  const expectedEvidenceIds = invocations.map((item) => item.evidenceId);
  const startedAt = invocations[0].startedAt;
  let latest = null;
  for (let attempt = 1; attempt <= OBSERVABILITY_ATTEMPTS; attempt += 1) {
    const timeframe = workerEvidenceTimeframe(startedAt);
    const result = await queryObservability(context, timeframe.request);
    const evaluation = evaluateAr006WorkerEvents(
      result.events,
      expectedEvidenceIds,
      context.workerName,
    );
    latest = {
      ...result,
      window: timeframe.record,
      attempt,
      evaluation,
    };
    if (result.apiSuccess && evaluation.pass) break;
    if (attempt < OBSERVABILITY_ATTEMPTS) await delay(OBSERVABILITY_DELAY_MS);
  }
  return latest;
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
  const deploymentUrl = httpsOrigin("AR006_DEPLOYMENT_URL");
  const bytes = createExactPdf(MAX_BYTES);
  if (bytes.byteLength !== MAX_BYTES) {
    throw new Error("Synthetic PDF size drifted.");
  }
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    workerName: requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER"),
    projectId,
    deploymentUrl,
    bytes,
    sha256: digest(bytes),
  };
}

function providerResult(observation) {
  if (observation === null) {
    return {
      httpStatus: null,
      apiSuccess: false,
      providerErrorCodes: [],
      queryAttempt: null,
      observationWindow: null,
      measurements: [],
      failures: [{ code: "no_provider_query", evidenceId: null }],
    };
  }
  return {
    httpStatus: observation.httpStatus,
    apiSuccess: observation.apiSuccess,
    providerErrorCodes: observation.providerErrorCodes,
    queryAttempt: observation.attempt,
    observationWindow: observation.window,
    measurements: observation.evaluation.measurements,
    failures: observation.evaluation.failures,
  };
}

function evidenceRecord({ context, invocations, observation, pass }) {
  return {
    schema: "mariage-os.wp29c.ar006.worker-observability.v1",
    generatedAt: new Date().toISOString(),
    gitCommit: requiredEnv("AR006_EXPECTED_SHA"),
    pagesProject: requiredEnv("AR006_PAGES_PROJECT"),
    deployment: {
      id: requiredEnv("AR006_DEPLOYMENT_ID"),
      url: context.deploymentUrl,
      branch: requiredEnv("AR006_DEPLOYMENT_BRANCH"),
    },
    worker: { name: context.workerName },
    workersPlanAttestation: "Workers Free / isolated non-production",
    exactBytes: MAX_BYTES,
    sha256: context.sha256,
    projectId: context.projectId,
    invocationCount: INVOCATION_COUNT,
    invocations,
    provider: providerResult(observation),
    cpuBudgetMs: CPU_BUDGET_MS,
    paidCpuEntitlementAttestedAbsent: true,
    pass,
  };
}

async function writeEvidence(evidence) {
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  console.log(`AR-006 Worker provider evidence written to ${EVIDENCE_PATH}.`);
}

async function main() {
  const context = evidenceContext();
  const identity = await signIn();
  await delay(3_000);
  const invocations = await runPromotions({ identity, ...context });
  const observation = await collectWorkerEvidence(context, invocations);
  const pass =
    invocations.length === INVOCATION_COUNT &&
    invocations.every((item) => item.success && item.status === 200) &&
    observation.apiSuccess &&
    observation.evaluation.pass;
  await writeEvidence(
    evidenceRecord({ context, invocations, observation, pass }),
  );
  if (!pass) {
    throw new Error(
      "AR-006 Worker provider evidence did not satisfy the Free CPU gate.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

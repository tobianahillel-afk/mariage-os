import { Buffer } from "node:buffer";
import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { URL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const MAX_BYTES = 25_000_000;
const INVOCATION_COUNT = 10;
const CPU_BUDGET_MS = 10;
const ANALYTICS_URL = "https://api.cloudflare.com/client/v4/graphql";
const EVIDENCE_PATH = "ar006-workers-free-evidence.json";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

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

function createExactPdf() {
  const header = Buffer.from("%PDF-1.4\n", "ascii");
  const objectOne = Buffer.from(
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "ascii",
  );
  const objectTwo = Buffer.from(
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "ascii",
  );
  const objectThree = Buffer.from(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1 1] >>\nendobj\n",
    "ascii",
  );

  function build(paddingBytes) {
    const padding = Buffer.alloc(paddingBytes, 0x41);
    if (paddingBytes >= 2) {
      padding[0] = 0x25;
      padding[paddingBytes - 1] = 0x0a;
    }
    const offsetOne = header.length + padding.length;
    const offsetTwo = offsetOne + objectOne.length;
    const offsetThree = offsetTwo + objectTwo.length;
    const xrefOffset = offsetThree + objectThree.length;
    const xref = Buffer.from(
      `xref\n0 4\n0000000000 65535 f \n${String(offsetOne).padStart(10, "0")} 00000 n \n${String(offsetTwo).padStart(10, "0")} 00000 n \n${String(offsetThree).padStart(10, "0")} 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
      "ascii",
    );
    return Buffer.concat([
      header,
      padding,
      objectOne,
      objectTwo,
      objectThree,
      xref,
    ]);
  }

  let paddingBytes = MAX_BYTES - build(0).length;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const pdf = build(paddingBytes);
    if (pdf.length === MAX_BYTES) return pdf;
    paddingBytes += MAX_BYTES - pdf.length;
  }
  throw new Error("Unable to construct an exact-size synthetic PDF.");
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

async function promote(baseUrl, token, projectId, documentId) {
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
  const result = await promote(
    deploymentUrl,
    identity.token,
    projectId,
    documentId,
  );
  const completedAt = new Date().toISOString();
  if (result.success) {
    await finalize(identity.client, projectId, documentId);
  }
  return { documentId, startedAt, completedAt, ...result };
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

function analyticsWindow(invocations) {
  const start = new Date(invocations[0].startedAt);
  const end = new Date(invocations.at(-1).completedAt);
  start.setSeconds(start.getSeconds() - 1);
  end.setSeconds(end.getSeconds() + 2);
  return { start: start.toISOString(), end: end.toISOString() };
}

function analyticsRows(payload) {
  try {
    const rows = payload.data.viewer.accounts[0].workersInvocationsAdaptive;
    if (!Array.isArray(rows)) {
      throw new Error("Unexpected analytics rows.");
    }
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
  if (!response.ok) throw new Error("Cloudflare analytics query failed.");
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error("Cloudflare analytics query failed.");
  }
  return analyticsRows(payload);
}

function requestCount(rows) {
  return rows.reduce((sum, row) => sum + Number(row.sum.requests), 0);
}

async function collectMetrics(scriptName, invocations) {
  const window = analyticsWindow(invocations);
  let rows = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    rows = await queryAnalytics(scriptName, window);
    if (requestCount(rows) >= INVOCATION_COUNT) break;
    await delay(15_000);
  }
  return { window, rows };
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function metricEvidence(rows) {
  return rows.map((row) => ({
    datetime: String(row.dimensions.datetime),
    status: String(row.dimensions.status),
    requests: Number(row.sum.requests),
    errors: Number(row.sum.errors),
    cpuTimeP50Ms: finiteNumber(row.quantiles.cpuTimeP50),
    cpuTimeP99Ms: finiteNumber(row.quantiles.cpuTimeP99),
  }));
}

function measurementPass(row) {
  if (row.requests !== 1) return false;
  if (row.errors !== 0) return false;
  if (row.status !== "success") return false;
  if (row.cpuTimeP50Ms === null) return false;
  if (row.cpuTimeP99Ms === null) return false;
  if (row.cpuTimeP50Ms > CPU_BUDGET_MS) return false;
  if (row.cpuTimeP99Ms > CPU_BUDGET_MS) return false;
  return true;
}

function metricsPass(measurements) {
  const totalRequests = measurements.reduce(
    (sum, row) => sum + row.requests,
    0,
  );
  if (totalRequests !== INVOCATION_COUNT) return false;
  if (measurements.length !== INVOCATION_COUNT) return false;
  return measurements.every(measurementPass);
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
  const bytes = createExactPdf();
  if (bytes.byteLength !== MAX_BYTES) {
    throw new Error("Synthetic PDF size drifted.");
  }
  return { projectId, deploymentUrl, bytes, sha256: digest(bytes) };
}

function evidenceRecord({ context, invocations, metrics, measurements, pass }) {
  return {
    schema: "mariage-os.wp29c.ar006.v1",
    generatedAt: new Date().toISOString(),
    gitCommit: requiredEnv("AR006_EXPECTED_SHA"),
    pagesProject: requiredEnv("AR006_PAGES_PROJECT"),
    deployment: {
      id: requiredEnv("AR006_DEPLOYMENT_ID"),
      url: context.deploymentUrl,
      scriptName: requiredEnv("AR006_SCRIPT_NAME"),
      branch: requiredEnv("AR006_DEPLOYMENT_BRANCH"),
    },
    workersPlanAttestation: "Workers Free / isolated non-production",
    exactBytes: MAX_BYTES,
    sha256: context.sha256,
    projectId: context.projectId,
    invocationCount: INVOCATION_COUNT,
    invocations,
    analyticsWindow: metrics.window,
    providerCpuMeasurements: measurements,
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
  console.log(`AR-006 provider evidence written to ${EVIDENCE_PATH}.`);
}

async function main() {
  const context = evidenceContext();
  const identity = await signIn();
  await delay(3_000);
  const invocations = await runPromotions({ identity, ...context });
  const metrics = await collectMetrics(
    requiredEnv("AR006_SCRIPT_NAME"),
    invocations,
  );
  const measurements = metricEvidence(metrics.rows);
  const pass =
    invocations.every((item) => item.success) && metricsPass(measurements);
  await writeEvidence(
    evidenceRecord({ context, invocations, metrics, measurements, pass }),
  );
  if (!pass) {
    throw new Error(
      "AR-006 provider evidence did not satisfy the Free CPU gate.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

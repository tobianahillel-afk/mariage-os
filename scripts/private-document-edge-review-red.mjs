import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { clearTimeout, setTimeout } from "node:timers";
import { URL } from "node:url";
import {
  BUCKET,
  MAX_BYTES,
  assertNoAttestation,
  assertNoTrustedObject,
  assertRejected,
  assertStagedObjectPresent,
  documentUploadStatus,
  invoke,
  localSupabaseEnvironment,
  pdfBytes,
  randomUUID,
  reserve,
  rpcFailure,
  stage,
  storagePath,
} from "./private-document-edge-helpers.mjs";

const LOCAL_APP_ORIGIN = "http://127.0.0.1:4173";
const UNKNOWN_ORIGIN = "https://attacker.invalid";
const OPEN_ENDED_RESPONSE_TIMEOUT_MS = 5_000;

function edgeRuntimeIp() {
  return execFileSync(
    "docker",
    [
      "inspect",
      "--format",
      "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}",
      "supabase_edge_runtime_mariage-os",
    ],
    { encoding: "utf8" },
  ).trim();
}

function edgeRuntimeUrl() {
  return `http://${edgeRuntimeIp()}:8081/private-document-ingest`;
}

function runtimeRequestHeaders({ token, projectId, documentId, anonKey }) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${token}`,
    "content-type": "application/octet-stream",
    "transfer-encoding": "chunked",
    "x-project-id": projectId,
    "x-document-id": documentId,
  };
}

function openEndedBodyInvoke({ token, projectId, documentId }) {
  const { apiUrl, anonKey } = localSupabaseEnvironment();
  const endpoint = new URL(`${apiUrl}/functions/v1/private-document-ingest`);
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;
    const request = httpRequest(
      endpoint,
      {
        method: "POST",
        headers: runtimeRequestHeaders({
          token,
          projectId,
          documentId,
          anonKey,
        }),
      },
      (response) => {
        const status = response.statusCode ?? 0;
        response.resume();
        response.on("end", () => finish(resolve, status));
      },
    );

    function finish(callback, value) {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      request.destroy();
      callback(value);
    }

    request.on("error", (error) => finish(reject, error));
    request.write(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]));
    timer = setTimeout(
      () =>
        finish(
          reject,
          new Error(
            "Public promotion endpoint waited for sender EOF on a framed body.",
          ),
        ),
      OPEN_ENDED_RESPONSE_TIMEOUT_MS,
    );
  });
}

async function preflight(origin) {
  const { anonKey } = localSupabaseEnvironment();
  return globalThis.fetch(edgeRuntimeUrl(), {
    method: "OPTIONS",
    headers: {
      apikey: anonKey,
      origin,
      "access-control-request-method": "POST",
      "access-control-request-headers":
        "authorization,content-type,x-project-id,x-document-id",
    },
  });
}

async function unknownOriginPost({ token, projectId, documentId }) {
  const { anonKey } = localSupabaseEnvironment();
  return globalThis.fetch(edgeRuntimeUrl(), {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      origin: UNKNOWN_ORIGIN,
      "x-project-id": projectId,
      "x-document-id": documentId,
    },
  });
}

function recoverySource() {
  const source = readFileSync(
    new URL(
      "../supabase/functions/private-document-ingest/index.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const start = source.indexOf(
    "async function storageObjectMatchesReservation(",
  );
  const end = source.indexOf("\nasync function hasWritePermission", start);
  assert.notEqual(start, -1, "Trusted object verifier must exist.");
  assert.notEqual(end, -1, "Trusted object verifier must be bounded.");
  return source.slice(start, end);
}

async function assertOpenEndedBodyDenied(context, documentId) {
  const status = await openEndedBodyInvoke({
    token: context.writer.token,
    projectId: context.projectId,
    documentId,
  });
  assert.equal(
    status,
    413,
    "Framed request bodies must be rejected before sender EOF.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId,
  });
  await assertStagedObjectPresent({
    admin: context.admin,
    projectId: context.projectId,
    documentId,
  });
}

async function assertCorsOriginPolicy(context, document) {
  const allowed = await preflight(LOCAL_APP_ORIGIN);
  const denied = await preflight(UNKNOWN_ORIGIN);
  assert.deepEqual(
    {
      allowedOrigin: allowed.headers.get("access-control-allow-origin"),
      allowedStatus: allowed.status,
      deniedOrigin: denied.headers.get("access-control-allow-origin"),
      deniedStatus: denied.status,
    },
    {
      allowedOrigin: LOCAL_APP_ORIGIN,
      allowedStatus: 204,
      deniedOrigin: null,
      deniedStatus: 204,
    },
    "CORS must allow only the configured application origin.",
  );

  const rejected = await unknownOriginPost({
    token: context.writer.token,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  assert.equal(rejected.status, 403, "Unknown browser origins must be denied.");
  assert.equal(rejected.headers.get("access-control-allow-origin"), null);
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

function assertRecoveryResourceBoundSource() {
  const source = recoverySource();
  const infoIndex = source.indexOf(".info(");
  const downloadIndex = source.indexOf(".download(");
  assert.ok(
    infoIndex >= 0 && downloadIndex >= 0 && infoIndex < downloadIndex,
    "Storage metadata bounds must be checked before object materialization.",
  );
  assert.ok(
    source.includes("MAX_BYTES") && source.includes("size_bytes"),
    "Object verification must enforce both frozen and reserved byte bounds.",
  );
}

function assertRecoveryStoredMimeSource() {
  const source = recoverySource();
  assert.ok(
    source.includes(".info("),
    "Authoritative MIME metadata is required.",
  );
  assert.ok(
    source.includes('"application/pdf"'),
    "Object verification must require authoritative application/pdf metadata.",
  );
}

async function runOversizedExistingObjectScenario(context) {
  const documentId = randomUUID();
  const expected = pdfBytes(512);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes: expected,
    title: "Synthetic oversized recovery object",
  });
  const path = storagePath(context.projectId, documentId);
  context.objectPaths.push(path);
  rpcFailure(
    (
      await stage({
        client: context.writer.client,
        projectId: context.projectId,
        documentId,
        bytes: expected,
      })
    ).error,
    "Synthetic staging precondition",
  );
  const oversized = new Uint8Array(MAX_BYTES + 1);
  oversized.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const injected = await context.admin.storage
    .from(BUCKET)
    .upload(path, oversized, {
      contentType: "application/pdf",
      upsert: false,
    });
  rpcFailure(injected.error, "Synthetic oversized recovery object injection");
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId,
    }),
    "Oversized existing canonical object must fail closed.",
  );
  assertNoAttestation({ projectId: context.projectId, documentId });
  assert.equal(
    documentUploadStatus({ projectId: context.projectId, documentId }),
    "pending",
  );
}

async function runWrongStoredMimeScenario(context) {
  const documentId = randomUUID();
  const expected = pdfBytes(448);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes: expected,
    title: "Synthetic wrong stored MIME",
  });
  const path = storagePath(context.projectId, documentId);
  context.objectPaths.push(path);
  rpcFailure(
    (
      await stage({
        client: context.writer.client,
        projectId: context.projectId,
        documentId,
        bytes: expected,
      })
    ).error,
    "Synthetic staging precondition",
  );
  const injected = await context.admin.storage
    .from(BUCKET)
    .upload(path, expected, {
      contentType: "application/octet-stream",
      upsert: false,
    });
  rpcFailure(injected.error, "Synthetic wrong-MIME recovery object injection");
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId,
    }),
    "Wrong canonical MIME must fail closed on recovery.",
  );
  assertNoAttestation({ projectId: context.projectId, documentId });
}

function failureMessage(error) {
  return error instanceof Error ? error.message : "unknown failure";
}

async function recordFinding(failures, finding, check) {
  try {
    await check();
    console.log(`PASS ${finding} remediation contract`);
  } catch (error) {
    failures.push(`${finding}: ${failureMessage(error)}`);
  }
}

async function prepareOpenEndedDocument(context) {
  const documentId = randomUUID();
  const bytes = pdfBytes(512);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title: "Synthetic bodyless promotion boundary",
  });
  context.objectPaths.push(storagePath(context.projectId, documentId));
  rpcFailure(
    (
      await stage({
        client: context.writer.client,
        projectId: context.projectId,
        documentId,
        bytes,
      })
    ).error,
    "Synthetic staging precondition",
  );
  return { documentId, bytes };
}

export async function runReviewFindingRedScenarios(context) {
  const failures = [];
  const document = await prepareOpenEndedDocument(context);
  await recordFinding(failures, "WP29C-AR-004", async () => {
    await assertCorsOriginPolicy(context, document);
  });
  await recordFinding(failures, "WP29C-AR-002-source", async () => {
    assertRecoveryResourceBoundSource();
  });
  await recordFinding(failures, "WP29C-AR-003-source", async () => {
    assertRecoveryStoredMimeSource();
  });
  await recordFinding(failures, "WP29C-AR-002-live", async () => {
    await runOversizedExistingObjectScenario(context);
  });
  await recordFinding(failures, "WP29C-AR-003-live", async () => {
    await runWrongStoredMimeScenario(context);
  });
  await recordFinding(failures, "WP29C-AR-001", async () => {
    await assertOpenEndedBodyDenied(context, document.documentId);
  });

  if (failures.length > 0) {
    throw new Error(
      `WP-2.9C review-finding RED remains open:\n- ${failures.join("\n- ")}`,
    );
  }
  console.log("PASS WP-2.9C review findings remediated");
}

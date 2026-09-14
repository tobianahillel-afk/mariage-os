import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { request as httpRequest } from "node:http";
import {
  assertNoTrustedObject,
  assertReady,
  assertRejected,
  documentUploadStatus,
  finalize,
  invoke,
  localSupabaseEnvironment,
  pdfBytes,
  randomUUID,
  reserve,
  setMembershipRole,
  setMembershipStatus,
  storagePath,
} from "./private-document-edge-helpers.mjs";

function rawInvoke({ token, projectId, documentId, body }) {
  const { apiUrl, anonKey } = localSupabaseEnvironment();
  return globalThis.fetch(`${apiUrl}/functions/v1/private-document-ingest`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/octet-stream",
      "x-project-id": projectId,
      "x-document-id": documentId,
      "x-document-mime-type": "application/pdf",
    },
    body,
  });
}

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

function chunkedOversizeInvoke({ token, projectId, documentId, bytes }) {
  const { anonKey } = localSupabaseEnvironment();
  const hostname = edgeRuntimeIp();
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        hostname,
        port: 8081,
        path: "/private-document-ingest",
        method: "POST",
        headers: {
          apikey: anonKey,
          authorization: `Bearer ${token}`,
          "content-type": "application/octet-stream",
          "transfer-encoding": "chunked",
          "x-project-id": projectId,
          "x-document-id": documentId,
          "x-document-mime-type": "application/pdf",
        },
      },
      (response) => {
        response.on("error", reject);
        response.on("end", () => resolve(response.statusCode ?? 0));
        response.resume();
      },
    );
    request.on("error", reject);
    for (let offset = 0; offset < bytes.byteLength; offset += 1_000_000) {
      request.write(bytes.subarray(offset, offset + 1_000_000));
    }
    request.end(new Uint8Array([0]));
  });
}

function finalizeResult({ client, projectId, documentId }) {
  return client.rpc("manage_private_document", {
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
}

export async function assertMalformedJwtDenied(context, document) {
  const response = await rawInvoke({
    token: "malformed.jwt",
    projectId: context.projectId,
    documentId: document.documentId,
    body: document.bytes,
  });
  assert.equal(
    response.status,
    401,
    "Malformed JWT must be denied by runtime.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  console.log("PASS malformed JWT denied by trusted-ingest runtime");
}

export async function assertChunkedOversizeDenied(context, document) {
  const status = await chunkedOversizeInvoke({
    token: context.writer.token,
    projectId: context.projectId,
    documentId: document.documentId,
    bytes: document.bytes,
  });
  assert.equal(
    status,
    413,
    "Direct Edge Runtime payload above 25,000,000 bytes must be rejected.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  console.log("PASS direct Edge Runtime rejects chunked oversize request");
}

export async function runFinalizeAuthorizationScenario(context) {
  const documentId = randomUUID();
  const bytes = pdfBytes(640);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title: "Synthetic finalize reauthorization PDF",
  });
  context.objectPaths.push(storagePath(context.projectId, documentId));
  const ingest = await invoke({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
  });
  assert.equal(ingest.error, null, "Precondition ingest must succeed.");
  assert.equal(
    documentUploadStatus({ projectId: context.projectId, documentId }),
    "pending",
  );

  const membership = {
    projectId: context.projectId,
    userId: context.writer.userId,
  };
  const finalization = {
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
  };
  setMembershipRole({ ...membership, roleKey: "viewer" });
  assertRejected(
    await finalizeResult(finalization),
    "Role downgrade after ingest must deny finalize.",
  );
  assert.equal(
    documentUploadStatus({ projectId: context.projectId, documentId }),
    "pending",
  );

  setMembershipRole({ ...membership, roleKey: "owner" });
  setMembershipStatus({ ...membership, status: "revoked" });
  assertRejected(
    await finalizeResult(finalization),
    "Membership revocation after ingest must deny finalize.",
  );
  assert.equal(
    documentUploadStatus({ projectId: context.projectId, documentId }),
    "pending",
  );

  setMembershipStatus({ ...membership, status: "active" });
  await finalize(finalization);
  assertReady({ projectId: context.projectId, documentId });
  console.log("PASS finalize reauthorizes after role downgrade and revocation");
}

import assert from "node:assert/strict";
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
  stage,
  storagePath,
} from "./private-document-edge-helpers.mjs";

function rawInvoke({ token, projectId, documentId }) {
  const { apiUrl, anonKey } = localSupabaseEnvironment();
  return globalThis.fetch(`${apiUrl}/functions/v1/private-document-ingest`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "x-project-id": projectId,
      "x-document-id": documentId,
    },
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

function assertPending(projectId, documentId) {
  assert.equal(documentUploadStatus({ projectId, documentId }), "pending");
}

export async function assertMalformedJwtDenied(context, document) {
  const response = await rawInvoke({
    token: "malformed.jwt",
    projectId: context.projectId,
    documentId: document.documentId,
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
  console.log("PASS malformed JWT denied by promotion runtime");
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
  const staged = await stage({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
  });
  assert.equal(staged.error, null, "Precondition staging must succeed.");
  const ingest = await invoke({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
  });
  assert.equal(ingest.error, null, "Precondition promotion must succeed.");
  assertPending(context.projectId, documentId);

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
    "Role downgrade after promotion must deny finalize.",
  );
  assertPending(context.projectId, documentId);

  setMembershipRole({ ...membership, roleKey: "owner" });
  setMembershipStatus({ ...membership, status: "revoked" });
  assertRejected(
    await finalizeResult(finalization),
    "Membership revocation after promotion must deny finalize.",
  );
  assertPending(context.projectId, documentId);

  setMembershipStatus({ ...membership, status: "active" });
  await finalize(finalization);
  assertReady({ projectId: context.projectId, documentId });
  console.log("PASS finalize reauthorizes after promotion authority changes");
}

import assert from "node:assert/strict";
import {
  assertNoStagedObject,
  assertNoTrustedObject,
  pdfBytes,
  promotionUrl,
  randomUUID,
  reserve,
  rpcFailure,
  stage,
  storagePath,
} from "./private-document-edge-helpers.mjs";

async function invokeTrustedAbandon({
  token,
  projectId,
  documentId,
  operationId,
}) {
  const response = await globalThis.fetch(promotionUrl(), {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`,
      "x-project-id": projectId,
      "x-document-id": documentId,
      "x-operation-id": operationId,
    },
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function assertReservationAbsent(context, documentId) {
  const result = await context.writer.client
    .from("documents")
    .select("id")
    .eq("project_id", context.projectId)
    .eq("id", documentId)
    .maybeSingle();
  assert.equal(
    result.error,
    null,
    "Authorized writer abandon lookup must remain readable.",
  );
  assert.equal(
    result.data,
    null,
    "Trusted abandon must remove pending metadata.",
  );
}

async function prepareInterruptedStaging(context) {
  const documentId = randomUUID();
  const bytes = pdfBytes(704);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title: "Synthetic interrupted staging abandon",
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
    "Interrupted staging abandon precondition",
  );
  return documentId;
}

async function assertTrustedAbandonResult(context, documentId, result) {
  assert.equal(
    result.response.status,
    200,
    "Trusted abandon must clean an interrupted staged upload.",
  );
  assert.deepEqual(result.data, { ok: true, absent: true });
  await assertNoStagedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId,
  });
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId,
  });
  await assertReservationAbsent(context, documentId);
}

export async function runInterruptedStagingAbandonRed(context) {
  const documentId = await prepareInterruptedStaging(context);
  const request = {
    token: context.writer.token,
    projectId: context.projectId,
    documentId,
    operationId: randomUUID(),
  };

  await assertTrustedAbandonResult(
    context,
    documentId,
    await invokeTrustedAbandon(request),
  );

  const retry = await invokeTrustedAbandon(request);
  assert.equal(
    retry.response.status,
    200,
    "Trusted abandon retry must be idempotent.",
  );
  await assertTrustedAbandonResult(context, documentId, retry);

  console.log("PASS interrupted staging trusted abandon and idempotent retry");
}

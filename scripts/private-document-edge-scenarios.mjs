import assert from "node:assert/strict";
import {
  assertMalformedJwtDenied,
  runFinalizeAuthorizationScenario,
} from "./private-document-pages-adversarial-scenarios.mjs";
import {
  runCanonicalIntegrityScenarios,
  runStagingIntegrityScenarios,
} from "./private-document-edge-integrity-scenarios.mjs";
import { runReviewFindingRedScenarios } from "./private-document-pages-review.mjs";
import {
  BUCKET,
  STAGING_BUCKET,
  addMembership,
  assertNoStagedObject,
  assertNoTrustedObject,
  assertReady,
  assertRejected,
  assertStagedObjectPresent,
  cleanupHarness,
  createClient,
  createProjectFixture,
  createSyntheticIdentity,
  finalize,
  invoke,
  localSupabaseEnvironment,
  pdfBytes,
  randomUUID,
  reserve,
  rpcFailure,
  setMembershipRole,
  setMembershipStatus,
  stage,
  storagePath,
} from "./private-document-edge-helpers.mjs";

async function setupHarness() {
  const { apiUrl, anonKey, serviceRoleKey } = localSupabaseEnvironment();
  const admin = createClient(apiUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anonymous = createClient(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const projectId = randomUUID();
  const userIds = [];
  const objectPaths = [];
  const identityInput = { admin, apiUrl, anonKey };

  const writer = await createSyntheticIdentity({
    ...identityInput,
    label: "writer",
  });
  userIds.push(writer.userId);
  createProjectFixture({ projectId, userId: writer.userId });
  addMembership({ projectId, userId: writer.userId, roleKey: "owner" });

  const viewer = await createSyntheticIdentity({
    ...identityInput,
    label: "viewer",
  });
  userIds.push(viewer.userId);
  addMembership({ projectId, userId: viewer.userId, roleKey: "viewer" });
  const outsider = await createSyntheticIdentity({
    ...identityInput,
    label: "outsider",
  });
  userIds.push(outsider.userId);
  return {
    admin,
    anonymous,
    projectId,
    userIds,
    objectPaths,
    writer,
    viewer,
    outsider,
  };
}

async function prepareSmallDocument(context) {
  const documentId = randomUUID();
  const bytes = pdfBytes(512);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title: "Synthetic small PDF",
  });
  context.objectPaths.push(storagePath(context.projectId, documentId));
  return { documentId, bytes };
}

async function assertStagingMutationDenied(context, document) {
  const path = storagePath(context.projectId, document.documentId);
  const storage = context.writer.client.storage.from(STAGING_BUCKET);
  assertRejected(
    await storage.download(path),
    "Authenticated writer must not read staged private bytes.",
  );
  assertRejected(
    await storage.update(path, document.bytes, {
      contentType: "application/pdf",
    }),
    "Authenticated writer must not update staged private bytes.",
  );
  const removed = await storage.remove([path]);
  assert.ok(
    removed.error !== null || removed.data.length === 0,
    "Authenticated writer must not delete staged private bytes.",
  );
  await assertStagedObjectPresent({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

async function runStagingAuthorizationScenarios(context, document) {
  const common = {
    projectId: context.projectId,
    documentId: document.documentId,
    bytes: document.bytes,
  };
  assertRejected(
    await stage({ ...common, client: context.anonymous }),
    "Anonymous clients must not write staging bytes.",
  );
  assertRejected(
    await stage({ ...common, client: context.viewer.client }),
    "documents.read must not write staging bytes.",
  );
  assertRejected(
    await stage({ ...common, client: context.outsider.client }),
    "Project outsiders must not write staging bytes.",
  );
  assertRejected(
    await stage({
      ...common,
      projectId: randomUUID(),
      client: context.writer.client,
    }),
    "Caller-substituted project paths must not write staging bytes.",
  );
  const staged = await stage({ ...common, client: context.writer.client });
  assert.equal(staged.error, null, "Writer must stage the exact pending PDF.");
  await assertStagingMutationDenied(context, document);

  const directUpload = await context.writer.client.storage
    .from(BUCKET)
    .upload(
      storagePath(context.projectId, document.documentId),
      document.bytes,
      {
        contentType: "application/pdf",
        upsert: false,
      },
    );
  assertRejected(
    directUpload,
    "Authenticated writer must not bypass promotion into canonical storage.",
  );
  console.log("PASS staging RLS and canonical bypass denial");
}

async function runPromotionAuthorizationScenarios(context, document) {
  const common = {
    projectId: context.projectId,
    documentId: document.documentId,
  };
  assertRejected(
    await invoke({ ...common, client: context.anonymous }),
    "Unauthenticated promotion must be denied.",
  );
  assertRejected(
    await invoke({ ...common, client: context.viewer.client }),
    "documents.read without documents.write must not promote.",
  );
  assertRejected(
    await invoke({ ...common, client: context.outsider.client }),
    "Project outsider must not promote.",
  );
  assertRejected(
    await invoke({
      ...common,
      projectId: randomUUID(),
      client: context.writer.client,
    }),
    "Caller-substituted project identity must be denied.",
  );
  await assertMalformedJwtDenied(context, document);
  await assertStagedObjectPresent({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

async function runMembershipScenarios(context, document) {
  const membership = {
    projectId: context.projectId,
    userId: context.writer.userId,
  };
  const request = {
    client: context.writer.client,
    projectId: context.projectId,
    documentId: document.documentId,
  };
  setMembershipRole({ ...membership, roleKey: "viewer" });
  assertRejected(
    await invoke(request),
    "Live role downgrade must revoke promotion authority.",
  );
  setMembershipRole({ ...membership, roleKey: "owner" });
  setMembershipStatus({ ...membership, status: "revoked" });
  assertRejected(
    await invoke(request),
    "Revoked membership must deny promotion.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  setMembershipStatus({ ...membership, status: "active" });
}

async function runSuccessfulPromotionScenario(context, document) {
  const request = {
    client: context.writer.client,
    projectId: context.projectId,
    documentId: document.documentId,
  };
  const accepted = await invoke(request);
  assert.equal(accepted.error, null, "Exact staged bytes must promote.");
  assert.deepEqual(accepted.data, { ok: true, replayed: false });
  await assertNoStagedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });

  rpcFailure(
    (await stage({ ...request, bytes: document.bytes })).error,
    "Interrupted-response restaging",
  );
  const replay = await invoke(request);
  assert.equal(replay.error, null, "Exact canonical retry must recover.");
  assert.deepEqual(replay.data, { ok: true, replayed: true });
  await finalize(request);
  assertReady({
    projectId: context.projectId,
    documentId: document.documentId,
  });
  assertRejected(
    await stage({ ...request, bytes: document.bytes }),
    "Ready documents must not accept new staging bytes.",
  );
  assertRejected(
    await invoke(request),
    "Ready documents must not re-enter promotion.",
  );
  console.log("PASS bodyless promotion, retry recovery and ready-state denial");
}

export async function runTrustedIngestScenarios() {
  const context = await setupHarness();
  try {
    const smallDocument = await prepareSmallDocument(context);
    await runStagingAuthorizationScenarios(context, smallDocument);
    await runPromotionAuthorizationScenarios(context, smallDocument);
    await runMembershipScenarios(context, smallDocument);
    await runSuccessfulPromotionScenario(context, smallDocument);
    await runStagingIntegrityScenarios(context);
    await runFinalizeAuthorizationScenario(context);
    await runCanonicalIntegrityScenarios(context);
    await runReviewFindingRedScenarios(context);
  } finally {
    await cleanupHarness(context);
  }
}

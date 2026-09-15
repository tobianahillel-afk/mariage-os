import assert from "node:assert/strict";
import {
  assertMalformedJwtDenied,
  runFinalizeAuthorizationScenario,
} from "./private-document-edge-adversarial-scenarios.mjs";
import { runReviewFindingRedScenarios } from "./private-document-edge-review-red.mjs";
import {
  BUCKET,
  MAX_BYTES,
  STAGING_BUCKET,
  addMembership,
  assertNoAttestation,
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

async function reserveFixture(context, bytes, title) {
  const documentId = randomUUID();
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title,
  });
  context.objectPaths.push(storagePath(context.projectId, documentId));
  return { documentId, bytes };
}

async function prepareSmallDocument(context) {
  return reserveFixture(context, pdfBytes(512), "Synthetic small PDF");
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
    await stage({ ...common, projectId: randomUUID(), client: context.writer.client }),
    "Caller-substituted project paths must not write staging bytes.",
  );
  const staged = await stage({ ...common, client: context.writer.client });
  assert.equal(staged.error, null, "Writer must stage the exact pending PDF.");
  await assertStagingMutationDenied(context, document);

  const directUpload = await context.writer.client.storage
    .from(BUCKET)
    .upload(storagePath(context.projectId, document.documentId), document.bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
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
  assertReady({ projectId: context.projectId, documentId: document.documentId });
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

async function runWrongMimeStorageScenario(context) {
  const document = await reserveFixture(
    context,
    pdfBytes(512),
    "Synthetic wrong staging MIME",
  );
  assertRejected(
    await stage({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
      bytes: document.bytes,
      mimeType: "application/octet-stream",
    }),
    "Storage must reject non-PDF staging MIME before promotion.",
  );
  await assertNoStagedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

async function runOversizeStorageScenario(context) {
  const document = await reserveFixture(
    context,
    pdfBytes(512),
    "Synthetic oversize staging request",
  );
  assertRejected(
    await stage({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
      bytes: pdfBytes(MAX_BYTES + 1),
    }),
    "Storage must reject 25,000,001 bytes before promotion.",
  );
  await assertNoStagedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

async function injectStaging(context, document, bytes) {
  const injected = await context.admin.storage
    .from(STAGING_BUCKET)
    .upload(storagePath(context.projectId, document.documentId), bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
  rpcFailure(injected.error, "Synthetic privileged staging injection");
}

async function runSizeMismatchScenario(context) {
  const document = await reserveFixture(
    context,
    pdfBytes(512),
    "Synthetic staging size mismatch",
  );
  await injectStaging(context, document, document.bytes.slice(0, -1));
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
    }),
    "Staging size mismatch must fail before canonical mutation.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

async function runDigestMismatchScenario(context) {
  const document = await reserveFixture(
    context,
    pdfBytes(512),
    "Synthetic staging digest mismatch",
  );
  const substituted = document.bytes.slice();
  substituted[substituted.length - 1] ^= 0xff;
  await injectStaging(context, document, substituted);
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
    }),
    "Staging digest mismatch must fail before canonical mutation.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

async function runInvalidSignatureScenario(context) {
  const bytes = new Uint8Array(64);
  bytes.fill(0x41);
  const document = await reserveFixture(
    context,
    bytes,
    "Synthetic invalid staging signature",
  );
  rpcFailure(
    (await stage({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
      bytes,
    })).error,
    "Invalid-signature staging precondition",
  );
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
    }),
    "Reserved non-PDF bytes must be rejected by promotion.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
}

async function runPoisonedExistingObjectScenario(context) {
  const document = await reserveFixture(
    context,
    pdfBytes(384),
    "Synthetic poisoned existing object",
  );
  rpcFailure(
    (await stage({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
      bytes: document.bytes,
    })).error,
    "Poisoned-canonical staging precondition",
  );
  const path = storagePath(context.projectId, document.documentId);
  const poisoned = document.bytes.slice();
  poisoned[poisoned.length - 1] ^= 0xff;
  const injected = await context.admin.storage.from(BUCKET).upload(path, poisoned, {
    contentType: "application/pdf",
    upsert: false,
  });
  rpcFailure(injected.error, "Synthetic privileged stale object injection");
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
    }),
    "Mismatched pre-existing canonical bytes must never become trusted.",
  );
  assertNoAttestation({
    projectId: context.projectId,
    documentId: document.documentId,
  });
  console.log("PASS poisoned canonical recovery fails closed");
}

async function runFeasibilityScenario(context) {
  const document = await reserveFixture(
    context,
    pdfBytes(MAX_BYTES),
    "Synthetic 25 MB feasibility PDF",
  );
  rpcFailure(
    (await stage({
      client: context.writer.client,
      projectId: context.projectId,
      documentId: document.documentId,
      bytes: document.bytes,
    })).error,
    "Exact 25 MB staging",
  );
  const accepted = await invoke({
    client: context.writer.client,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  assert.equal(accepted.error, null, "Exact 25,000,000 bytes must promote.");
  assert.deepEqual(accepted.data, { ok: true, replayed: false });
  await finalize({
    client: context.writer.client,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  assertReady({
    projectId: context.projectId,
    documentId: document.documentId,
  });
  console.log("PASS exact 25,000,000-byte staging and promotion");
}

export async function runTrustedIngestScenarios() {
  const context = await setupHarness();
  try {
    const smallDocument = await prepareSmallDocument(context);
    await runStagingAuthorizationScenarios(context, smallDocument);
    await runPromotionAuthorizationScenarios(context, smallDocument);
    await runMembershipScenarios(context, smallDocument);
    await runSuccessfulPromotionScenario(context, smallDocument);
    await runWrongMimeStorageScenario(context);
    await runOversizeStorageScenario(context);
    await runSizeMismatchScenario(context);
    await runDigestMismatchScenario(context);
    await runInvalidSignatureScenario(context);
    await runFinalizeAuthorizationScenario(context);
    await runPoisonedExistingObjectScenario(context);
    await runFeasibilityScenario(context);
    await runReviewFindingRedScenarios(context);
  } finally {
    await cleanupHarness(context);
  }
}

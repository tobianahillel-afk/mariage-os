import assert from "node:assert/strict";
import {
  assertChunkedOversizeDenied,
  assertMalformedJwtDenied,
  runFinalizeAuthorizationScenario,
} from "./private-document-edge-adversarial-scenarios.mjs";
import {
  BUCKET,
  MAX_BYTES,
  addMembership,
  assertNoAttestation,
  assertNoTrustedObject,
  assertReady,
  assertRejected,
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
  addMembership({
    projectId,
    userId: writer.userId,
    roleKey: "owner",
  });

  const viewer = await createSyntheticIdentity({
    ...identityInput,
    label: "viewer",
  });
  userIds.push(viewer.userId);
  addMembership({
    projectId,
    userId: viewer.userId,
    roleKey: "viewer",
  });
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

async function runAuthorizationScenarios(context, document) {
  const common = {
    projectId: context.projectId,
    documentId: document.documentId,
    bytes: document.bytes,
  };
  assertRejected(
    await invoke({ ...common, client: context.anonymous }),
    "Unauthenticated ingest must be denied.",
  );
  assertRejected(
    await invoke({ ...common, client: context.viewer.client }),
    "documents.read without documents.write must not ingest.",
  );
  assertRejected(
    await invoke({ ...common, client: context.outsider.client }),
    "Project outsider must not ingest.",
  );
  assertRejected(
    await invoke({
      ...common,
      projectId: randomUUID(),
      client: context.writer.client,
    }),
    "Caller-substituted project identity must be denied.",
  );
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
    "Authenticated writer must not bypass trusted ingest with Storage INSERT.",
  );
  await assertMalformedJwtDenied(context, document);
}

async function runByteValidationScenarios(context, document) {
  const common = {
    client: context.writer.client,
    projectId: context.projectId,
    documentId: document.documentId,
  };
  assertRejected(
    await invoke({ ...common, bytes: new Uint8Array(0) }),
    "Empty bytes must be rejected.",
  );
  assertRejected(
    await invoke({ ...common, bytes: document.bytes.slice(0, -1) }),
    "Actual size mismatch must be rejected.",
  );
  const substituted = document.bytes.slice();
  substituted[substituted.length - 1] ^= 0xff;
  assertRejected(
    await invoke({ ...common, bytes: substituted }),
    "Digest mismatch must be rejected by the live Edge boundary.",
  );
  assertRejected(
    await invoke({
      ...common,
      bytes: document.bytes,
      mimeType: "application/octet-stream",
    }),
    "Non-PDF MIME intent must be rejected by the live Edge boundary.",
  );
  await assertNoTrustedObject({
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
    bytes: document.bytes,
  };
  setMembershipRole({ ...membership, roleKey: "viewer" });
  assertRejected(
    await invoke(request),
    "Live role downgrade must revoke trusted ingest authority.",
  );
  setMembershipRole({ ...membership, roleKey: "owner" });
  setMembershipStatus({ ...membership, status: "revoked" });
  assertRejected(
    await invoke(request),
    "Revoked membership must deny trusted ingest.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  setMembershipStatus({ ...membership, status: "active" });
}

async function runSuccessfulIngestScenario(context, document) {
  const request = {
    client: context.writer.client,
    projectId: context.projectId,
    documentId: document.documentId,
    bytes: document.bytes,
  };
  const accepted = await invoke(request);
  assert.equal(accepted.error, null, "Exact reserved bytes must ingest.");
  assert.deepEqual(accepted.data, { ok: true, replayed: false });
  const replay = await invoke(request);
  assert.equal(
    replay.error,
    null,
    "Exact interrupted-upload retry must recover.",
  );
  assert.deepEqual(replay.data, { ok: true, replayed: true });
  await finalize({
    client: context.writer.client,
    projectId: context.projectId,
    documentId: document.documentId,
  });
  assertReady({
    projectId: context.projectId,
    documentId: document.documentId,
  });
  assertRejected(
    await invoke(request),
    "Ready documents must not re-enter trusted ingest.",
  );
  console.log(
    "PASS trusted-ingest authorization, byte integrity and idempotent retry",
  );
}

async function runInvalidSignatureScenario(context) {
  const documentId = randomUUID();
  const bytes = new Uint8Array(64);
  bytes.fill(0x41);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title: "Synthetic invalid signature",
  });
  context.objectPaths.push(storagePath(context.projectId, documentId));
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId,
      bytes,
    }),
    "Reserved non-PDF bytes must still be rejected by trusted ingest.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId,
  });
  console.log("PASS trusted-ingest independent PDF signature validation");
}

async function runPoisonedExistingObjectScenario(context) {
  const documentId = randomUUID();
  const expected = pdfBytes(384);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes: expected,
    title: "Synthetic poisoned existing object",
  });
  const path = storagePath(context.projectId, documentId);
  context.objectPaths.push(path);
  const poisoned = expected.slice();
  poisoned[poisoned.length - 1] ^= 0xff;
  const injected = await context.admin.storage
    .from(BUCKET)
    .upload(path, poisoned, {
      contentType: "application/pdf",
      upsert: false,
    });
  rpcFailure(injected.error, "Synthetic privileged stale object injection");
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId,
      bytes: expected,
    }),
    "Mismatched pre-existing bytes must never become trusted.",
  );
  assertNoAttestation({
    projectId: context.projectId,
    documentId,
  });
  console.log("PASS mismatched existing object fails closed");
}

async function runFeasibilityScenario(context) {
  const documentId = randomUUID();
  const bytes = pdfBytes(MAX_BYTES);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title: "Synthetic 25 MB feasibility PDF",
  });
  context.objectPaths.push(storagePath(context.projectId, documentId));
  await assertChunkedOversizeDenied(context, { documentId, bytes });
  const accepted = await invoke({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
  });
  assert.equal(
    accepted.error,
    null,
    "Exact 25,000,000-byte PDF must pass the live Edge runtime.",
  );
  assert.deepEqual(accepted.data, { ok: true, replayed: false });
  await finalize({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
  });
  assertReady({
    projectId: context.projectId,
    documentId,
  });
  console.log("PASS 25,000,000-byte trusted-ingest runtime feasibility");
}

export async function runTrustedIngestScenarios() {
  const context = await setupHarness();
  try {
    const smallDocument = await prepareSmallDocument(context);
    await runAuthorizationScenarios(context, smallDocument);
    await runByteValidationScenarios(context, smallDocument);
    await runMembershipScenarios(context, smallDocument);
    await runSuccessfulIngestScenario(context, smallDocument);
    await runFinalizeAuthorizationScenario(context);
    await runInvalidSignatureScenario(context);
    await runPoisonedExistingObjectScenario(context);
    await runFeasibilityScenario(context);
  } finally {
    await cleanupHarness(context);
  }
}

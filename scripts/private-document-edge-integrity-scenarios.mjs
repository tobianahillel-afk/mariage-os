import assert from "node:assert/strict";
import {
  BUCKET,
  MAX_BYTES,
  STAGING_BUCKET,
  assertNoAttestation,
  assertNoStagedObject,
  assertNoTrustedObject,
  assertReady,
  assertRejected,
  finalize,
  invoke,
  pdfBytes,
  randomUUID,
  reserve,
  rpcFailure,
  stage,
  storagePath,
} from "./private-document-edge-helpers.mjs";

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
    (
      await stage({
        client: context.writer.client,
        projectId: context.projectId,
        documentId: document.documentId,
        bytes,
      })
    ).error,
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
    (
      await stage({
        client: context.writer.client,
        projectId: context.projectId,
        documentId: document.documentId,
        bytes: document.bytes,
      })
    ).error,
    "Poisoned-canonical staging precondition",
  );
  const path = storagePath(context.projectId, document.documentId);
  const poisoned = document.bytes.slice();
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
    (
      await stage({
        client: context.writer.client,
        projectId: context.projectId,
        documentId: document.documentId,
        bytes: document.bytes,
      })
    ).error,
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

export async function runStagingIntegrityScenarios(context) {
  await runWrongMimeStorageScenario(context);
  await runOversizeStorageScenario(context);
  await runSizeMismatchScenario(context);
  await runDigestMismatchScenario(context);
  await runInvalidSignatureScenario(context);
}

export async function runCanonicalIntegrityScenarios(context) {
  await runPoisonedExistingObjectScenario(context);
  await runFeasibilityScenario(context);
}

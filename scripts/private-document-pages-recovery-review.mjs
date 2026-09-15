import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BUCKET,
  MAX_BYTES,
  assertNoAttestation,
  assertRejected,
  documentUploadStatus,
  invoke,
  pdfBytes,
  randomUUID,
  reserve,
  rpcFailure,
  stage,
  storagePath,
} from "./private-document-edge-helpers.mjs";

function verifierSource() {
  const source = readFileSync(
    new globalThis.URL(
      "../functions/api/private-document-promote.ts",
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

export function assertRecoverySourceContracts() {
  const source = verifierSource();
  const infoIndex = source.indexOf(".info(");
  const downloadIndex = source.indexOf(".download(");
  assert.ok(
    infoIndex >= 0 && downloadIndex >= 0 && infoIndex < downloadIndex,
    "Storage metadata bounds must precede object materialization.",
  );
  assert.ok(source.includes("MAX_BYTES") && source.includes("size_bytes"));
  assert.ok(source.includes('"application/pdf"'));
}

export async function assertOversizedCanonicalRejected(context) {
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
  rpcFailure(injected.error, "Synthetic oversized recovery injection");

  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId,
    }),
    "Oversized canonical object must fail closed.",
  );
  assertNoAttestation({ projectId: context.projectId, documentId });
  assert.equal(
    documentUploadStatus({ projectId: context.projectId, documentId }),
    "pending",
  );
}

export async function assertWrongCanonicalMimeRejected(context) {
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
  rpcFailure(injected.error, "Synthetic wrong-MIME recovery injection");
  assertRejected(
    await invoke({
      client: context.writer.client,
      projectId: context.projectId,
      documentId,
    }),
    "Wrong canonical MIME must fail closed.",
  );
  assertNoAttestation({ projectId: context.projectId, documentId });
}

import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "project-private";
const MAX_BYTES = 25_000_000;
const npmExecPath = process.env.npm_execpath;

function fail(message) {
  throw new Error(message);
}

function parseEnvValue(raw) {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

function localSupabaseEnvironment() {
  if (!npmExecPath) fail("npm_execpath is required for Edge integration.");

  const result = spawnSync(
    process.execPath,
    [npmExecPath, "exec", "--", "supabase", "status", "-o", "env"],
    { encoding: "utf8", env: process.env },
  );
  if (result.status !== 0) {
    fail("Unable to read the local Supabase environment.");
  }

  const values = new Map();
  for (const line of result.stdout.split(/\r?\n/u)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (match) values.set(match[1], parseEnvValue(match[2]));
  }

  const apiUrl = values.get("API_URL") ?? values.get("SUPABASE_URL");
  const anonKey =
    values.get("ANON_KEY") ??
    values.get("PUBLISHABLE_KEY") ??
    values.get("SUPABASE_ANON_KEY");
  const serviceRoleKey =
    values.get("SERVICE_ROLE_KEY") ??
    values.get("SECRET_KEY") ??
    values.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!apiUrl || !anonKey || !serviceRoleKey) {
    fail("Local Supabase status omitted required API credentials.");
  }

  return { apiUrl, anonKey, serviceRoleKey };
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pdfBytes(size = 128) {
  assert.ok(size >= 5);
  const bytes = new Uint8Array(size);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  for (let index = 5; index < size; index += 1) {
    bytes[index] = index % 251;
  }
  return bytes;
}

function storagePath(projectId, documentId) {
  return `${projectId}/documents/${documentId}/original`;
}

function rpcFailure(error, context) {
  if (error) fail(`${context} failed.`);
}

async function createSyntheticUser(admin, apiUrl, anonKey, roleKey, projectId) {
  const suffix = randomUUID();
  const email = `wp29c-${roleKey}-${suffix}@example.invalid`;
  const password = `Synthetic-${suffix}-A1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  rpcFailure(error, "Synthetic auth user creation");
  const userId = data.user?.id;
  if (!userId) fail("Synthetic auth user creation returned no identity.");

  const profile = await admin.from("profiles").insert({
    id: userId,
    display_name: `WP29C ${roleKey}`,
  });
  rpcFailure(profile.error, "Synthetic profile creation");

  const membership = await admin.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role_key: roleKey,
    membership_status: "active",
    accepted_at: new Date().toISOString(),
  });
  rpcFailure(membership.error, "Synthetic membership creation");

  const client = createClient(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  rpcFailure(signIn.error, "Synthetic user sign-in");
  return { userId, client };
}

async function reserve(client, projectId, documentId, bytes, title) {
  const operationId = randomUUID();
  const result = await client.rpc("manage_private_document", {
    target_action: "reserve_upload",
    target_operation_id: operationId,
    target_project_id: projectId,
    target_document_id: documentId,
    target_venue_id: null,
    target_link_id: null,
    target_expected_revision: null,
    target_document_type: "venue_contract",
    target_title: title,
    target_original_filename: "synthetic-contract.pdf",
    target_mime_type: "application/pdf",
    target_size_bytes: bytes.byteLength,
    target_sha256: digest(bytes),
    target_source_id: null,
  });
  rpcFailure(result.error, "Private document reservation");
  return operationId;
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
  rpcFailure(result.error, "Private document finalization");
}

async function invoke(client, projectId, documentId, bytes, mimeType = "application/pdf") {
  return client.functions.invoke("private-document-ingest", {
    body: bytes.slice().buffer,
    headers: {
      "x-project-id": projectId,
      "x-document-id": documentId,
      "x-document-mime-type": mimeType,
    },
  });
}

async function assertNoTrustedObject(admin, projectId, documentId) {
  const path = storagePath(projectId, documentId);
  const object = await admin.storage.from(BUCKET).download(path);
  assert.notEqual(object.error, null, "Rejected ingest must not create Storage bytes.");

  const attestation = await admin
    .from("private_document_ingest_attestations")
    .select("document_id")
    .eq("project_id", projectId)
    .eq("document_id", documentId);
  rpcFailure(attestation.error, "Trusted attestation inspection");
  assert.equal(
    attestation.data.length,
    0,
    "Rejected ingest must not create an attestation.",
  );
}

async function assertReady(admin, projectId, documentId) {
  const result = await admin
    .from("documents")
    .select("upload_status")
    .eq("project_id", projectId)
    .eq("id", documentId)
    .single();
  rpcFailure(result.error, "Ready document inspection");
  assert.equal(result.data.upload_status, "ready");
}

async function run() {
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

  try {
    const project = await admin.from("projects").insert({
      id: projectId,
      name: "WP-2.9C Edge integration",
    });
    rpcFailure(project.error, "Synthetic project creation");

    const writer = await createSyntheticUser(
      admin,
      apiUrl,
      anonKey,
      "owner",
      projectId,
    );
    userIds.push(writer.userId);
    const viewer = await createSyntheticUser(
      admin,
      apiUrl,
      anonKey,
      "viewer",
      projectId,
    );
    userIds.push(viewer.userId);

    const smallDocumentId = randomUUID();
    const small = pdfBytes(512);
    await reserve(
      writer.client,
      projectId,
      smallDocumentId,
      small,
      "Synthetic small PDF",
    );
    objectPaths.push(storagePath(projectId, smallDocumentId));

    const anonymousAttempt = await invoke(
      anonymous,
      projectId,
      smallDocumentId,
      small,
    );
    assert.notEqual(
      anonymousAttempt.error,
      null,
      "Unauthenticated ingest must be denied.",
    );

    const viewerAttempt = await invoke(
      viewer.client,
      projectId,
      smallDocumentId,
      small,
    );
    assert.notEqual(
      viewerAttempt.error,
      null,
      "documents.read without documents.write must not ingest.",
    );

    const directUpload = await writer.client.storage
      .from(BUCKET)
      .upload(storagePath(projectId, smallDocumentId), small, {
        contentType: "application/pdf",
        upsert: false,
      });
    assert.notEqual(
      directUpload.error,
      null,
      "Authenticated writer must not bypass trusted ingest with Storage INSERT.",
    );

    const substitutedBytes = small.slice();
    substitutedBytes[substitutedBytes.length - 1] ^= 0xff;
    const mismatchedAttempt = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      substitutedBytes,
    );
    assert.notEqual(
      mismatchedAttempt.error,
      null,
      "Digest mismatch must be rejected by the live Edge boundary.",
    );
    await assertNoTrustedObject(admin, projectId, smallDocumentId);

    const wrongMimeAttempt = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      small,
      "application/octet-stream",
    );
    assert.notEqual(
      wrongMimeAttempt.error,
      null,
      "Non-PDF MIME intent must be rejected by the live Edge boundary.",
    );
    await assertNoTrustedObject(admin, projectId, smallDocumentId);

    const accepted = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      small,
    );
    assert.equal(accepted.error, null, "Exact reserved bytes must ingest.");
    assert.deepEqual(accepted.data, { ok: true, replayed: false });

    const replay = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      small,
    );
    assert.equal(replay.error, null, "Exact interrupted-upload retry must recover.");
    assert.deepEqual(replay.data, { ok: true, replayed: true });

    await finalize(writer.client, projectId, smallDocumentId);
    await assertReady(admin, projectId, smallDocumentId);
    console.log("PASS trusted-ingest authorization, byte integrity and idempotent retry");

    const invalidSignatureDocumentId = randomUUID();
    const invalidSignature = new Uint8Array(64);
    invalidSignature.fill(0x41);
    await reserve(
      writer.client,
      projectId,
      invalidSignatureDocumentId,
      invalidSignature,
      "Synthetic invalid signature",
    );
    objectPaths.push(storagePath(projectId, invalidSignatureDocumentId));
    const invalidSignatureAttempt = await invoke(
      writer.client,
      projectId,
      invalidSignatureDocumentId,
      invalidSignature,
    );
    assert.notEqual(
      invalidSignatureAttempt.error,
      null,
      "Reserved non-PDF bytes must still be rejected by trusted ingest.",
    );
    await assertNoTrustedObject(admin, projectId, invalidSignatureDocumentId);
    console.log("PASS trusted-ingest independent PDF signature validation");

    const feasibilityDocumentId = randomUUID();
    const feasibilityBytes = pdfBytes(MAX_BYTES);
    await reserve(
      writer.client,
      projectId,
      feasibilityDocumentId,
      feasibilityBytes,
      "Synthetic 25 MB feasibility PDF",
    );
    objectPaths.push(storagePath(projectId, feasibilityDocumentId));
    const feasibility = await invoke(
      writer.client,
      projectId,
      feasibilityDocumentId,
      feasibilityBytes,
    );
    assert.equal(
      feasibility.error,
      null,
      "Exact 25,000,000-byte PDF must pass the live Edge runtime.",
    );
    assert.deepEqual(feasibility.data, { ok: true, replayed: false });
    await finalize(writer.client, projectId, feasibilityDocumentId);
    await assertReady(admin, projectId, feasibilityDocumentId);
    console.log("PASS 25,000,000-byte trusted-ingest runtime feasibility");
  } finally {
    if (objectPaths.length > 0) {
      await admin.storage.from(BUCKET).remove(objectPaths);
    }
    await admin.from("projects").delete().eq("id", projectId);
    for (const userId of userIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

run().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Trusted ingest integration failed.",
  );
  process.exit(1);
});

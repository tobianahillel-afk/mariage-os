import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "project-private";
const MAX_BYTES = 25_000_000;
const npmExecPath = process.env.npm_execpath;

function fail(message) {
  throw new Error(message);
}

function safeErrorCode(error) {
  if (typeof error !== "object" || error === null) return "unknown";
  if (!("code" in error)) return "unknown";
  return String(error.code);
}

function rpcFailure(error, context) {
  if (error) fail(`${context} failed (${safeErrorCode(error)}).`);
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

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function localLegacyKey(jwtSecret, role) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    iss: "supabase-demo",
    role,
    iat: now - 60,
    exp: now + 86_400,
  });
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
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
  const jwtSecret = values.get("JWT_SECRET");
  if (!apiUrl || !jwtSecret) {
    fail("Local Supabase status omitted API_URL or JWT_SECRET.");
  }

  return {
    apiUrl,
    anonKey: values.get("ANON_KEY") ?? localLegacyKey(jwtSecret, "anon"),
    serviceRoleKey:
      values.get("SERVICE_ROLE_KEY") ??
      localLegacyKey(jwtSecret, "service_role"),
  };
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

async function createSyntheticIdentity(admin, apiUrl, anonKey, label) {
  const suffix = randomUUID();
  const email = `wp29c-${label}-${suffix}@example.invalid`;
  const password = `Synthetic-${suffix}-A1!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  rpcFailure(created.error, "Synthetic auth user creation");
  const userId = created.data.user?.id;
  if (!userId) fail("Synthetic auth user creation returned no identity.");

  const profile = await admin.from("profiles").insert({
    id: userId,
    display_name: `WP29C ${label}`,
  });
  rpcFailure(profile.error, "Synthetic profile creation");

  const client = createClient(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  rpcFailure(signIn.error, "Synthetic user sign-in");
  return { userId, client };
}

async function addMembership(admin, projectId, userId, roleKey) {
  const result = await admin.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role_key: roleKey,
    membership_status: "active",
    accepted_at: new Date().toISOString(),
  });
  rpcFailure(result.error, "Synthetic membership creation");
}

async function updateMembership(admin, projectId, userId, values) {
  const result = await admin
    .from("project_members")
    .update(values)
    .eq("project_id", projectId)
    .eq("user_id", userId);
  rpcFailure(result.error, "Synthetic membership update");
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

async function invoke(
  client,
  projectId,
  documentId,
  bytes,
  mimeType = "application/pdf",
) {
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
  assert.notEqual(
    object.error,
    null,
    "Rejected ingest must not create Storage bytes.",
  );

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

async function assertNoAttestation(admin, projectId, documentId) {
  const result = await admin
    .from("private_document_ingest_attestations")
    .select("document_id")
    .eq("project_id", projectId)
    .eq("document_id", documentId);
  rpcFailure(result.error, "Trusted attestation inspection");
  assert.equal(result.data.length, 0);
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
    const writer = await createSyntheticIdentity(
      admin,
      apiUrl,
      anonKey,
      "writer",
    );
    userIds.push(writer.userId);

    const project = await admin.from("projects").insert({
      id: projectId,
      name: "WP-2.9C Edge integration",
      created_by: writer.userId,
      updated_by: writer.userId,
    });
    rpcFailure(project.error, "Synthetic project creation");
    await addMembership(admin, projectId, writer.userId, "owner");

    const viewer = await createSyntheticIdentity(
      admin,
      apiUrl,
      anonKey,
      "viewer",
    );
    userIds.push(viewer.userId);
    await addMembership(admin, projectId, viewer.userId, "viewer");

    const outsider = await createSyntheticIdentity(
      admin,
      apiUrl,
      anonKey,
      "outsider",
    );
    userIds.push(outsider.userId);

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

    const outsiderAttempt = await invoke(
      outsider.client,
      projectId,
      smallDocumentId,
      small,
    );
    assert.notEqual(
      outsiderAttempt.error,
      null,
      "Project outsider must not ingest.",
    );

    const substitutedIdentityAttempt = await invoke(
      writer.client,
      randomUUID(),
      smallDocumentId,
      small,
    );
    assert.notEqual(
      substitutedIdentityAttempt.error,
      null,
      "Caller-substituted project identity must be denied.",
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

    const emptyAttempt = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      new Uint8Array(0),
    );
    assert.notEqual(emptyAttempt.error, null, "Empty bytes must be rejected.");
    await assertNoTrustedObject(admin, projectId, smallDocumentId);

    const shortAttempt = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      small.slice(0, small.byteLength - 1),
    );
    assert.notEqual(
      shortAttempt.error,
      null,
      "Actual size mismatch must be rejected.",
    );
    await assertNoTrustedObject(admin, projectId, smallDocumentId);

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

    await updateMembership(admin, projectId, writer.userId, {
      role_key: "viewer",
    });
    const downgradedAttempt = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      small,
    );
    assert.notEqual(
      downgradedAttempt.error,
      null,
      "Live role downgrade must revoke trusted ingest authority.",
    );
    await assertNoTrustedObject(admin, projectId, smallDocumentId);
    await updateMembership(admin, projectId, writer.userId, {
      role_key: "owner",
    });

    await updateMembership(admin, projectId, writer.userId, {
      membership_status: "revoked",
      revoked_at: new Date().toISOString(),
    });
    const revokedAttempt = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      small,
    );
    assert.notEqual(
      revokedAttempt.error,
      null,
      "Revoked membership must deny trusted ingest.",
    );
    await assertNoTrustedObject(admin, projectId, smallDocumentId);
    await updateMembership(admin, projectId, writer.userId, {
      membership_status: "active",
      revoked_at: null,
    });

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
    assert.equal(
      replay.error,
      null,
      "Exact interrupted-upload retry must recover.",
    );
    assert.deepEqual(replay.data, { ok: true, replayed: true });

    await finalize(writer.client, projectId, smallDocumentId);
    await assertReady(admin, projectId, smallDocumentId);

    const readyAttempt = await invoke(
      writer.client,
      projectId,
      smallDocumentId,
      small,
    );
    assert.notEqual(
      readyAttempt.error,
      null,
      "Ready documents must not re-enter trusted ingest.",
    );
    console.log(
      "PASS trusted-ingest authorization, byte integrity and idempotent retry",
    );

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

    const poisonedDocumentId = randomUUID();
    const expectedPoisonedBytes = pdfBytes(384);
    await reserve(
      writer.client,
      projectId,
      poisonedDocumentId,
      expectedPoisonedBytes,
      "Synthetic poisoned existing object",
    );
    const poisonedPath = storagePath(projectId, poisonedDocumentId);
    objectPaths.push(poisonedPath);
    const poisonedBytes = expectedPoisonedBytes.slice();
    poisonedBytes[poisonedBytes.length - 1] ^= 0xff;
    const injected = await admin.storage.from(BUCKET).upload(
      poisonedPath,
      poisonedBytes,
      {
        contentType: "application/pdf",
        upsert: false,
      },
    );
    rpcFailure(injected.error, "Synthetic privileged stale object injection");

    const poisonedAttempt = await invoke(
      writer.client,
      projectId,
      poisonedDocumentId,
      expectedPoisonedBytes,
    );
    assert.notEqual(
      poisonedAttempt.error,
      null,
      "Mismatched pre-existing bytes must never become trusted.",
    );
    await assertNoAttestation(admin, projectId, poisonedDocumentId);
    console.log("PASS mismatched existing object fails closed");

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

    const oversizeBytes = new Uint8Array(MAX_BYTES + 1);
    oversizeBytes.set(feasibilityBytes);
    const oversizeAttempt = await invoke(
      writer.client,
      projectId,
      feasibilityDocumentId,
      oversizeBytes,
    );
    assert.notEqual(
      oversizeAttempt.error,
      null,
      "25,000,001-byte payload must be rejected.",
    );
    await assertNoTrustedObject(admin, projectId, feasibilityDocumentId);

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

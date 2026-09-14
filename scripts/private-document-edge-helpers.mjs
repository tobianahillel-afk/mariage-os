import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

export const BUCKET = "project-private";
export const MAX_BYTES = 25_000_000;
const npmExecPath = process.env.npm_execpath;

function fail(message) {
  throw new Error(message);
}

function safeErrorCode(error) {
  if (typeof error !== "object" || error === null) return "unknown";
  if (!("code" in error)) return "unknown";
  return String(error.code);
}

export function rpcFailure(error, context) {
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

function encodeJwtPart(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function localUserToken({ apiUrl, jwtSecret, userId, email }) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJwtPart({ alg: "HS256", typ: "JWT" });
  const payload = encodeJwtPart({
    iss: `${apiUrl}/auth/v1`,
    sub: userId,
    aud: "authenticated",
    exp: now + 86_400,
    iat: now - 60,
    email,
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    role: "authenticated",
    aal: "aal1",
    amr: [{ method: "password", timestamp: now }],
    session_id: randomUUID(),
    is_anonymous: false,
  });
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function localSupabaseEnvironment() {
  if (!npmExecPath) fail("npm_execpath is required for Edge integration.");
  const result = spawnSync(
    process.execPath,
    [npmExecPath, "exec", "--", "supabase", "status", "-o", "env"],
    { encoding: "utf8", env: process.env },
  );
  if (result.status !== 0) fail("Unable to read the local Supabase environment.");

  const values = new Map();
  for (const line of result.stdout.split(/\r?\n/u)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (match) values.set(match[1], parseEnvValue(match[2]));
  }

  const apiUrl = values.get("API_URL") ?? values.get("SUPABASE_URL");
  const anonKey =
    values.get("PUBLISHABLE_KEY") ??
    values.get("ANON_KEY") ??
    values.get("SUPABASE_ANON_KEY");
  const serviceRoleKey =
    values.get("SECRET_KEY") ??
    values.get("SERVICE_ROLE_KEY") ??
    values.get("SUPABASE_SERVICE_ROLE_KEY");
  const jwtSecret = values.get("JWT_SECRET");
  if (!apiUrl || !anonKey || !serviceRoleKey || !jwtSecret) {
    fail("Local Supabase status omitted required API credentials.");
  }
  return { apiUrl, anonKey, serviceRoleKey, jwtSecret };
}

export function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function pdfBytes(size = 128) {
  assert.ok(size >= 5);
  const bytes = new Uint8Array(size);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  for (let index = 5; index < size; index += 1) {
    bytes[index] = index % 251;
  }
  return bytes;
}

export function storagePath(projectId, documentId) {
  return `${projectId}/documents/${documentId}/original`;
}

export async function createSyntheticIdentity({
  admin,
  apiUrl,
  anonKey,
  label,
}) {
  const suffix = randomUUID();
  const email = `wp29c-${label}-${suffix}@example.invalid`;
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  rpcFailure(created.error, "Synthetic auth user creation");
  const userId = created.data.user?.id;
  if (!userId) fail("Synthetic auth user creation returned no identity.");

  const { jwtSecret } = localSupabaseEnvironment();
  const token = localUserToken({ apiUrl, jwtSecret, userId, email });
  const client = createClient(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { userId, client };
}

export async function addMembership({ admin, projectId, userId, roleKey }) {
  const result = await admin.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role_key: roleKey,
    membership_status: "active",
    accepted_at: new Date().toISOString(),
  });
  rpcFailure(result.error, "Synthetic membership creation");
}

export async function updateMembership({ admin, projectId, userId, values }) {
  const result = await admin
    .from("project_members")
    .update(values)
    .eq("project_id", projectId)
    .eq("user_id", userId);
  rpcFailure(result.error, "Synthetic membership update");
}

export async function reserve({ client, projectId, documentId, bytes, title }) {
  const result = await client.rpc("manage_private_document", {
    target_action: "reserve_upload",
    target_operation_id: randomUUID(),
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
}

export async function finalize({ client, projectId, documentId }) {
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

export function invoke({
  client,
  projectId,
  documentId,
  bytes,
  mimeType = "application/pdf",
}) {
  return client.functions.invoke("private-document-ingest", {
    body: bytes.slice().buffer,
    headers: {
      "x-project-id": projectId,
      "x-document-id": documentId,
      "x-document-mime-type": mimeType,
    },
  });
}

export function assertRejected(result, message) {
  assert.notEqual(result.error, null, message);
}

export async function assertNoTrustedObject({ admin, projectId, documentId }) {
  const path = storagePath(projectId, documentId);
  const object = await admin.storage.from(BUCKET).download(path);
  assertRejected(object, "Rejected ingest must not create Storage bytes.");
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

export async function assertNoAttestation({ admin, projectId, documentId }) {
  const result = await admin
    .from("private_document_ingest_attestations")
    .select("document_id")
    .eq("project_id", projectId)
    .eq("document_id", documentId);
  rpcFailure(result.error, "Trusted attestation inspection");
  assert.equal(result.data.length, 0);
}

export async function assertReady({ admin, projectId, documentId }) {
  const result = await admin
    .from("documents")
    .select("upload_status")
    .eq("project_id", projectId)
    .eq("id", documentId)
    .single();
  rpcFailure(result.error, "Ready document inspection");
  assert.equal(result.data.upload_status, "ready");
}

export async function cleanupHarness({
  admin,
  projectId,
  objectPaths,
  userIds,
}) {
  if (objectPaths.length > 0) await admin.storage.from(BUCKET).remove(objectPaths);
  await admin.from("projects").delete().eq("id", projectId);
  for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
}

export { createClient, randomUUID };

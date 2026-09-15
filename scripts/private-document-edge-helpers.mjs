import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

export const BUCKET = "project-private";
export const STAGING_BUCKET = "document-ingest-staging";
export const MAX_BYTES = 25_000_000;
const npmExecPath = process.env.npm_execpath;
let cachedEnvironment = null;
let cachedDatabaseContainer = null;

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
    is_anonymous: false,
  });
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function parseEnvironmentOutput(output) {
  const values = new Map();
  for (const line of output.split(/\r?\n/u)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (match) values.set(match[1], parseEnvValue(match[2]));
  }
  return values;
}

function firstEnvironmentValue(values, keys) {
  for (const key of keys) {
    const value = values.get(key);
    if (value) return value;
  }
  return null;
}

function environmentFromValues(values) {
  return {
    apiUrl: firstEnvironmentValue(values, ["API_URL", "SUPABASE_URL"]),
    anonKey: firstEnvironmentValue(values, [
      "PUBLISHABLE_KEY",
      "ANON_KEY",
      "SUPABASE_ANON_KEY",
    ]),
    serviceRoleKey: firstEnvironmentValue(values, [
      "SECRET_KEY",
      "SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]),
    jwtSecret: firstEnvironmentValue(values, ["JWT_SECRET"]),
  };
}

function requireCompleteEnvironment(environment) {
  if (Object.values(environment).some((value) => !value)) {
    fail("Local Supabase status omitted required API credentials.");
  }
  return environment;
}

export function localSupabaseEnvironment() {
  if (cachedEnvironment) return cachedEnvironment;
  if (!npmExecPath) fail("npm_execpath is required for Edge integration.");
  const result = spawnSync(
    process.execPath,
    [npmExecPath, "exec", "--", "supabase", "status", "-o", "env"],
    { encoding: "utf8", env: process.env },
  );
  if (result.status !== 0) {
    fail("Unable to read the local Supabase environment.");
  }
  const values = parseEnvironmentOutput(result.stdout);
  cachedEnvironment = requireCompleteEnvironment(environmentFromValues(values));
  return cachedEnvironment;
}

function localDatabaseContainer() {
  if (cachedDatabaseContainer) return cachedDatabaseContainer;
  const result = spawnSync(
    "docker",
    ["ps", "--filter", "name=supabase_db_mariage-os", "--format", "{{.ID}}"],
    { encoding: "utf8", env: process.env },
  );
  const containerId = result.stdout.trim().split(/\s+/u)[0];
  if (result.status !== 0 || !containerId) {
    fail("Unable to locate the local Supabase database container.");
  }
  cachedDatabaseContainer = containerId;
  return cachedDatabaseContainer;
}

function runLocalSql(sql, variables = {}) {
  const args = [
    "exec",
    "-i",
    localDatabaseContainer(),
    "psql",
    "-X",
    "-qAt",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
  ];
  for (const [key, value] of Object.entries(variables)) {
    args.push("-v", `${key}=${String(value)}`);
  }
  const result = spawnSync("docker", args, {
    input: sql,
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    fail("Local synthetic SQL fixture operation failed.");
  }
  return result.stdout.trim();
}

export function createProjectFixture({ projectId, userId }) {
  runLocalSql(
    `
      insert into public.projects (id, name, created_by, updated_by)
      values (
        :'project_id'::uuid,
        'WP-2.9C Edge integration',
        :'user_id'::uuid,
        :'user_id'::uuid
      );
    `,
    { project_id: projectId, user_id: userId },
  );
}

export function addMembership({ projectId, userId, roleKey }) {
  runLocalSql(
    `
      insert into public.project_members (
        project_id,
        user_id,
        role_key,
        membership_status,
        accepted_at
      )
      values (
        :'project_id'::uuid,
        :'user_id'::uuid,
        :'role_key',
        'active',
        now()
      );
    `,
    { project_id: projectId, user_id: userId, role_key: roleKey },
  );
}

export function setMembershipRole({ projectId, userId, roleKey }) {
  runLocalSql(
    `
      update public.project_members
      set role_key = :'role_key'
      where project_id = :'project_id'::uuid
        and user_id = :'user_id'::uuid;
    `,
    { project_id: projectId, user_id: userId, role_key: roleKey },
  );
}

export function setMembershipStatus({ projectId, userId, status }) {
  if (status !== "active" && status !== "revoked") {
    fail("Unsupported synthetic membership status.");
  }
  runLocalSql(
    `
      update public.project_members
      set membership_status = :'status',
          revoked_at = case when :'status' = 'revoked' then now() else null end
      where project_id = :'project_id'::uuid
        and user_id = :'user_id'::uuid;
    `,
    { project_id: projectId, user_id: userId, status },
  );
}

export function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function pdfBytes(size = 128) {
  assert.ok(size >= 5);
  const bytes = new Uint8Array(size);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  for (let index = 5; index < size; index += 1) bytes[index] = index % 251;
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
  return { userId, client, token };
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

export function stage({
  client,
  projectId,
  documentId,
  bytes,
  mimeType = "application/pdf",
}) {
  return client.storage
    .from(STAGING_BUCKET)
    .upload(storagePath(projectId, documentId), bytes, {
      contentType: mimeType,
      upsert: false,
    });
}

export function invoke({ client, projectId, documentId }) {
  return client.functions.invoke("private-document-ingest", {
    headers: {
      "x-project-id": projectId,
      "x-document-id": documentId,
    },
  });
}

export function assertRejected(result, message) {
  assert.notEqual(result.error, null, message);
}

function attestationCount(projectId, documentId) {
  const output = runLocalSql(
    `
      select count(*)
      from public.private_document_ingest_attestations
      where project_id = :'project_id'::uuid
        and document_id = :'document_id'::uuid;
    `,
    { project_id: projectId, document_id: documentId },
  );
  return Number(output);
}

export async function assertNoTrustedObject({ admin, projectId, documentId }) {
  const object = await admin.storage
    .from(BUCKET)
    .download(storagePath(projectId, documentId));
  assertRejected(object, "Rejected promotion must not create canonical bytes.");
  assert.equal(
    attestationCount(projectId, documentId),
    0,
    "Rejected promotion must not create an attestation.",
  );
}

export async function assertStagedObjectPresent({
  admin,
  projectId,
  documentId,
}) {
  const info = await admin.storage
    .from(STAGING_BUCKET)
    .info(storagePath(projectId, documentId));
  assert.equal(info.error, null, "Expected staging object must remain present.");
  assert.notEqual(info.data, null, "Expected staging metadata must exist.");
}

export async function assertNoStagedObject({ admin, projectId, documentId }) {
  const object = await admin.storage
    .from(STAGING_BUCKET)
    .download(storagePath(projectId, documentId));
  assertRejected(object, "Trusted promotion must clean the staging object.");
}

export function assertNoAttestation({ projectId, documentId }) {
  assert.equal(attestationCount(projectId, documentId), 0);
}

export function documentUploadStatus({ projectId, documentId }) {
  return runLocalSql(
    `
      select upload_status
      from public.documents
      where project_id = :'project_id'::uuid
        and id = :'document_id'::uuid;
    `,
    { project_id: projectId, document_id: documentId },
  );
}

export function assertReady({ projectId, documentId }) {
  assert.equal(documentUploadStatus({ projectId, documentId }), "ready");
}

export async function cleanupHarness({
  admin,
  projectId,
  objectPaths,
  userIds,
}) {
  if (objectPaths.length > 0) {
    await admin.storage.from(BUCKET).remove(objectPaths);
    await admin.storage.from(STAGING_BUCKET).remove(objectPaths);
  }
  runLocalSql(`delete from public.projects where id = :'project_id'::uuid;`, {
    project_id: projectId,
  });
  for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
}

export { createClient, randomUUID };

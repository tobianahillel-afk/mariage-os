import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  localSupabaseEnvironment,
  localUserToken,
} from "./private-document-edge-environment.mjs";

export const BUCKET = "project-private";
export const STAGING_BUCKET = "document-ingest-staging";
export const MAX_BYTES = 25_000_000;
const clientTokens = new WeakMap();
let cachedDatabaseContainer = null;
let configuredPromotionOrigin = null;

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

export function setPromotionOrigin(value) {
  const url = new globalThis.URL(value);
  configuredPromotionOrigin = url.origin;
}

export function promotionUrl() {
  if (configuredPromotionOrigin === null) {
    fail("Pages promotion origin was not configured by the runtime harness.");
  }
  return `${configuredPromotionOrigin}/api/private-document-promote`;
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
        'WP-2.9C Pages integration',
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
  clientTokens.set(client, token);
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

function promotionError(status) {
  return Object.assign(new Error("trusted promotion rejected"), {
    context: { status },
  });
}

export async function invoke({ client, projectId, documentId }) {
  const token = clientTokens.get(client);
  const headers = {
    "x-project-id": projectId,
    "x-document-id": documentId,
  };
  if (token) headers.authorization = `Bearer ${token}`;

  let response;
  try {
    response = await globalThis.fetch(promotionUrl(), {
      method: "POST",
      headers,
    });
  } catch (error) {
    return { data: null, error };
  }

  const data = await response.json().catch(() => null);
  return response.ok
    ? { data, error: null }
    : { data: null, error: promotionError(response.status) };
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
  assert.equal(
    info.error,
    null,
    "Expected staging object must remain present.",
  );
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

export { createClient, localSupabaseEnvironment, randomUUID };

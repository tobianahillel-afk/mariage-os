import { URL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  LEGACY_SERVICE_BINDING,
  LIFECYCLE_BINDING,
  LIFECYCLE_CLASS,
  resolvePrivateDocumentLifecycleNamespace,
} from "./private-document-ar006-durable-object.mjs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function assertUuid(name, value) {
  if (!UUID_PATTERN.test(value)) throw new Error(`${name} must be a UUID.`);
}

function httpsOrigin(name) {
  const url = new URL(requiredEnv(name));
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS.`);
  return url.origin;
}

async function jsonRequest(url, options, errorMessage) {
  const response = await globalThis.fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) throw new Error(errorMessage);
  return payload.result;
}

async function verifySupabase(projectId) {
  const client = createClient(
    httpsOrigin("AR006_SUPABASE_URL"),
    requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const auth = await client.auth.signInWithPassword({
    email: requiredEnv("AR006_TEST_USER_EMAIL"),
    password: requiredEnv("AR006_TEST_USER_PASSWORD"),
  });
  if (auth.error || !auth.data.session?.access_token) {
    throw new Error("AR-006 synthetic Supabase authentication failed.");
  }
  const permission = await client.rpc("has_project_permission", {
    target_project_id: projectId,
    requested_permission: "documents.write",
  });
  if (permission.error || permission.data !== true) {
    throw new Error("AR-006 synthetic user lacks live documents.write.");
  }
}

function legacyServicePresent(services) {
  if (Array.isArray(services)) {
    return services.some(
      (entry) => entry?.binding === LEGACY_SERVICE_BINDING,
    );
  }
  return services?.[LEGACY_SERVICE_BINDING] !== undefined;
}

function requireMatchingText(preview, bindingName, expectedValue) {
  if (preview.env_vars?.[bindingName]?.value !== expectedValue) {
    throw new Error(`Pages preview ${bindingName} does not match AR-006.`);
  }
}

function requirePreview(project, namespaceId) {
  const preview = project.deployment_configs?.preview;
  if (preview === undefined) throw new Error("Pages Preview is unavailable.");
  if (preview.env_vars?.PRIVATE_DOCUMENT_ADMIN_KEY != null) {
    throw new Error("Pages Preview admin secret must be absent.");
  }
  if (legacyServicePresent(preview.services)) {
    throw new Error("Legacy promotion Service Binding must be absent.");
  }
  const binding = preview.durable_object_namespaces?.[LIFECYCLE_BINDING];
  if (binding?.namespace_id !== namespaceId) {
    throw new Error("Pages Preview Durable Object binding is incorrect.");
  }
  requireMatchingText(
    preview,
    "SUPABASE_URL",
    requiredEnv("AR006_SUPABASE_URL"),
  );
  requireMatchingText(
    preview,
    "SUPABASE_PUBLISHABLE_KEY",
    requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY"),
  );
}

async function verifyWorkerAdminSecret(accountId, workerName, token) {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
    `/workers/scripts/${encodeURIComponent(workerName)}` +
    "/secrets/PRIVATE_DOCUMENT_ADMIN_KEY";
  const secret = await jsonRequest(
    url,
    { headers: { authorization: `Bearer ${token}` } },
    "Worker admin secret metadata preflight failed.",
  );
  if (
    secret?.name !== "PRIVATE_DOCUMENT_ADMIN_KEY" ||
    secret?.type !== "secret_text"
  ) {
    throw new Error("Worker admin secret binding is missing.");
  }
}

async function verifyPagesProject(accountId, namespaceId) {
  const projectName = requiredEnv("AR006_PAGES_PROJECT");
  const deployToken = requiredEnv("AR006_CLOUDFLARE_DEPLOY_TOKEN");
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
    `/pages/projects/${projectName}`;
  const project = await jsonRequest(
    url,
    { headers: { authorization: `Bearer ${deployToken}` } },
    "Cloudflare Pages project preflight failed.",
  );
  requirePreview(project, namespaceId);
}

async function main() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error(
      "Workers Free isolated-environment attestation is required.",
    );
  }
  const projectId = requiredEnv("AR006_PROJECT_ID");
  assertUuid("AR006_PROJECT_ID", projectId);
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const workerName = requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER");
  const workerToken = requiredEnv("AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN");
  const namespace = await resolvePrivateDocumentLifecycleNamespace({
    accountId,
    workerName,
    token: workerToken,
  });
  if (namespace.className !== LIFECYCLE_CLASS || !namespace.useSqlite) {
    throw new Error("Durable Object namespace contract is invalid.");
  }
  await verifyWorkerAdminSecret(accountId, workerName, workerToken);
  await verifyPagesProject(accountId, namespace.id);
  await verifySupabase(projectId);
  console.log("AR-006 ADR 0012 isolated provider preflight passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

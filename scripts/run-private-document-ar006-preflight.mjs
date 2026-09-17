import { URL } from "node:url";
import { createClient } from "@supabase/supabase-js";

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
  if (!response.ok || payload === null) throw new Error(errorMessage);
  return payload;
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

function requirePagesProject(payload) {
  if (payload.success !== true || payload.result === null) {
    throw new Error("Cloudflare Pages project preflight failed.");
  }
  return payload.result;
}

function requirePreviewBindings(project) {
  const previewConfig = project.deployment_configs?.preview;
  const preview = previewConfig?.env_vars;
  if (preview?.PRIVATE_DOCUMENT_ADMIN_KEY?.type !== "secret_text") {
    throw new Error("PRIVATE_DOCUMENT_ADMIN_KEY preview secret is missing.");
  }
  return { preview, previewConfig };
}

function requireMatchingBinding(preview, bindingName, expectedValue) {
  if (preview[bindingName]?.value !== expectedValue) {
    throw new Error(`Pages preview ${bindingName} does not match AR-006.`);
  }
}

function serviceBindingMatches(services, expectedWorker) {
  if (Array.isArray(services)) {
    return services.some(
      (service) =>
        service?.binding === "PRIVATE_DOCUMENT_PROMOTION_WORKER" &&
        service?.service === expectedWorker,
    );
  }
  return (
    services?.PRIVATE_DOCUMENT_PROMOTION_WORKER?.service === expectedWorker
  );
}

function requirePromotionWorkerBinding(previewConfig) {
  const configured = serviceBindingMatches(
    previewConfig?.services,
    requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER"),
  );
  if (!configured) {
    throw new Error(
      "Private promotion Worker binding is missing or incorrect.",
    );
  }
}

async function verifyPagesProject() {
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const projectName = requiredEnv("AR006_PAGES_PROJECT");
  const deployToken = requiredEnv("AR006_CLOUDFLARE_DEPLOY_TOKEN");
  const projectUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
  const payload = await jsonRequest(
    projectUrl,
    { headers: { authorization: `Bearer ${deployToken}` } },
    "Cloudflare Pages project preflight failed.",
  );
  const project = requirePagesProject(payload);
  const { preview, previewConfig } = requirePreviewBindings(project);
  requireMatchingBinding(
    preview,
    "SUPABASE_URL",
    requiredEnv("AR006_SUPABASE_URL"),
  );
  requireMatchingBinding(
    preview,
    "SUPABASE_PUBLISHABLE_KEY",
    requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY"),
  );
  requirePromotionWorkerBinding(previewConfig);
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
  requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER");
  requiredEnv("AR006_CLOUDFLARE_DEPLOY_TOKEN");
  requiredEnv("AR006_TEST_USER_PASSWORD");
  await verifyPagesProject();
  await verifySupabase(projectId);
  console.log("AR-006 isolated provider preflight passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

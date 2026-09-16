import { createClient } from "@supabase/supabase-js";

const ANALYTICS_URL = "https://api.cloudflare.com/client/v4/graphql";
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
  if (payload.success !== true) {
    throw new Error("Cloudflare Pages project preflight failed.");
  }
  const project = payload.result;
  if (project?.uses_functions !== true) {
    throw new Error("AR-006 Pages project is not Functions-enabled.");
  }
  const preview = project?.deployment_configs?.preview?.env_vars;
  if (preview?.PRIVATE_DOCUMENT_ADMIN_KEY?.type !== "secret_text") {
    throw new Error("PRIVATE_DOCUMENT_ADMIN_KEY preview secret is missing.");
  }
  if (preview?.SUPABASE_URL?.value !== requiredEnv("AR006_SUPABASE_URL")) {
    throw new Error("Pages preview SUPABASE_URL does not match AR-006.");
  }
  if (
    preview?.SUPABASE_PUBLISHABLE_KEY?.value !==
    requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY")
  ) {
    throw new Error(
      "Pages preview SUPABASE_PUBLISHABLE_KEY does not match AR-006.",
    );
  }
  const scriptName = String(project?.preview_script_name ?? "").trim();
  if (!scriptName) throw new Error("Pages preview_script_name is unavailable.");
  return scriptName;
}

function analyticsWindow() {
  const end = new Date();
  const start = new Date(end.getTime() - 5 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function verifyAnalytics(scriptName) {
  const window = analyticsWindow();
  const query = `query Preflight($accountTag: string, $start: string, $end: string, $scriptName: string) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        workersInvocationsAdaptive(limit: 1, filter: {
          scriptName: $scriptName,
          datetime_geq: $start,
          datetime_leq: $end
        }) {
          sum { requests }
        }
      }
    }
  }`;
  const payload = await jsonRequest(
    ANALYTICS_URL,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${requiredEnv(
          "AR006_CLOUDFLARE_ANALYTICS_TOKEN",
        )}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          accountTag: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
          start: window.start,
          end: window.end,
          scriptName,
        },
      }),
    },
    "Cloudflare Analytics preflight failed.",
  );
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error("Cloudflare Analytics preflight failed.");
  }
  const accounts = payload?.data?.viewer?.accounts;
  if (!Array.isArray(accounts) || accounts.length !== 1) {
    throw new Error("Cloudflare Analytics account scope is invalid.");
  }
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
  requiredEnv("AR006_CLOUDFLARE_DEPLOY_TOKEN");
  requiredEnv("AR006_CLOUDFLARE_ANALYTICS_TOKEN");
  requiredEnv("AR006_TEST_USER_PASSWORD");
  const scriptName = await verifyPagesProject();
  await verifyAnalytics(scriptName);
  await verifySupabase(projectId);
  console.log("AR-006 isolated provider preflight passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

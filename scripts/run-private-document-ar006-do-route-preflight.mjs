import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function httpsOrigin(name) {
  const value = new URL(requiredEnv(name));
  if (value.protocol !== "https:") throw new Error(`${name} must use HTTPS.`);
  return value.origin;
}

async function accessToken() {
  const client = createClient(
    httpsOrigin("AR006_SUPABASE_URL"),
    requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const result = await client.auth.signInWithPassword({
    email: requiredEnv("AR006_TEST_USER_EMAIL"),
    password: requiredEnv("AR006_TEST_USER_PASSWORD"),
  });
  if (result.error || !result.data.session?.access_token) {
    throw new Error("Synthetic AR-006 authentication failed.");
  }
  return result.data.session.access_token;
}

async function main() {
  const baseUrl = httpsOrigin("AR006_DEPLOYMENT_URL");
  const response = await globalThis.fetch(
    `${baseUrl}/api/private-document-promote`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${await accessToken()}`,
        origin: baseUrl,
        "x-project-id": requiredEnv("AR006_PROJECT_ID"),
        "x-document-id": randomUUID(),
      },
    },
  );
  const payload = await response.json().catch(() => null);
  if (
    response.status !== 409 ||
    payload?.error !== "private_document_unavailable"
  ) {
    throw new Error("ADR 0012 route preflight did not reach the lifecycle DO.");
  }
  console.log(
    "AR-006 ADR 0012 route preflight reached the lifecycle DO without document mutation.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

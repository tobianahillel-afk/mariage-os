import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { requiredEnv } from "./private-document-ar006-do-evidence-env.mjs";

const PROMOTION_DELAY_MS = 1_500;

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

export async function signInAr006SyntheticUser() {
  const client = createClient(
    requiredEnv("AR006_SUPABASE_URL"),
    requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const result = await client.auth.signInWithPassword({
    email: requiredEnv("AR006_TEST_USER_EMAIL"),
    password: requiredEnv("AR006_TEST_USER_PASSWORD"),
  });
  if (result.error || !result.data.session?.access_token) {
    throw new Error("Synthetic AR-006 user authentication failed.");
  }
  return { client, token: result.data.session.access_token };
}

async function reserve({
  client,
  projectId,
  documentId,
  bytes,
  sha256,
  index,
}) {
  const result = await client.rpc("manage_private_document", {
    target_action: "reserve_upload",
    target_operation_id: randomUUID(),
    target_project_id: projectId,
    target_document_id: documentId,
    target_venue_id: null,
    target_link_id: null,
    target_expected_revision: null,
    target_document_type: "venue_contract",
    target_title: `AR-006 ADR 0012 exact-size proof ${index + 1}`,
    target_original_filename: `ar006-do-${index + 1}.pdf`,
    target_mime_type: "application/pdf",
    target_size_bytes: bytes.byteLength,
    target_sha256: sha256,
    target_source_id: null,
  });
  if (result.error) throw new Error("Synthetic reservation failed.");
}

async function stage(client, projectId, documentId, bytes) {
  const path = `${projectId}/documents/${documentId}/original`;
  const result = await client.storage
    .from("document-ingest-staging")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (result.error) throw new Error("Synthetic staging upload failed.");
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
  if (result.error) throw new Error("Synthetic finalization failed.");

  const verified = await client
    .from("documents")
    .select("upload_status")
    .eq("project_id", projectId)
    .eq("id", documentId)
    .maybeSingle();
  if (verified.error || verified.data?.upload_status !== "ready") {
    throw new Error("Synthetic finalization state verification failed.");
  }
}

async function promote({ baseUrl, token, projectId, documentId, evidenceId }) {
  try {
    const response = await globalThis.fetch(
      `${baseUrl}/api/private-document-promote`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          origin: baseUrl,
          "x-project-id": projectId,
          "x-document-id": documentId,
          "x-mariage-os-ar006-evidence-id": evidenceId,
        },
      },
    );
    const payload = await response.json().catch(() => null);
    return {
      status: response.status,
      success: response.ok && payload?.ok === true,
    };
  } catch {
    return { status: 0, success: false };
  }
}

async function runPromotion(context, identity, index) {
  const documentId = randomUUID();
  const evidenceId = randomUUID();
  await reserve({
    client: identity.client,
    projectId: context.projectId,
    documentId,
    bytes: context.bytes,
    sha256: context.sha256,
    index,
  });
  await stage(identity.client, context.projectId, documentId, context.bytes);
  const startedAt = new Date().toISOString();
  const result = await promote({
    baseUrl: context.deploymentUrl,
    token: identity.token,
    projectId: context.projectId,
    documentId,
    evidenceId,
  });
  const completedAt = new Date().toISOString();
  let finalized = false;
  if (result.success) {
    await finalize(identity.client, context.projectId, documentId);
    finalized = true;
  }
  return {
    documentId,
    evidenceId,
    startedAt,
    completedAt,
    finalized,
    ...result,
  };
}

export async function runAr006Promotions(context, identity, count) {
  const invocations = [];
  for (let index = 0; index < count; index += 1) {
    invocations.push(await runPromotion(context, identity, index));
    if (index + 1 < count) await delay(PROMOTION_DELAY_MS);
  }
  return invocations;
}

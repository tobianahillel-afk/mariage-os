import {
  LEGACY_SERVICE_BINDING,
  LIFECYCLE_BINDING,
} from "./private-document-ar006-durable-object.mjs";

const MAX_PROVIDER_ERRORS = 5;
const SAFE_POINTER = /^[A-Za-z0-9_./~\\-\\[\\]]{1,240}$/u;

function providerErrorCodes(payload) {
  if (!Array.isArray(payload?.errors)) return [];
  return payload.errors
    .slice(0, MAX_PROVIDER_ERRORS)
    .map((entry) => entry?.code)
    .filter(
      (code) =>
        (typeof code === "number" && Number.isFinite(code)) ||
        (typeof code === "string" && /^[A-Za-z0-9_.:-]{1,80}$/u.test(code)),
    )
    .map(String);
}

function providerErrorPointers(payload) {
  if (!Array.isArray(payload?.errors)) return [];
  return payload.errors
    .slice(0, MAX_PROVIDER_ERRORS)
    .map((entry) => entry?.source?.pointer ?? entry?.source?.field)
    .filter(
      (pointer) => typeof pointer === "string" && SAFE_POINTER.test(pointer),
    );
}

export function cloudflareFailureSummary(status, payload) {
  const parts = [`status=${Number.isInteger(status) ? status : "unknown"}`];
  const codes = providerErrorCodes(payload);
  const pointers = providerErrorPointers(payload);
  if (codes.length > 0) parts.push(`codes=${codes.join(",")}`);
  if (pointers.length > 0) parts.push(`fields=${pointers.join(",")}`);
  return parts.join(" ");
}

export function pagesPreviewMutation(
  { supabaseUrl, publishableKey },
  namespaceId,
) {
  return {
    env_vars: {
      PRIVATE_DOCUMENT_ADMIN_KEY: null,
      SUPABASE_URL: { type: "plain_text", value: supabaseUrl },
      SUPABASE_PUBLISHABLE_KEY: {
        type: "plain_text",
        value: publishableKey,
      },
    },
    services: {
      [LEGACY_SERVICE_BINDING]: null,
    },
    durable_object_namespaces: {
      [LIFECYCLE_BINDING]: { namespace_id: namespaceId },
    },
  };
}

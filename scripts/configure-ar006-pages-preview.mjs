import { writeFile } from "node:fs/promises";
import { URL } from "node:url";
import {
  LEGACY_SERVICE_BINDING,
  LIFECYCLE_BINDING,
  LIFECYCLE_CLASS,
  resolvePrivateDocumentLifecycleNamespace,
} from "./private-document-ar006-durable-object.mjs";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + " is required.");
  return value;
}

function httpsOrigin(name) {
  const url = new URL(requiredEnv(name));
  if (url.protocol !== "https:") throw new Error(name + " must use HTTPS.");
  return url.origin;
}

function configuration() {
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    projectName: requiredEnv("AR006_PAGES_PROJECT"),
    workerName: requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER"),
    pagesToken: requiredEnv("CLOUDFLARE_API_TOKEN"),
    workerToken: requiredEnv("CLOUDFLARE_WORKER_API_TOKEN"),
    supabaseUrl: httpsOrigin("AR006_SUPABASE_URL"),
    publishableKey: requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY"),
  };
}

function projectUrl({ accountId, projectName }) {
  return (
    "https://api.cloudflare.com/client/v4/accounts/" +
    accountId +
    "/pages/projects/" +
    projectName
  );
}

function authorizationHeaders(token) {
  return {
    authorization: "Bearer " + token,
    "content-type": "application/json",
  };
}

async function requestJson(url, options, message) {
  const response = await globalThis.fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    throw new Error(message);
  }
  return payload.result;
}

function withoutLegacyService(services) {
  if (Array.isArray(services)) {
    return services.filter(
      (entry) => entry?.binding !== LEGACY_SERVICE_BINDING,
    );
  }
  if (typeof services !== "object" || services === null) return {};
  return Object.fromEntries(
    Object.entries(services).filter(([name]) => name !== LEGACY_SERVICE_BINDING),
  );
}

function withLifecycleNamespace(namespaces, namespaceId) {
  const current =
    typeof namespaces === "object" && namespaces !== null ? namespaces : {};
  return {
    ...current,
    [LIFECYCLE_BINDING]: { namespace_id: namespaceId },
  };
}

function previewPatch(project, input, namespaceId) {
  const preview = project.deployment_configs?.preview ?? {};
  const production = project.deployment_configs?.production ?? {};
  const failOpen =
    typeof preview.fail_open === "boolean"
      ? preview.fail_open
      : production.fail_open;
  if (typeof failOpen !== "boolean") {
    throw new Error("Cloudflare Pages fail_open configuration is unavailable.");
  }
  return {
    fail_open: failOpen,
    env_vars: {
      PRIVATE_DOCUMENT_ADMIN_KEY: null,
      SUPABASE_URL: { type: "plain_text", value: input.supabaseUrl },
      SUPABASE_PUBLISHABLE_KEY: {
        type: "plain_text",
        value: input.publishableKey,
      },
    },
    services: withoutLegacyService(preview.services),
    durable_object_namespaces: withLifecycleNamespace(
      preview.durable_object_namespaces,
      namespaceId,
    ),
  };
}

function legacyServicePresent(services) {
  if (Array.isArray(services)) {
    return services.some(
      (entry) => entry?.binding === LEGACY_SERVICE_BINDING,
    );
  }
  return services?.[LEGACY_SERVICE_BINDING] !== undefined;
}

function requireText(preview, name, expected) {
  if (preview.env_vars?.[name]?.value !== expected) {
    throw new Error("AR-006 Preview " + name + " does not match.");
  }
}

function requirePreview(project, input, namespaceId) {
  const preview = project.deployment_configs?.preview;
  if (preview === undefined) throw new Error("AR-006 Preview is unavailable.");
  if (preview.env_vars?.PRIVATE_DOCUMENT_ADMIN_KEY != null) {
    throw new Error("Pages Preview admin secret must be absent.");
  }
  requireText(preview, "SUPABASE_URL", input.supabaseUrl);
  requireText(preview, "SUPABASE_PUBLISHABLE_KEY", input.publishableKey);
  if (legacyServicePresent(preview.services)) {
    throw new Error("Legacy promotion Service Binding must be absent.");
  }
  const binding = preview.durable_object_namespaces?.[LIFECYCLE_BINDING];
  if (binding?.namespace_id !== namespaceId) {
    throw new Error("Pages Preview Durable Object namespace does not match.");
  }
  return preview;
}

async function writeReceipt(input, namespace) {
  const receipt = {
    project: input.projectName,
    environment: "preview",
    verified_at: new Date().toISOString(),
    pages_admin_secret_absent: true,
    legacy_service_binding_absent: true,
    durable_object_binding: {
      binding: LIFECYCLE_BINDING,
      namespace_id: namespace.id,
      class_name: LIFECYCLE_CLASS,
      worker: input.workerName,
      sqlite: true,
    },
  };
  await writeFile(
    "ar006-pages-preview-config.json",
    JSON.stringify(receipt, null, 2) + "\n",
    "utf8",
  );
}

async function main() {
  const input = configuration();
  const url = projectUrl(input);
  const namespace = await resolvePrivateDocumentLifecycleNamespace({
    accountId: input.accountId,
    workerName: input.workerName,
    token: input.workerToken,
  });
  const project = await requestJson(
    url,
    { headers: authorizationHeaders(input.pagesToken) },
    "Cloudflare Pages project read failed.",
  );
  const updated = await requestJson(
    url,
    {
      method: "PATCH",
      headers: authorizationHeaders(input.pagesToken),
      body: JSON.stringify({
        deployment_configs: {
          preview: previewPatch(project, input, namespace.id),
        },
      }),
    },
    "Cloudflare Pages Preview configuration update failed.",
  );
  requirePreview(updated, input, namespace.id);
  await writeReceipt(input, namespace);
  console.log("AR-006 Pages Preview Durable Object binding applied.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

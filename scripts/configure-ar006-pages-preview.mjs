import { writeFile } from "node:fs/promises";
import { URL } from "node:url";

const BINDING_NAME = "PRIVATE_DOCUMENT_PROMOTION_WORKER";

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
    token: requiredEnv("CLOUDFLARE_API_TOKEN"),
    adminKey: requiredEnv("PRIVATE_DOCUMENT_ADMIN_KEY"),
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
    const details = Array.isArray(payload?.errors)
      ? payload.errors
          .map((error) =>
            typeof error?.code === "number" &&
            typeof error?.message === "string"
              ? "[" + error.code + "] " + error.message
              : null,
          )
          .filter((detail) => detail !== null)
          .join("; ")
      : "";
    throw new Error(details === "" ? message : message + " " + details);
  }
  return payload.result;
}

function serviceMatches(services, workerName) {
  if (Array.isArray(services)) {
    return services.some(
      (service) =>
        service?.binding === BINDING_NAME && service?.service === workerName,
    );
  }
  return services?.[BINDING_NAME]?.service === workerName;
}

function withPromotionService(services, workerName) {
  const service = { service: workerName, environment: "production" };
  if (Array.isArray(services)) {
    return [
      ...services.filter((entry) => entry?.binding !== BINDING_NAME),
      { binding: BINDING_NAME, ...service },
    ];
  }
  return {
    ...(services && typeof services === "object" ? services : {}),
    [BINDING_NAME]: service,
  };
}

function configuredPreview(project, input) {
  const preview = project.deployment_configs?.preview ?? {};
  const production = project.deployment_configs?.production ?? {};
  if (typeof production.fail_open !== "boolean") {
    throw new Error("Cloudflare Pages Production fail_open is unavailable.");
  }
  return {
    ...preview,
    fail_open: production.fail_open,
    env_vars: {
      PRIVATE_DOCUMENT_ADMIN_KEY: {
        type: "secret_text",
        value: input.adminKey,
      },
      SUPABASE_URL: { type: "plain_text", value: input.supabaseUrl },
      SUPABASE_PUBLISHABLE_KEY: {
        type: "plain_text",
        value: input.publishableKey,
      },
    },
    services: withPromotionService(preview.services, input.workerName),
  };
}

function requireSecret(preview) {
  if (preview.env_vars?.PRIVATE_DOCUMENT_ADMIN_KEY?.type !== "secret_text") {
    throw new Error("AR-006 Preview secret is missing.");
  }
}

function requireText(preview, name, expected) {
  if (preview.env_vars?.[name]?.value !== expected) {
    throw new Error("AR-006 Preview " + name + " does not match.");
  }
}

function requirePreview(project, input) {
  const preview = project.deployment_configs?.preview;
  if (preview === undefined) throw new Error("AR-006 Preview is unavailable.");
  requireSecret(preview);
  requireText(preview, "SUPABASE_URL", input.supabaseUrl);
  requireText(preview, "SUPABASE_PUBLISHABLE_KEY", input.publishableKey);
  if (!serviceMatches(preview.services, input.workerName)) {
    throw new Error("AR-006 Preview Worker binding is missing.");
  }
  return preview;
}

async function writeReceipt(input, preview) {
  const receipt = {
    project: input.projectName,
    environment: "preview",
    verified_at: new Date().toISOString(),
    env_vars: {
      PRIVATE_DOCUMENT_ADMIN_KEY: "secret_text",
      SUPABASE_URL: input.supabaseUrl,
      SUPABASE_PUBLISHABLE_KEY: input.publishableKey,
    },
    promotion_service_binding: {
      binding: BINDING_NAME,
      service: input.workerName,
      configured_shape: Array.isArray(preview.services) ? "array" : "record",
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
  const headers = authorizationHeaders(input.token);
  const project = await requestJson(
    url,
    { headers },
    "Cloudflare Pages project read failed.",
  );
  const preview = configuredPreview(project, input);
  const updated = await requestJson(
    url,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        deployment_configs: {
          production: {
            fail_open: project.deployment_configs.production.fail_open,
          },
          preview,
        },
      }),
    },
    "Cloudflare Pages Preview configuration update failed.",
  );
  await writeReceipt(input, requirePreview(updated, input));
  console.log("AR-006 Pages Preview configuration applied and verified.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

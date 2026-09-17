import { writeFile } from "node:fs/promises";

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

async function requestJson(url, options, message) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    const details = Array.isArray(payload?.errors)
      ? payload.errors
          .map((error) =>
            typeof error?.code === "number" && typeof error?.message === "string"
              ? `[${error.code}] ${error.message}`
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
  if (Array.isArray(services)) {
    return [
      ...services.filter((service) => service?.binding !== BINDING_NAME),
      {
        binding: BINDING_NAME,
        service: workerName,
        environment: "production",
      },
    ];
  }
  return {
    ...(services && typeof services === "object" ? services : {}),
    [BINDING_NAME]: {
      service: workerName,
      environment: "production",
    },
  };
}

function requirePreview(project, workerName, supabaseUrl, publishableKey) {
  const preview = project.deployment_configs?.preview;
  if (
    preview?.env_vars?.PRIVATE_DOCUMENT_ADMIN_KEY?.type !== "secret_text" ||
    preview.env_vars?.SUPABASE_URL?.value !== supabaseUrl ||
    preview.env_vars?.SUPABASE_PUBLISHABLE_KEY?.value !== publishableKey ||
    !serviceMatches(preview.services, workerName)
  ) {
    throw new Error("AR-006 Pages Preview configuration verification failed.");
  }
  return preview;
}

async function main() {
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const projectName = requiredEnv("AR006_PAGES_PROJECT");
  const workerName = requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER");
  const token = requiredEnv("CLOUDFLARE_API_TOKEN");
  const adminKey = requiredEnv("PRIVATE_DOCUMENT_ADMIN_KEY");
  const supabaseUrl = httpsOrigin("AR006_SUPABASE_URL");
  const publishableKey = requiredEnv("AR006_SUPABASE_PUBLISHABLE_KEY");
  const projectUrl =
    "https://api.cloudflare.com/client/v4/accounts/" +
    accountId +
    "/pages/projects/" +
    projectName;
  const headers = {
    authorization: "Bearer " + token,
    "content-type": "application/json",
  };
  const project = await requestJson(
    projectUrl,
    { headers },
    "Cloudflare Pages project read failed.",
  );
  const preview = project.deployment_configs?.preview ?? {};
  const production = project.deployment_configs?.production ?? {};
  const nextPreview = {
    ...preview,
    ...(typeof production.fail_open === "boolean"
      ? { fail_open: production.fail_open }
      : {}),
    env_vars: {
      PRIVATE_DOCUMENT_ADMIN_KEY: { type: "secret_text", value: adminKey },
      SUPABASE_URL: { type: "plain_text", value: supabaseUrl },
      SUPABASE_PUBLISHABLE_KEY: {
        type: "plain_text",
        value: publishableKey,
      },
    },
    services: withPromotionService(preview.services, workerName),
  };
  const updated = await requestJson(
    projectUrl,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        deployment_configs: { preview: nextPreview },
      }),
    },
    "Cloudflare Pages Preview configuration update failed.",
  );
  const verified = requirePreview(
    updated,
    workerName,
    supabaseUrl,
    publishableKey,
  );
  await writeFile(
    "ar006-pages-preview-config.json",
    JSON.stringify(
      {
        project: projectName,
        environment: "preview",
        verified_at: new Date().toISOString(),
        env_vars: {
          PRIVATE_DOCUMENT_ADMIN_KEY: "secret_text",
          SUPABASE_URL: supabaseUrl,
          SUPABASE_PUBLISHABLE_KEY: publishableKey,
        },
        promotion_service_binding: {
          binding: BINDING_NAME,
          service: workerName,
          configured_shape: Array.isArray(verified.services)
            ? "array"
            : "record",
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  console.log("AR-006 Pages Preview configuration applied and verified.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

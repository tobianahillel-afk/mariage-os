import { URL } from "node:url";
import {
  assertDenied,
  assertEventuallyDenied,
} from "./private-document-production-smoke.mjs";

const baseUrlValue = process.env.PRIVATE_DOCUMENT_SMOKE_BASE_URL;

if (!baseUrlValue) {
  console.error("PRIVATE_DOCUMENT_SMOKE_BASE_URL is required.");
  process.exit(2);
}

const baseUrl = new URL(baseUrlValue);
if (baseUrl.protocol !== "https:") {
  console.error("Production smoke requires an HTTPS base URL.");
  process.exit(2);
}

const routeUrl = new URL("/api/private-document-promote", baseUrl);
const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const targetHeaders = {
  "x-project-id": projectId,
  "x-document-id": documentId,
};

async function run() {
  const staticResponse = await globalThis.fetch(baseUrl, {
    redirect: "manual",
  });
  if (staticResponse.status >= 500) {
    throw new Error(
      `Static application smoke failed with ${staticResponse.status}.`,
    );
  }

  await assertEventuallyDenied({
    routeUrl,
    label: "unsupported method",
    expectedStatus: 405,
    init: { method: "GET" },
  });
  await assertDenied({
    routeUrl,
    label: "missing bearer token",
    expectedStatus: 401,
    init: { method: "POST", headers: targetHeaders },
  });
  await assertDenied({
    routeUrl,
    label: "framed request body",
    expectedStatus: 413,
    init: { method: "POST", headers: targetHeaders, body: "x" },
  });
  await assertDenied({
    routeUrl,
    label: "cross-origin request",
    expectedStatus: 403,
    init: {
      method: "POST",
      headers: {
        ...targetHeaders,
        origin: "https://invalid.example",
      },
    },
  });

  console.log(
    "Private-document production deny smoke passed without privileged credentials.",
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

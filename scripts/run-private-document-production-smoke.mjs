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

function unavailablePayload(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    value.error === "private_document_unavailable"
  );
}

async function assertDenied(label, expectedStatus, init) {
  const response = await fetch(routeUrl, {
    redirect: "manual",
    ...init,
  });
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label}: expected HTTP ${expectedStatus}, received ${response.status}.`,
    );
  }
  if (response.headers.get("access-control-allow-origin") === "*") {
    throw new Error(`${label}: wildcard CORS must not be emitted.`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`${label}: route resolved to non-JSON content/fallback.`);
  }
  const payload = await response.json();
  if (!unavailablePayload(payload)) {
    throw new Error(`${label}: route returned an unexpected response shape.`);
  }
}

async function run() {
  const staticResponse = await fetch(baseUrl, { redirect: "manual" });
  if (staticResponse.status >= 500) {
    throw new Error(`Static application smoke failed with ${staticResponse.status}.`);
  }

  await assertDenied("unsupported method", 405, { method: "GET" });
  await assertDenied("missing bearer token", 401, {
    method: "POST",
    headers: targetHeaders,
  });
  await assertDenied("framed request body", 413, {
    method: "POST",
    headers: targetHeaders,
    body: "x",
  });
  await assertDenied("cross-origin request", 403, {
    method: "POST",
    headers: {
      ...targetHeaders,
      origin: "https://invalid.example",
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

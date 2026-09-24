export const LIFECYCLE_BINDING = "PRIVATE_DOCUMENT_LIFECYCLE";
export const LIFECYCLE_CLASS = "PrivateDocumentLifecycle";
export const LEGACY_SERVICE_BINDING = "PRIVATE_DOCUMENT_PROMOTION_WORKER";

const API_ROOT = "https://api.cloudflare.com/client/v4/accounts";
const PAGE_SIZE = 1000;

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function namespaceInventory(payload) {
  if (!isRecord(payload) || payload.success !== true) {
    throw new Error("Durable Object namespace inventory failed.");
  }
  if (!Array.isArray(payload.result)) {
    throw new Error("Durable Object namespace inventory is malformed.");
  }
  const total = Number(payload.result_info?.total_count);
  if (Number.isFinite(total) && total > payload.result.length) {
    throw new Error(
      "Durable Object namespace inventory exceeded bounded page.",
    );
  }
  return payload.result;
}

function matchingNamespace(value, workerName) {
  return (
    isRecord(value) &&
    value.script === workerName &&
    value.class === LIFECYCLE_CLASS &&
    value.use_sqlite === true &&
    typeof value.id === "string" &&
    value.id.length > 0
  );
}

export async function resolvePrivateDocumentLifecycleNamespace({
  accountId,
  workerName,
  token,
  fetcher = globalThis.fetch,
}) {
  const response = await fetcher(
    `${API_ROOT}/${encodeURIComponent(accountId)}/workers/durable_objects/namespaces?per_page=${PAGE_SIZE}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error("Durable Object namespace inventory failed.");
  }
  const matches = namespaceInventory(payload).filter((value) =>
    matchingNamespace(value, workerName),
  );
  if (matches.length !== 1) {
    throw new Error(
      "Expected exactly one SQLite PrivateDocumentLifecycle namespace.",
    );
  }
  return {
    id: matches[0].id,
    className: LIFECYCLE_CLASS,
    workerName,
    useSqlite: true,
  };
}

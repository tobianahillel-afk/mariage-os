import { writeFile } from "node:fs/promises";
import {
  queryWorkersObservability,
  verifyObservabilityAccountToken,
} from "./private-document-ar006-observability-client.mjs";

const EVIDENCE_PATH = "ar006-observability-token-capability.json";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error("Isolated Workers Free attestation is required.");
  }
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const workerName = requiredEnv("AR006_PRIVATE_DOCUMENT_WORKER");
  const token = requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN");
  const verification = await verifyObservabilityAccountToken({
    accountId,
    token,
  });
  const to = Date.now();
  const timeframe = { from: to - 5 * 60_000, to };
  const query = verification.tokenActive
    ? await queryWorkersObservability({
        accountId,
        workerName,
        token,
        timeframe,
        queryId: "mariage-os-ar006-observability-token-capability",
      })
    : null;
  const evidence = {
    schema: "mariage-os.wp29c.ar006.token-capability.v1",
    generatedAt: new Date().toISOString(),
    workerName,
    tokenVerification: verification,
    telemetryAuthorization: query
      ? {
          httpStatus: query.httpStatus,
          apiSuccess: query.apiSuccess,
          providerErrorCodes: query.providerErrorCodes,
        }
      : null,
    pass: verification.tokenActive && query?.apiSuccess === true,
  };
  await writeFile(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Sanitized AR-006 token capability written to ${EVIDENCE_PATH}.`);
  if (!evidence.pass) {
    throw new Error("AR-006 Observability token capability did not pass.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

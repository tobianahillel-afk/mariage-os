import { writeFile } from "node:fs/promises";
import {
  verifyObservabilityAccountToken,
  verifyObservabilityUserToken,
} from "./private-document-ar006-observability-client.mjs";

const EVIDENCE_PATH = "ar006-observability-token-diagnostic.json";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function safeVerify(verify) {
  try {
    return { ...(await verify()), transportError: false };
  } catch {
    return {
      httpStatus: null,
      apiSuccess: false,
      tokenActive: false,
      providerErrorCodes: [],
      transportError: true,
    };
  }
}

function activeOwner(account, user) {
  if (account.tokenActive && !user.tokenActive) return "account";
  if (user.tokenActive && !account.tokenActive) return "user";
  return "none_or_ambiguous";
}

async function main() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error("Isolated Workers Free attestation is required.");
  }
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN");
  const account = await safeVerify(() =>
    verifyObservabilityAccountToken({ accountId, token }),
  );
  const user = await safeVerify(() => verifyObservabilityUserToken({ token }));
  const owner = activeOwner(account, user);
  const evidence = {
    schema: "mariage-os.wp29c.ar006.token-diagnostic.v1",
    generatedAt: new Date().toISOString(),
    accountVerification: account,
    userVerification: user,
    activeOwner: owner,
    pass: owner === "account" || owner === "user",
  };
  await writeFile(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Sanitized AR-006 token diagnostic written to ${EVIDENCE_PATH}.`);
  if (!evidence.pass) {
    throw new Error("AR-006 Observability token did not verify.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

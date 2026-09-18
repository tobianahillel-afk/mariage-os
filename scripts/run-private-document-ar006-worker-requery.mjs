import { writeFile } from "node:fs/promises";
import {
  CPU_BUDGET_MS,
  evaluateAr006WorkerEvents,
} from "./private-document-ar006-worker-metrics.mjs";
import {
  nextObservabilityDelayMs,
  queryWorkersObservability,
} from "./private-document-ar006-observability-client.mjs";
import { workerEvidenceTimeframe } from "./private-document-ar006-observability-timeframe.mjs";
import { workerEvidenceRequerySource } from "./private-document-ar006-worker-requery-source.mjs";

const EVIDENCE_PATH = "ar006-workers-free-worker-requery.json";
const QUERY_ATTEMPTS = 3;
const QUERY_DELAY_MS = 30_000;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function assertContext() {
  if (
    requiredEnv("AR006_WORKERS_FREE_ATTESTATION") !==
    "YES-WORKERS-FREE-ISOLATED"
  ) {
    throw new Error(
      "Workers Free isolated-environment attestation is required.",
    );
  }
  if (workerEvidenceRequerySource.expectedEvidenceIds.length !== 10) {
    throw new Error("AR-006 requery source must contain exactly ten UUIDs.");
  }
  return {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    token: requiredEnv("CLOUDFLARE_OBSERVABILITY_API_TOKEN"),
    ...workerEvidenceRequerySource,
  };
}

function attemptRecord(result, attempt) {
  return {
    attempt,
    httpStatus: result.httpStatus,
    apiSuccess: result.apiSuccess,
    providerErrorCodes: result.providerErrorCodes,
    retryAfterMs: result.retryAfterMs,
  };
}

async function collectWorkerEvidence(context) {
  const attempts = [];
  let latest = null;
  for (let attempt = 1; attempt <= QUERY_ATTEMPTS; attempt += 1) {
    const timeframe = workerEvidenceTimeframe(context.firstPromotionStartedAt);
    const result = await queryWorkersObservability({
      accountId: context.accountId,
      workerName: context.workerName,
      token: context.token,
      timeframe: timeframe.request,
      queryId: "mariage-os-ar006-worker-evidence-requery",
    });
    const evaluation = evaluateAr006WorkerEvents(
      result.events,
      context.expectedEvidenceIds,
      context.workerName,
    );
    latest = {
      ...result,
      window: timeframe.record,
      evaluation,
    };
    attempts.push(attemptRecord(result, attempt));
    if (result.apiSuccess && evaluation.pass) break;
    if (attempt < QUERY_ATTEMPTS) {
      await delay(nextObservabilityDelayMs(result, QUERY_DELAY_MS));
    }
  }
  return { latest, attempts };
}

function sourceEvidence(context) {
  return {
    artifact: context.sourceArtifact,
    gitCommit: context.gitCommit,
    deployment: context.deployment,
    workerName: context.workerName,
    exactBytes: context.exactBytes,
    sha256: context.sha256,
    invocationCount: context.expectedEvidenceIds.length,
  };
}

function noProviderEvidence() {
  return {
    httpStatus: null,
    apiSuccess: false,
    providerErrorCodes: [],
    observationWindow: null,
    measurements: [],
    failures: [{ code: "no_provider_query", evidenceId: null }],
  };
}

function providerEvidence(latest, attempts) {
  if (latest === null) {
    return { ...noProviderEvidence(), queryAttempts: attempts };
  }
  return {
    httpStatus: latest.httpStatus,
    apiSuccess: latest.apiSuccess,
    providerErrorCodes: latest.providerErrorCodes,
    observationWindow: latest.window,
    queryAttempts: attempts,
    measurements: latest.evaluation.measurements,
    failures: latest.evaluation.failures,
  };
}

function evidencePass(latest) {
  return latest !== null && latest.apiSuccess && latest.evaluation.pass;
}

function evidenceRecord(context, observation) {
  const { latest, attempts } = observation;
  return {
    schema: "mariage-os.wp29c.ar006.worker-observability-requery.v1",
    generatedAt: new Date().toISOString(),
    source: sourceEvidence(context),
    workersPlanAttestation: "Workers Free / isolated non-production",
    provider: providerEvidence(latest, attempts),
    cpuBudgetMs: CPU_BUDGET_MS,
    paidCpuEntitlementAttestedAbsent: true,
    pass: evidencePass(latest),
  };
}

async function main() {
  const context = assertContext();
  const observation = await collectWorkerEvidence(context);
  const evidence = evidenceRecord(context, observation);
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  console.log(`AR-006 Worker telemetry requery written to ${EVIDENCE_PATH}.`);
  if (!evidence.pass) {
    throw new Error(
      "AR-006 Worker telemetry requery did not satisfy the Free CPU gate.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

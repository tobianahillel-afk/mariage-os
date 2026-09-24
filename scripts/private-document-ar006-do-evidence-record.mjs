import { writeFile } from "node:fs/promises";
import { requiredEnv } from "./private-document-ar006-do-evidence-env.mjs";

const EVIDENCE_PATH = "ar006-adr0012-two-surface-evidence.json";

function sanitizedQuery(result) {
  if (result === null) return null;
  return {
    httpStatus: result.httpStatus,
    apiSuccess: result.apiSuccess,
    providerErrorCodes: result.providerErrorCodes,
    totalEventCount: result.totalEventCount,
    eventPageComplete: result.eventPageComplete,
    retryAfterMs: result.retryAfterMs,
  };
}

function sanitizedDiscovery(result) {
  if (result === null) return null;
  return {
    attempt: result.attempt,
    window: result.window,
    query: sanitizedQuery(result),
    markerCount: result.discovery.markerCount,
    failures: result.discovery.failures,
    pagesScriptName: result.discovery.pagesScriptName,
    pass: result.discovery.pass,
  };
}

function sanitizedEvaluation(observation) {
  if (observation === null) return null;
  return {
    attempt: observation.attempt,
    window: observation.window,
    pagesQuery: sanitizedQuery(observation.pages),
    durableObjectQuery: sanitizedQuery(observation.durableObject),
    evaluation: observation.evaluation,
  };
}

export function buildEvidenceRecord({
  context,
  invocations,
  markerPreflight,
  discovery,
  observation,
  pass,
  exactBytes,
  invocationCount,
}) {
  return {
    schema: "mariage-os.wp29c.ar006.adr0012-two-surface.v1",
    generatedAt: new Date().toISOString(),
    gitCommit: requiredEnv("AR006_EXPECTED_SHA"),
    pagesProject: requiredEnv("AR006_PAGES_PROJECT"),
    deployment: {
      id: requiredEnv("AR006_DEPLOYMENT_ID"),
      url: context.deploymentUrl,
      branch: requiredEnv("AR006_DEPLOYMENT_BRANCH"),
    },
    worker: {
      name: context.durableObjectScriptName,
      deploymentId: context.workerDeploymentId,
      versionId: context.workerVersionId,
    },
    workersPlanAttestation: "Workers Free / isolated non-production",
    exactBytes,
    sha256: context.sha256,
    projectId: context.projectId,
    invocationCount,
    invocations,
    markerPreflight: sanitizedDiscovery(markerPreflight),
    discovery: sanitizedDiscovery(discovery),
    provider: sanitizedEvaluation(observation),
    paidCpuEntitlementAttestedAbsent: true,
    pass,
  };
}

export async function writeEvidence(record) {
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
  console.log(`ADR 0012 provider evidence written to ${EVIDENCE_PATH}.`);
}

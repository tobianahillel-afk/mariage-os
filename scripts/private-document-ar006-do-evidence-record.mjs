import { writeFile } from "node:fs/promises";
import { requiredEnv } from "./private-document-ar006-do-evidence-env.mjs";

const EVIDENCE_PATH = "ar006-adr0013-two-surface-evidence.json";

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

function sanitizedPreflight(result) {
  if (result === null) return null;
  return {
    attempt: result.attempt,
    window: result.window,
    ingressQuery: sanitizedQuery(result.ingress),
    durableObjectQuery: sanitizedQuery(result.durableObject),
    markerCount: result.discovery.markerCount,
    failures: result.discovery.failures,
    routeReadiness: result.routeReadiness,
    pass: result.discovery.pass,
  };
}

function sanitizedEvaluation(observation) {
  if (observation === null) return null;
  return {
    attempt: observation.attempt,
    window: observation.window,
    ingressQuery: sanitizedQuery(observation.ingress),
    durableObjectQuery: sanitizedQuery(observation.durableObject),
    evaluation: observation.evaluation,
  };
}

function providerIdentity(context) {
  return {
    ingress: {
      name: context.ingressScriptName,
      deploymentId: context.ingressDeploymentId,
      versionId: context.ingressVersionId,
    },
    durableObjectHost: {
      name: context.durableObjectScriptName,
      deploymentId: context.workerDeploymentId,
      versionId: context.workerVersionId,
    },
  };
}

function baseRecord(context, exactBytes, invocationCount) {
  return {
    generatedAt: new Date().toISOString(),
    gitCommit: requiredEnv("AR006_EXPECTED_SHA"),
    deploymentUrl: context.deploymentUrl,
    providerIdentity: providerIdentity(context),
    workersPlanAttestation: "Workers Free / isolated non-production",
    exactBytes,
    projectId: context.projectId,
    invocationCount,
    paidCpuEntitlementAttestedAbsent: true,
  };
}

export function buildEvidenceRecord({
  context,
  invocations,
  markerPreflight,
  observation,
  pass,
  exactBytes,
  invocationCount,
}) {
  return {
    schema: "mariage-os.wp29c.ar006.adr0013-two-surface.v1",
    ...baseRecord(context, exactBytes, invocationCount),
    sha256: context.sha256,
    invocations,
    markerPreflight: sanitizedPreflight(markerPreflight),
    provider: sanitizedEvaluation(observation),
    pass,
  };
}

export function buildFailureEvidenceRecord({
  context,
  invocations,
  markerPreflight,
  observation,
  failureStage,
  exactBytes,
  invocationCount,
}) {
  return {
    schema: "mariage-os.wp29c.ar006.adr0013-two-surface-failure.v1",
    ...baseRecord(context, exactBytes, invocationCount),
    sha256: context.sha256 ?? null,
    completedInvocationCount: invocations.length,
    invocations,
    markerPreflight: sanitizedPreflight(markerPreflight),
    provider: sanitizedEvaluation(observation),
    failureStage,
    pass: false,
  };
}

export async function writeEvidence(record) {
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
  console.log(`ADR 0013 provider evidence written to ${EVIDENCE_PATH}.`);
}

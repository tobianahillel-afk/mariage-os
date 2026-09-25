import ciSource from "../../../.github/workflows/ci.yml?raw";
import flowSource from "../../../scripts/private-document-ar006-do-evidence-flow.mjs?raw";
import harnessSource from "../../../scripts/run-private-document-ar006-do-evidence.mjs?raw";
import recordSource from "../../../scripts/private-document-ar006-do-evidence-record.mjs?raw";
import routeSource from "../../../scripts/run-private-document-ar006-do-route-preflight.mjs?raw";
import readinessSource from "../../../scripts/private-document-ar006-do-route-readiness.mjs?raw";
import preMutationReceiptSource from "../../../scripts/write-private-document-ar006-do-pre-mutation-failure.mjs?raw";
import { describe, expect, it } from "vitest";

function evidenceJobSource(): string {
  const start = ciSource.indexOf("  ar006-provider-evidence:");
  if (start < 0) throw new Error("Evidence job must exist.");
  const end = ciSource.indexOf("\n  ar006-token-diagnostic:", start);
  if (end < 0) throw new Error("Evidence job boundary must exist.");
  return ciSource.slice(start, end);
}

describe("ADR 0012 failed-campaign receipt contract", () => {
  it("retains a sanitized pass-false receipt for bounded campaign failures", () => {
    expect(harnessSource).toContain("buildFailureEvidenceRecord");
    expect(harnessSource).toContain("failureStage");
    expect(recordSource).toContain(
      "mariage-os.wp29c.ar006.adr0012-two-surface-failure.v1",
    );
    expect(recordSource).toContain("completedInvocationCount");
    expect(recordSource).toContain("pass: false");
    expect(recordSource).toContain("buildPreMutationFailureEvidenceRecord");
    expect(preMutationReceiptSource).toContain(
      'failureStage: "route_preflight"',
    );
    expect(recordSource).not.toContain("error.message");
    expect(harnessSource).toContain("markerPreflightPassed");
    expect(harnessSource).toContain("return latest");
    expect(harnessSource).toContain(
      "state.markerPreflight = await verifyMarkerObservability",
    );
  });
});

describe("ADR 0012 two-surface marker preflight contract", () => {
  it("proves both marker surfaces before any exact-size mutation", () => {
    expect(harnessSource).toContain("verifyMarkerObservability");
    expect(harnessSource).toContain("probePrivateDocumentLifecycle");
    expect(routeSource).toContain("probePrivateDocumentLifecycle");
    expect(readinessSource).toContain("TRANSIENT_STATUSES");
    expect(harnessSource).toContain('"marker-preflight"');
    expect(harnessSource).toContain("expectedEvidenceIds: [evidenceId]");
    expect(harnessSource).toContain("await delay(20_000)");
    expect(recordSource).toContain("markerPreflight:");
  });
});

describe("ADR 0012 exact-size harness contract", () => {
  it("keeps the frozen exact-size and ten-flow evidence shape", () => {
    expect(harnessSource).toContain("const MAX_BYTES = 25_000_000");
    expect(harnessSource).toContain("AR006_EVIDENCE_COUNT");
    expect(harnessSource).toContain("createExactPdf(MAX_BYTES)");
    expect(harnessSource).toContain("evaluateAr006TwoSurfaceEvents");
    expect(harnessSource).toContain("queryAr006MarkerObservability");
    expect(harnessSource).toContain("queryWorkersObservability");
    expect(harnessSource).toContain("runAr006Promotions");
    expect(flowSource).toContain("invocations.push(await runPromotion");
  });

  it("requires each successful promotion to be verified ready before acceptance", () => {
    expect(flowSource).toContain('.select("upload_status")');
    expect(flowSource).toContain('verified.data?.upload_status !== "ready"');
    expect(flowSource).toContain("finalized = true");
  });

  it("binds evidence to Free plan and the exact provider deployment", () => {
    expect(harnessSource).toContain("YES-WORKERS-FREE-ISOLATED");
    expect(recordSource).toContain('requiredEnv("AR006_EXPECTED_SHA")');
    expect(recordSource).toContain('requiredEnv("AR006_DEPLOYMENT_ID")');
    expect(recordSource).toContain('requiredEnv("AR006_DEPLOYMENT_BRANCH")');
    expect(harnessSource).toContain(
      'requiredEnv("AR006_WORKER_DEPLOYMENT_ID")',
    );
    expect(harnessSource).toContain('requiredEnv("AR006_WORKER_VERSION_ID")');
    expect(harnessSource).toContain(
      "durableObjectVersionId: context.workerVersionId",
    );
    expect(recordSource).toContain("paidCpuEntitlementAttestedAbsent: true");
  });
});

describe("ADR 0012 provider evidence job gating", () => {
  it("runs only on an explicit reviewed same-branch push marker", () => {
    const job = evidenceJobSource();
    expect(job).toContain("- full-verify");
    expect(job).toContain("github.event_name == 'push'");
    expect(job).toContain("github.ref == 'refs/heads/lot-2/venues-core'");
    expect(job).toContain(
      "contains(github.event.head_commit.message, '[AR006-DO-EVIDENCE]')",
    );
    expect(job).toContain("environment: ar006-isolated");
    expect(job).not.toContain("if: ${{ false }}");
  });

  it("deploys the exact candidate without restoring the legacy Pages trust path", () => {
    const job = evidenceJobSource();
    expect(job).toContain("AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN");
    expect(job).toContain("/workers/scripts/$AR006_PRIVATE_DOCUMENT_WORKER");
    expect(job).toContain('"$WORKER_URL/deployments"');
    expect(job).toContain("/versions/$VERSION_ID");
    expect(job).toContain("PrivateDocumentLifecycle");
    expect(job).toContain("wrangler@4.131.2 deploy");
    expect(job).toContain('--tag "$WORKER_VERSION_TAG"');
    expect(job).toContain('--message "$WORKER_VERSION_MESSAGE"');
    expect(job).toContain('"$WORKER_URL/settings"');
    expect(job).toContain('annotations["workers/tag"]');
    expect(job).toContain('annotations["workers/message"]');
    expect(job).toContain("npm run preflight:ar006");
    expect(job).toContain("wrangler@4.131.2 pages deploy dist");
    expect(job).toContain('--commit-hash "$GITHUB_SHA"');
    expect(job).not.toContain("configure-ar006-pages-preview.mjs");
    expect(job).not.toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
  });
});

describe("ADR 0012 provider evidence job fail-closed capture", () => {
  it("smokes the exact route before mutation and uses dedicated secrets", () => {
    const job = evidenceJobSource();
    expect(job).toContain("smoke:private-document-production");
    expect(job).toContain("run-private-document-ar006-do-route-preflight.mjs");
    expect(job).toContain("id: route_preflight");
    expect(job).toContain("steps.route_preflight.outcome == 'failure'");
    expect(job).toContain(
      "write-private-document-ar006-do-pre-mutation-failure.mjs",
    );
    expect(job).toContain("AR006_TEST_USER_PASSWORD");
    expect(job).toContain("AR006_CLOUDFLARE_OBSERVABILITY_TOKEN");
    expect(job).toContain("run-private-document-ar006-do-evidence.mjs");
  });

  it("retains only the sanitized deployment/evidence files", () => {
    const job = evidenceJobSource();
    expect(job).toContain("ar006-do-worker-deployment.json");
    expect(job).toContain("ar006-do-evidence-deployment.json");
    expect(job).toContain("ar006-adr0012-two-surface-evidence.json");
    expect(job).toContain("if: always()");
    expect(job).not.toContain("AR006_CLOUDFLARE_ANALYTICS_TOKEN");
  });
});

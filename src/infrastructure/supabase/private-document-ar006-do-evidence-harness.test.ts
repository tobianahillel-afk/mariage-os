import ciSource from "../../../.github/workflows/ci.yml?raw";
import harnessSource from "../../../scripts/run-private-document-ar006-do-evidence.mjs?raw";
import { describe, expect, it } from "vitest";

function evidenceJobSource(): string {
  const start = ciSource.indexOf("  ar006-provider-evidence:");
  if (start < 0) throw new Error("Evidence job must exist.");
  const end = ciSource.indexOf("\n  ar006-token-diagnostic:", start);
  if (end < 0) throw new Error("Evidence job boundary must exist.");
  return ciSource.slice(start, end);
}

describe("ADR 0012 exact-size harness contract", () => {
  it("keeps the frozen exact-size and ten-flow evidence shape", () => {
    expect(harnessSource).toContain("const MAX_BYTES = 25_000_000");
    expect(harnessSource).toContain("AR006_EVIDENCE_COUNT");
    expect(harnessSource).toContain("createExactPdf(MAX_BYTES)");
    expect(harnessSource).toContain("evaluateAr006TwoSurfaceEvents");
    expect(harnessSource).toContain("queryAr006MarkerObservability");
    expect(harnessSource).toContain("queryWorkersObservability");
  });

  it("binds evidence to Free plan and the exact provider deployment", () => {
    expect(harnessSource).toContain("YES-WORKERS-FREE-ISOLATED");
    expect(harnessSource).toContain('requiredEnv("AR006_EXPECTED_SHA")');
    expect(harnessSource).toContain('requiredEnv("AR006_DEPLOYMENT_ID")');
    expect(harnessSource).toContain('requiredEnv("AR006_DEPLOYMENT_BRANCH")');
    expect(harnessSource).toContain('requiredEnv("AR006_WORKER_DEPLOYMENT_ID")');
    expect(harnessSource).toContain('requiredEnv("AR006_WORKER_VERSION_ID")');
    expect(harnessSource).toContain(
      "paidCpuEntitlementAttestedAbsent: true",
    );
  });
});

describe("ADR 0012 provider evidence job gating", () => {
  it("runs only after full verify and an explicit evidence marker", () => {
    const job = evidenceJobSource();
    expect(job).toContain("- full-verify");
    expect(job).toContain("[AR006-DO-EVIDENCE]");
    expect(job).toContain("environment: ar006-isolated");
    expect(job).not.toContain("if: ${{ false }}");
  });

  it("deploys the exact candidate without restoring the legacy Pages trust path", () => {
    const job = evidenceJobSource();
    expect(job).toContain("AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN");
    expect(job).toContain("/workers/scripts/$AR006_PRIVATE_DOCUMENT_WORKER/deployments");
    expect(job).toContain("/versions/$VERSION_ID");
    expect(job).toContain("PrivateDocumentLifecycle");
    expect(job).toContain("wrangler@4.131.2 deploy");
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

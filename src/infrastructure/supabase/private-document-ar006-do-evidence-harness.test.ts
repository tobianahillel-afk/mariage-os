import ciSource from "../../../.github/workflows/ci.yml?raw";
import flowSource from "../../../scripts/private-document-ar006-do-evidence-flow.mjs?raw";
import harnessSource from "../../../scripts/run-private-document-ar006-do-evidence.mjs?raw";
import preflightSource from "../../../scripts/run-private-document-ar006-ingress-observability-preflight.mjs?raw";
import recordSource from "../../../scripts/private-document-ar006-do-evidence-record.mjs?raw";
import { describe, expect, it } from "vitest";

function evidenceJobSource(): string {
  const start = ciSource.indexOf("  ar006-provider-evidence:");
  if (start < 0) throw new Error("Evidence job must exist.");
  const end = ciSource.indexOf("\n  ar006-token-diagnostic:", start);
  if (end < 0) throw new Error("Evidence job boundary must exist.");
  return ciSource.slice(start, end);
}

describe("ADR 0013 structured preflight contract", () => {
  it("proves persisted exact-script markers without document mutation", () => {
    expect(preflightSource).toContain("queryWorkersObservability");
    expect(preflightSource).toContain("documentMutation: false");
    expect(preflightSource).toContain("exactSizeMutation: false");
    expect(preflightSource).not.toContain("createExactPdf");
    expect(preflightSource).toContain("discoverAr006SurfaceScripts");
  });
});

describe("ADR 0013 exact-size harness contract", () => {
  it("keeps the exact 25 MB and ten-flow shape after marker preflight", () => {
    expect(harnessSource).toContain("const MAX_BYTES = 25_000_000");
    expect(harnessSource).toContain("AR006_EVIDENCE_COUNT");
    expect(harnessSource).toContain("markerPreflight");
    expect(harnessSource).toContain("createExactPdf(MAX_BYTES)");
    expect(harnessSource).toContain("runAr006Promotions");
    expect(harnessSource).toContain("evaluateAr006TwoSurfaceEvents");
    expect(harnessSource).not.toContain("queryAr006MarkerObservability");
    expect(flowSource).toContain("invocations.push(await runPromotion");
  });

  it("binds evidence to exact ingress and DO versions", () => {
    expect(harnessSource).toContain('requiredEnv("AR006_INGRESS_VERSION_ID")');
    expect(harnessSource).toContain('requiredEnv("AR006_WORKER_VERSION_ID")');
    expect(harnessSource).toContain(
      "ingressVersionId: context.ingressVersionId",
    );
    expect(harnessSource).toContain(
      "durableObjectVersionId: context.workerVersionId",
    );
    expect(recordSource).toContain("paidCpuEntitlementAttestedAbsent: true");
    expect(recordSource).toContain("adr0013-two-surface");
  });
});

describe("ADR 0013 provider evidence job", () => {
  it("is full-verify gated and no longer deploys Pages", () => {
    const job = evidenceJobSource();
    expect(job).toContain("- full-verify");
    expect(job).toContain("[AR006-INGRESS-PREFLIGHT]");
    expect(job).toContain("[AR006-INGRESS-EVIDENCE]");
    expect(job).toContain("mariage-os-ar006-ingress");
    expect(job).toContain("workers/private-document-ingress/wrangler.jsonc");
    expect(job).toContain("workers/private-document-promotion/wrangler.jsonc");
    expect(job).not.toContain("pages deploy");
    expect(job).not.toContain("AR006_CLOUDFLARE_DEPLOY_TOKEN");
  });

  it("keeps the public ingress unprivileged and retains sanitized evidence", () => {
    const job = evidenceJobSource();
    expect(job).toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
    expect(job).toContain("length == 0");
    expect(job).toContain("AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN");
    expect(job).toContain("AR006_CLOUDFLARE_OBSERVABILITY_TOKEN");
    expect(job).toContain("ar006-adr0013-two-surface-evidence.json");
    expect(job).toContain("if: always()");
  });
});

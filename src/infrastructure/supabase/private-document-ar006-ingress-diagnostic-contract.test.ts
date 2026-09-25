import ciSource from "../../../.github/workflows/ci.yml?raw";
import diagnosticSource from "../../../scripts/run-private-document-ar006-ingress-diagnostic-requery.mjs?raw";
import { describe, expect, it } from "vitest";

const FAILED_SOURCE_FIXTURE = "f7951e99eb31bcc63d9cbd93f67db80548340ed6";

function diagnosticJobSource(): string {
  const start = ciSource.indexOf("  ar006-ingress-diagnostic-requery:");
  const end = ciSource.indexOf("\n  ar006-provider-evidence:", start);
  if (start < 0 || end < 0) throw new Error("Diagnostic CI job is missing.");
  return ciSource.slice(start, end);
}

describe("ADR13-EV-001 diagnostic workflow scope", () => {
  it("is exact-head gated and receives only the Observability credential", () => {
    const source = diagnosticJobSource();
    expect(source).toContain("needs:\n      - full-verify");
    expect(source).toContain("[AR006-INGRESS-DIAGNOSTIC]");
    expect(source).toContain("environment: ar006-isolated");
    expect(source).toContain("AR006_CLOUDFLARE_OBSERVABILITY_TOKEN");
    expect(source).not.toContain("AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN");
    expect(source).not.toContain("AR006_TEST_USER_PASSWORD");
    expect(source).not.toContain("AR006_SUPABASE_URL");
  });

  it("uploads only the sanitized diagnostic receipt", () => {
    const source = diagnosticJobSource();
    expect(source).toContain("ar006-adr0013-diagnostic-requery.json");
    expect(source).not.toContain("wrangler");
    expect(source).not.toContain("smoke:private-document-production");
  });
});

describe("ADR13-EV-001 exact failed-window diagnostic source", () => {
  it("pins the failed identity, window and exact script versions", () => {
    expect(diagnosticSource).toContain(FAILED_SOURCE_FIXTURE);
    expect(diagnosticSource).toContain("a5848756-d76c-4848-9312-eab1b883a063");
    expect(diagnosticSource).toContain("2026-09-25T16:06:26.252Z");
    expect(diagnosticSource).toContain("2026-09-25T16:07:53.815Z");
    expect(diagnosticSource).toContain("8c48646c-c9a3-410b-98c4-b42a98e75244");
    expect(diagnosticSource).toContain("683829d6-abb8-4340-8bf1-2a5c78d527a1");
  });

  it("cannot deploy, authenticate to Supabase or create application traffic", () => {
    expect(diagnosticSource).toContain("queryWorkersObservability");
    expect(diagnosticSource).toContain("providerAcceptance: false");
    expect(diagnosticSource).toContain("documentMutation: false");
    expect(diagnosticSource).not.toContain("signInAr006SyntheticUser");
    expect(diagnosticSource).not.toContain("createExactPdf");
    expect(diagnosticSource).not.toContain("runAr006Promotions");
    expect(diagnosticSource).not.toContain("AR006_TEST_USER_PASSWORD");
    expect(diagnosticSource).not.toContain("CLOUDFLARE_API_TOKEN");
  });
});

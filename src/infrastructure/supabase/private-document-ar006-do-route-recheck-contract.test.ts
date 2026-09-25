import ciSource from "../../../.github/workflows/ci.yml?raw";
import { describe, expect, it } from "vitest";

function recheckJobSource(): string {
  const start = ciSource.indexOf("  ar006-do-route-recheck:");
  if (start < 0) throw new Error("Route recheck job must exist.");
  const end = ciSource.indexOf("\n  # [AR006-DO-EVIDENCE]", start);
  if (end < 0) throw new Error("Route recheck job boundary must exist.");
  return ciSource.slice(start, end);
}

describe("ADR 0012 exact-preview route recheck gate", () => {
  it("is marker-gated, exact-preview pinned and read-only", () => {
    const job = recheckJobSource();
    expect(job).toContain("- full-verify");
    expect(job).toContain("github.event_name == 'push'");
    expect(job).toContain("github.ref == 'refs/heads/lot-2/venues-core'");
    expect(job).toContain("[AR006-DO-ROUTE-RECHECK]");
    expect(job).toContain("6bdf445e7f56e38caa0d807232bcfde573103117");
    expect(job).toContain("environment: ar006-isolated");
    expect(job).toContain("npm run preflight:ar006");
    expect(job).toContain("smoke:private-document-production");
    expect(job).toContain("run-private-document-ar006-do-route-preflight.mjs");
  });

  it("cannot deploy, patch Pages or enter exact-size evidence work", () => {
    const job = recheckJobSource();
    expect(job).not.toContain("wrangler");
    expect(job).not.toContain("configure-ar006-pages-preview");
    expect(job).not.toContain("AR006_CLOUDFLARE_OBSERVABILITY_TOKEN");
    expect(job).not.toContain("run-private-document-ar006-do-evidence.mjs");
    expect(job).not.toContain("write-private-document-ar006-do-pre-mutation-failure");
    expect(job).not.toContain("AR006_EVIDENCE_COUNT");
    expect(job).not.toContain("25_000_000");
  });

  it("retains only a sanitized no-mutation deployment receipt", () => {
    const job = recheckJobSource();
    expect(job).toContain("mariage-os.wp29c.ar006.do-route-recheck.v1");
    expect(job).toContain("documentMutation:false");
    expect(job).toContain("ar006-do-route-recheck.json");
    expect(job).toContain("if-no-files-found: error");
  });
});

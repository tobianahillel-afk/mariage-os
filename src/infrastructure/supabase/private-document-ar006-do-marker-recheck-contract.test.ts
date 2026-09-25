import ciSource from "../../../.github/workflows/ci.yml?raw";
import runnerSource from "../../../scripts/run-private-document-ar006-do-marker-recheck.mjs?raw";
import { describe, expect, it } from "vitest";

function markerRecheckJobSource(): string {
  const start = ciSource.indexOf("  ar006-do-marker-recheck:");
  if (start < 0) throw new Error("Marker recheck job must exist.");
  const end = ciSource.indexOf("\n  # [AR006-DO-EVIDENCE]", start);
  if (end < 0) throw new Error("Marker recheck job boundary must exist.");
  return ciSource.slice(start, end);
}

describe("ADR 0012 marker-only Observability recheck gate", () => {
  it("is exact-deployment pinned, marker-gated and full-verify dependent", () => {
    const job = markerRecheckJobSource();
    expect(job).toContain("- full-verify");
    expect(job).toContain("github.event_name == 'push'");
    expect(job).toContain("github.ref == 'refs/heads/lot-2/venues-core'");
    expect(job).toContain("[AR006-DO-MARKER-RECHECK]");
    expect(job).toContain("e1d0bea0eeb9f11c9701f780d820273cd2547c28");
    expect(job).toContain("42369f98-a9e9-42d9-a3c3-f0f9dc53e68c");
    expect(job).toContain("1360d262-e135-47b7-b07d-75900fce29bc");
    expect(job).toContain("b07c06b5-2552-4f1e-ac89-f9b3ce623b5a");
  });

  it("cannot deploy, patch or execute exact-size document work", () => {
    const job = markerRecheckJobSource();
    expect(job).not.toContain("wrangler");
    expect(job).not.toContain("configure-ar006-pages-preview");
    expect(job).not.toContain("run-private-document-ar006-do-evidence.mjs");
    expect(job).not.toContain("25_000_000");
    expect(job).not.toContain("AR006_EVIDENCE_COUNT");
    expect(job).toContain("run-private-document-ar006-do-marker-recheck.mjs");
    expect(job).toContain("AR006_CLOUDFLARE_OBSERVABILITY_TOKEN");
  });

  it("retains sanitized metadata and declares no document mutation", () => {
    expect(runnerSource).toContain("documentMutation: false");
    expect(runnerSource).toContain("exactSizeMutation: false");
    expect(runnerSource).toContain("sanitizedQuery");
    expect(runnerSource).not.toContain("createExactPdf");
    expect(runnerSource).not.toContain("runAr006Promotions");
  });
});

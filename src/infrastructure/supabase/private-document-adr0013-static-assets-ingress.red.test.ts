import { describe, expect, it } from "vitest";
import ciSource from "../../../.github/workflows/ci.yml?raw";
import evidenceSource from "../../../functions/api/private-document-evidence.ts?raw";
import observabilitySource from "../../../scripts/private-document-ar006-observability-client.mjs?raw";

const ingressConfig = import.meta.glob(
  "../../../workers/private-document-ingress/wrangler.jsonc",
  { eager: true, import: "default", query: "?raw" },
);
const ingressWorker = import.meta.glob(
  "../../../workers/private-document-ingress/src/worker.ts",
  { eager: true, import: "default", query: "?raw" },
);

function providerEvidenceJob(): string {
  const start = ciSource.indexOf("  ar006-provider-evidence:");
  if (start < 0) throw new Error("Provider evidence job must exist.");
  return ciSource.slice(start);
}

describe("ADR 0013 Workers Static Assets ingress RED", () => {
  it("has a dedicated public Static Assets ingress Worker", () => {
    expect(Object.keys(ingressConfig)).toHaveLength(1);
    expect(Object.keys(ingressWorker)).toHaveLength(1);
  });

  it("emits native structured evidence logs", () => {
    expect(evidenceSource).toContain("console.log({");
    expect(evidenceSource).not.toContain("console.log(\n    JSON.stringify(");
  });

  it("does not hard-code marker discovery to $metadata.message", () => {
    expect(observabilitySource).not.toContain("function markerFilter()");
    expect(observabilitySource).not.toContain('key: "$metadata.message"');
    expect(observabilitySource).toContain("queryWorkersObservability");
  });

  it("migrates the isolated provider path away from Pages deploy", () => {
    const job = providerEvidenceJob();
    expect(job).toContain("[AR006-INGRESS-PREFLIGHT]");
    expect(job).toContain("mariage-os-ar006-ingress");
    expect(job).toContain("workers/private-document-ingress/wrangler.jsonc");
    expect(job).not.toContain("wrangler@4.131.2 pages deploy");
  });
});

import { describe, expect, it } from "vitest";
import ciSource from "../../../.github/workflows/ci.yml?raw";
import helperSource from "../../../scripts/private-document-ar006-durable-object.mjs?raw";
import ingressConfig from "../../../workers/private-document-ingress/wrangler.jsonc?raw";
import hostConfig from "../../../workers/private-document-promotion/wrangler.jsonc?raw";

describe("ADR 0012 host retained under ADR 0013 ingress", () => {
  it("retains the exact private SQLite Durable Object contract", () => {
    expect(helperSource).toContain(
      'LIFECYCLE_BINDING = "PRIVATE_DOCUMENT_LIFECYCLE"',
    );
    expect(helperSource).toContain(
      'LIFECYCLE_CLASS = "PrivateDocumentLifecycle"',
    );
    expect(hostConfig).toContain('"workers_dev": false');
    expect(hostConfig).toContain('"type": "durable-object"');
    expect(hostConfig).toContain('"storage": "sqlite"');
  });

  it("binds the public Static Assets ingress to the private host without admin secret", () => {
    expect(ingressConfig).toContain('"name": "PRIVATE_DOCUMENT_LIFECYCLE"');
    expect(ingressConfig).toContain('"class_name": "PrivateDocumentLifecycle"');
    expect(ingressConfig).toContain(
      '"script_name": "mariage-os-private-document-promotion"',
    );
    expect(ingressConfig).not.toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
  });

  it("gates the new provider path behind explicit ADR 0013 markers", () => {
    expect(ciSource).toContain("[AR006-INGRESS-PREFLIGHT]");
    expect(ciSource).toContain("[AR006-INGRESS-EVIDENCE]");
    expect(ciSource).toContain("needs:\n      - full-verify");
    expect(ciSource).not.toContain(
      "contains(github.event.head_commit.message, '[AR006-EVIDENCE]')",
    );
  });
});

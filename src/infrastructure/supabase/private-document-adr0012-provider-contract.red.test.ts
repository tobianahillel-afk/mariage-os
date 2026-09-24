import { describe, expect, it } from "vitest";
import ciSource from "../../../.github/workflows/ci.yml?raw";
import ciCdSource from "../../../docs/engineering/CI-CD.md?raw";
import secretSource from "../../../docs/security/SECRET-MANAGEMENT.md?raw";
import configureSource from "../../../scripts/configure-ar006-pages-preview.mjs?raw";
import helperSource from "../../../scripts/private-document-ar006-durable-object.mjs?raw";
import preflightSource from "../../../scripts/run-private-document-ar006-preflight.mjs?raw";

describe("ADR 0012 provider deployment contract", () => {
  it("centralizes the exact Durable Object binding and class contract", () => {
    expect(helperSource).toContain(
      'LIFECYCLE_BINDING = "PRIVATE_DOCUMENT_LIFECYCLE"',
    );
    expect(helperSource).toContain(
      'LIFECYCLE_CLASS = "PrivateDocumentLifecycle"',
    );
    expect(helperSource).toContain(
      'LEGACY_SERVICE_BINDING = "PRIVATE_DOCUMENT_PROMOTION_WORKER"',
    );
  });

  it("configures Pages with the Durable Object namespace and removes ADR 0011 bindings", () => {
    expect(configureSource).toContain("LIFECYCLE_BINDING");
    expect(configureSource).toContain("durable_object_namespaces");
    expect(configureSource).toContain("LIFECYCLE_CLASS");
    expect(configureSource).toContain("PRIVATE_DOCUMENT_ADMIN_KEY: null");
    expect(configureSource).not.toContain(
      'const BINDING_NAME = "PRIVATE_DOCUMENT_PROMOTION_WORKER"',
    );
  });

  it("preflights the exact Durable Object namespace rather than the old Service Binding", () => {
    expect(preflightSource).toContain("LIFECYCLE_BINDING");
    expect(preflightSource).toContain("LIFECYCLE_CLASS");
    expect(preflightSource).toContain("durable_object_namespaces");
    expect(preflightSource).not.toContain("requirePromotionWorkerBinding");
    expect(preflightSource).toContain("/secrets/PRIVATE_DOCUMENT_ADMIN_KEY");
  });

  it("gates provider mutation behind full verify and disables stale evidence", () => {
    expect(ciSource).toContain("[AR006-DO-PREFLIGHT]");
    expect(ciSource).toContain("[AR006-DO-EVIDENCE]");
    expect(ciSource).not.toContain(
      "contains(github.event.head_commit.message, '[AR006-EVIDENCE]')",
    );
    expect(ciSource).toContain("needs:\n      - full-verify");
  });

  it("documents Pages as unprivileged and the Worker/DO host as the admin-key runtime", () => {
    expect(ciCdSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(ciCdSource).not.toContain(
      "Pages encrypted `PRIVATE_DOCUMENT_ADMIN_KEY`",
    );
    expect(secretSource).toContain("Durable Object host");
    expect(secretSource).not.toContain(
      "a Cloudflare Pages encrypted secret and a separate private Worker encrypted secret",
    );
  });
});

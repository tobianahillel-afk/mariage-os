import { describe, expect, it } from "vitest";
import configureSource from "../../../scripts/configure-ar006-pages-preview.mjs?raw";
import preflightSource from "../../../scripts/run-private-document-ar006-preflight.mjs?raw";
import ciSource from "../../../.github/workflows/ci.yml?raw";
import ciCdSource from "../../../docs/engineering/CI-CD.md?raw";
import secretSource from "../../../docs/security/SECRET-MANAGEMENT.md?raw";

describe("ADR 0012 provider deployment contract RED", () => {
  it("configures Pages with the Durable Object namespace and removes ADR 0011 bindings", () => {
    expect(configureSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(configureSource).toContain("durable_object_namespaces");
    expect(configureSource).toContain("workers/durable_objects/namespaces");
    expect(configureSource).toContain("PrivateDocumentLifecycle");
    expect(configureSource).not.toContain(
      'const BINDING_NAME = "PRIVATE_DOCUMENT_PROMOTION_WORKER"',
    );
    expect(configureSource).toContain("PRIVATE_DOCUMENT_ADMIN_KEY: null");
  });

  it("preflights the exact Durable Object namespace rather than the old Service Binding", () => {
    expect(preflightSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(preflightSource).toContain("workers/durable_objects/namespaces");
    expect(preflightSource).toContain("PrivateDocumentLifecycle");
    expect(preflightSource).toContain("durable_object_namespaces");
    expect(preflightSource).not.toContain("requirePromotionWorkerBinding");
    expect(preflightSource).toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
  });

  it("disables the stale ADR 0011 exact-size evidence marker", () => {
    expect(ciSource).not.toContain("contains(github.event.head_commit.message, '[AR006-EVIDENCE]')");
    expect(ciSource).toContain("[AR006-DO-EVIDENCE]");
  });

  it("documents Pages as unprivileged and the Worker/DO host as the only admin-key runtime", () => {
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

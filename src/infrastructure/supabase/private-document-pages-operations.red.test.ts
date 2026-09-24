import adrSource from "../../../docs/adr/0012-private-document-lifecycle-durable-object.md?raw";
import ciCdSource from "../../../docs/engineering/CI-CD.md?raw";
import releaseSource from "../../../docs/engineering/RELEASE-PROCESS.md?raw";
import secretSource from "../../../docs/security/SECRET-MANAGEMENT.md?raw";
import { describe, expect, it } from "vitest";

const oldCredentialRejection = "verify the previous credential is rejected";

describe("WP-2.9C AR-007 operations", () => {
  it("aligns deployment contracts with ADR 0012", () => {
    expect(adrSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(ciCdSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(ciCdSource).toContain("/api/private-document-promote");
    expect(releaseSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(releaseSource).toContain("fail closed");
    expect(releaseSource).toContain("legacy Supabase promotion route");
  });

  it("records privileged secret lifecycle on the Durable Object host only", () => {
    expect(secretSource).toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
    expect(secretSource).toContain("Durable Object host");
    expect(secretSource).toContain("Supabase server/service credential");
    expect(secretSource).toContain(oldCredentialRejection);
    expect(secretSource).not.toContain(
      "a Cloudflare Pages encrypted secret and a separate private Worker encrypted secret",
    );
  });
});

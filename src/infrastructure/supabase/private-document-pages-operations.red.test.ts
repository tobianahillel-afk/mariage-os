import adrSource from "../../../docs/adr/0010-private-document-promotion-ingress-boundary.md?raw";
import ciCdSource from "../../../docs/engineering/CI-CD.md?raw";
import releaseSource from "../../../docs/engineering/RELEASE-PROCESS.md?raw";
import secretSource from "../../../docs/security/SECRET-MANAGEMENT.md?raw";
import { describe, expect, it } from "vitest";

describe("WP-2.9C AR-007 Pages deployment and secret operations", () => {
  it("keeps deployment contracts aligned with the trusted Pages boundary", () => {
    expect(adrSource).toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
    expect(ciCdSource).toContain("/api/private-document-promote");
    expect(ciCdSource).toContain("Pages Functions");
    expect(releaseSource).toContain("/api/private-document-promote");
    expect(releaseSource).toContain("fail closed");
    expect(releaseSource).toContain("legacy Supabase promotion route");
  });

  it(
    "records metadata-only lifecycle operations for the privileged Pages secret",
    () => {
      expect(secretSource).toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
      expect(secretSource).toContain("Cloudflare Pages encrypted secret");
      expect(secretSource).toContain("Supabase server/service credential");
      expect(secretSource).toContain(
        "verify the previous credential is rejected",
      );
    },
  );
});

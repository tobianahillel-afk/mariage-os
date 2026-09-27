import { describe, expect, it } from "vitest";
import adr from "../../../docs/adr/0013-workers-static-assets-private-document-ingress.md?raw";
import ci from "../../../docs/engineering/CI-CD.md?raw";
import release from "../../../docs/engineering/RELEASE-PROCESS.md?raw";
import versioning from "../../../docs/engineering/VERSIONING-UPDATE-DELIVERY.md?raw";
import freeTier from "../../../docs/operations/FREE-TIER.md?raw";
import secrets from "../../../docs/security/SECRET-MANAGEMENT.md?raw";
import releasePlan from "../../../docs/templates/RELEASE-PLAN.md?raw";
import packet from "../../../docs/roadmap/lot-2/WP-2.9C.md?raw";
import productionSmoke from "../../../scripts/run-private-document-production-smoke.mjs?raw";

describe("ADR 0013 production operations contract", () => {
  it("routes private-document releases through the approved Static Assets ingress", () => {
    expect(adr).toContain("Worker-first");
    expect(ci).toContain("Workers Static Assets ingress");
    expect(ci).toContain("Worker-first `/api/*`");
    expect(release).toContain("Workers Static Assets ingress");
    expect(release).toContain("Worker-first `/api/*`");
    expect(versioning).toContain("Workers Static Assets");
    expect(versioning).toContain(
      "private Durable Object host before the Workers Static Assets ingress",
    );
    expect(packet).toContain(
      "bodyless same-origin Workers Static Assets trusted action",
    );
    expect(packet).not.toContain(
      "The existing security boundary remains same-origin Cloudflare Pages.",
    );
    expect(ci).not.toContain("security-critical Pages Functions route");
    expect(release).not.toContain(
      "Private-document Pages Function release gate",
    );
  });

  it("keeps the private host secret and Free CPU evidence bound to both surfaces", () => {
    expect(secrets).toContain("Workers Static Assets ingress");
    expect(secrets).toContain("private Worker/Durable Object host");
    expect(freeTier).toContain("Workers Static Assets ingress");
    expect(freeTier).toContain("Durable Object");
    expect(freeTier).not.toContain(
      "Cloudflare Pages Free for static hosting plus the narrowly approved Pages Functions security boundary",
    );
    expect(releasePlan).toContain(
      "Private-document ingress Worker deployment ID",
    );
    expect(releasePlan).toContain(
      "Private-document Durable Object host deployment ID",
    );
  });

  it("denies unknown API paths and verifies that static content is available", () => {
    expect(productionSmoke).toContain("unknown API path");
    expect(productionSmoke).toContain("staticResponse.status !== 200");
  });
});

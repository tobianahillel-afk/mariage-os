import ciSource from "../../../.github/workflows/ci.yml?raw";
import flowSource from "../../../scripts/private-document-ar006-do-evidence-flow.mjs?raw";
import harnessSource from "../../../scripts/run-private-document-ar006-do-evidence.mjs?raw";
import preflightSource from "../../../scripts/run-private-document-ar006-ingress-observability-preflight.mjs?raw";
import recordSource from "../../../scripts/private-document-ar006-do-evidence-record.mjs?raw";
import { createHash } from "node:crypto";
import { createExactPdf } from "../../../scripts/private-document-ar006-synthetic-pdf.mjs";
import { runAr006Promotions } from "../../../scripts/private-document-ar006-do-evidence-flow.mjs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

function evidenceJobSource(): string {
  const start = ciSource.indexOf("  ar006-provider-evidence:");
  if (start < 0) throw new Error("Evidence job must exist.");
  const end = ciSource.indexOf("\n  ar006-token-diagnostic:", start);
  if (end < 0) throw new Error("Evidence job boundary must exist.");
  return ciSource.slice(start, end);
}

function capturedPromotionClient() {
  const captured = { reservedHash: "", stagedHash: "", stagedSize: 0 };
  const client = {
    rpc: vi.fn(
      async (
        _name: string,
        args: { target_action: string; target_sha256: string | null },
      ) => {
        if (args.target_action === "reserve_upload") {
          captured.reservedHash = args.target_sha256 ?? "";
        }
        return { error: null };
      },
    ),
    storage: {
      from: () => ({
        upload: vi.fn(async (_path: string, bytes: Uint8Array) => {
          captured.stagedHash = createHash("sha256")
            .update(bytes)
            .digest("hex");
          captured.stagedSize = bytes.byteLength;
          return { error: null };
        }),
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              error: null,
              data: { upload_status: "ready" },
            }),
          }),
        }),
      }),
    }),
  };
  return { client, captured };
}

async function expectPromotionReceiptMatchesStagedBytes() {
  const { client, captured } = capturedPromotionClient();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ ok: true })),
  );
  const invocations: Array<{
    sha256: string;
    sizeBytes: number;
    finalized: boolean;
  }> = [];
  await runAr006Promotions(
    {
      projectId: "11111111-1111-4111-8111-111111111111",
      deploymentUrl: "https://synthetic.workers.dev",
      exactBytes: 25_000_000,
    },
    { client, token: "synthetic-token" },
    invocations,
    1,
  );
  expect(invocations).toHaveLength(1);
  expect(invocations[0]).toMatchObject({
    sizeBytes: 25_000_000,
    finalized: true,
  });
  expect(invocations[0].sha256).toBe(captured.reservedHash);
  expect(invocations[0].sha256).toBe(captured.stagedHash);
  expect(captured.stagedSize).toBe(25_000_000);
}

describe("ADR 0013 structured preflight contract", () => {
  it("proves persisted exact-script markers without document mutation", () => {
    expect(preflightSource).toContain("queryWorkersObservability");
    expect(preflightSource).toContain("documentMutation: false");
    expect(preflightSource).toContain("exactSizeMutation: false");
    expect(preflightSource).not.toContain("createExactPdf");
    expect(preflightSource).toContain("discoverAr006SurfaceScripts");
  });
});

describe("ADR 0013 exact-size harness contract", () => {
  it("reserves and stages the same per-flow bytes recorded in the receipt", async () => {
    await expectPromotionReceiptMatchesStagedBytes();
  });

  it("constructs ten byte-distinct exact-size synthetic PDFs", () => {
    const hashes = new Set<string>();
    for (let index = 0; index < 10; index += 1) {
      const pdf = createExactPdf(25_000_000, index);
      expect(pdf.byteLength).toBe(25_000_000);
      expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
      hashes.add(createHash("sha256").update(pdf).digest("hex"));
    }
    expect(hashes.size).toBe(10);
  });

  it("keeps the exact 25 MB and ten-flow shape after marker preflight", () => {
    expect(harnessSource).toContain("const MAX_BYTES = 25_000_000");
    expect(harnessSource).toContain("AR006_EVIDENCE_COUNT");
    expect(harnessSource).toContain("markerPreflight");
    expect(harnessSource).toContain("exactBytes: MAX_BYTES");
    expect(flowSource).toContain("createExactPdf(context.exactBytes, index)");
    expect(flowSource).toContain("sha256Hex(bytes)");
    expect(recordSource).toContain("pdfSha256s: invocations.map");
    expect(harnessSource).toContain("runAr006Promotions");
    expect(harnessSource).toContain("evaluateAr006TwoSurfaceEvents");
    expect(harnessSource).not.toContain("queryAr006MarkerObservability");
    expect(flowSource).toContain("invocations.push(await runPromotion");
  });

  it("binds evidence to exact ingress and DO versions", () => {
    expect(harnessSource).toContain('requiredEnv("AR006_INGRESS_VERSION_ID")');
    expect(harnessSource).toContain('requiredEnv("AR006_WORKER_VERSION_ID")');
    expect(harnessSource).toContain(
      "ingressVersionId: context.ingressVersionId",
    );
    expect(harnessSource).toContain(
      "durableObjectVersionId: context.workerVersionId",
    );
    expect(recordSource).toContain("paidCpuEntitlementAttestedAbsent: true");
    expect(recordSource).toContain("adr0013-two-surface");
  });
});

describe("ADR 0013 provider evidence job", () => {
  it("is full-verify gated and no longer deploys Pages", () => {
    const job = evidenceJobSource();
    expect(job).toContain("- full-verify");
    expect(job).toContain("[AR006-INGRESS-PREFLIGHT]");
    expect(job).toContain("[AR006-INGRESS-EVIDENCE]");
    expect(job).toContain("mariage-os-ar006-ingress");
    expect(job).toContain("workers/private-document-ingress/wrangler.jsonc");
    expect(job).toContain("workers/private-document-promotion/wrangler.jsonc");
    expect(job).not.toContain("pages deploy");
    expect(job).not.toContain("AR006_CLOUDFLARE_DEPLOY_TOKEN");
  });

  it("keeps the public ingress unprivileged and retains sanitized evidence", () => {
    const job = evidenceJobSource();
    expect(job).toContain("PRIVATE_DOCUMENT_ADMIN_KEY");
    expect(job).toContain("length == 0");
    expect(job).toContain("AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN");
    expect(job).toContain("AR006_CLOUDFLARE_OBSERVABILITY_TOKEN");
    expect(job).toContain("ar006-adr0013-two-surface-evidence.json");
    expect(job).toContain("if: always()");
  });
});

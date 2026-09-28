import { describe, expect, it } from "vitest";
import supabaseConfig from "../../../supabase/config.toml?raw";
import workerConfig from "../../../workers/private-document-promotion/wrangler.jsonc?raw";
import ingressConfig from "../../../workers/private-document-ingress/wrangler.jsonc?raw";
import ingressSource from "../../../workers/private-document-ingress/src/worker.ts?raw";
import evidenceSource from "../../../functions/api/private-document-evidence.ts?raw";
import workerSource from "../../../workers/private-document-promotion/src/worker.ts?raw";

const pagesPromotionModules = import.meta.glob(
  "../../../functions/api/private-document-promote.ts",
  { eager: true, import: "default", query: "?raw" },
);
const supabasePromotionModules = import.meta.glob(
  "../../../supabase/functions/private-document-ingest/index.ts",
  { eager: true, import: "default", query: "?raw" },
);

describe("ADR 0013 promotion deployment boundary", () => {
  it("deploys the same-origin route through Workers Static Assets", () => {
    expect(ingressConfig).toContain('"main": "src/worker.ts"');
    expect(ingressConfig).toContain('"run_worker_first": ["/api/*"]');
    expect(ingressConfig).toContain(
      '"script_name": "mariage-os-private-document-promotion"',
    );
    expect(ingressSource).toContain(
      'PRIVATE_DOCUMENT_PATH = "/api/private-document-promote"',
    );
    expect(ingressSource).toContain(
      'handlePrivateDocumentIngress(request, environment, "worker-ingress")',
    );
    expect(ingressSource).toContain("return unavailable()");
    // The historical Pages route is retained for local regression, not as the release entry point.
    expect(Object.keys(pagesPromotionModules)).toHaveLength(1);
  });

  it("removes the deployable Supabase promotion Edge Function", () => {
    expect(Object.keys(supabasePromotionModules)).toHaveLength(0);
  });

  it("removes the Supabase promotion function configuration", () => {
    expect(supabaseConfig).not.toContain("[functions.private-document-ingest]");
    expect(supabaseConfig).not.toContain(
      "./functions/private-document-ingest/index.ts",
    );
  });

  it("hosts the trusted lifecycle in a private observed Durable Object", () => {
    expect(workerConfig).toContain('"workers_dev": false');
    expect(workerConfig).toContain('"enabled": true');
    expect(workerConfig).toContain('"invocation_logs": true');
    expect(workerConfig).toContain('"head_sampling_rate": 1');
    expect(workerConfig).toContain('"PrivateDocumentLifecycle"');
    expect(workerConfig).toContain('"type": "durable-object"');
    expect(workerConfig).toContain('"storage": "sqlite"');
    expect(workerSource).toContain("handleTrustedPromotion");
    expect(workerSource).toContain("handleTrustedAbandon");
    expect(workerSource).toContain("PrivateDocumentLifecycleSerialGate");
    expect(workerSource).toContain("recordAr006Evidence");
    expect(workerSource).toContain('"durable-object"');
    expect(evidenceSource).toContain('"x-mariage-os-ar006-evidence-id"');
    expect(evidenceSource).toContain('"mariage-os.ar006.promotion"');
  });
});

import { describe, expect, it } from "vitest";
import supabaseConfig from "../../../supabase/config.toml?raw";
import workerConfig from "../../../workers/private-document-promotion/wrangler.jsonc?raw";
import workerSource from "../../../workers/private-document-promotion/src/worker.ts?raw";
import preflightSource from "../../../scripts/run-private-document-ar006-preflight.mjs?raw";

const pagesPromotionModules = import.meta.glob(
  "../../../functions/api/private-document-promote.ts",
  { eager: true, import: "default", query: "?raw" },
);
const supabasePromotionModules = import.meta.glob(
  "../../../supabase/functions/private-document-ingest/index.ts",
  { eager: true, import: "default", query: "?raw" },
);

describe("ADR 0010/0011 promotion deployment boundary", () => {
  it("provides the same-origin Cloudflare Pages Function", () => {
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

  it("delegates trusted promotion work to an internal observed Worker", () => {
    expect(workerConfig).toContain('"workers_dev": false');
    expect(workerConfig).toContain('"enabled": true');
    expect(workerConfig).toContain('"invocation_logs": true');
    expect(workerConfig).toContain('"head_sampling_rate": 1');
    expect(workerSource).toContain("handleTrustedPromotion");
    expect(workerSource).toContain('"x-mariage-os-ar006-evidence-id"');
    expect(workerSource).toContain('"mariage-os.ar006.promotion"');
    expect(workerSource).toContain("UUID_PATTERN.test(value)");
    expect(preflightSource).toContain("requirePromotionWorkerBinding");
    expect(preflightSource).toContain("PRIVATE_DOCUMENT_PROMOTION_WORKER");
  });
});

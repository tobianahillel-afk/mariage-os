import { describe, expect, it } from "vitest";
import supabaseConfig from "../../../supabase/config.toml?raw";

const pagesPromotionModules = import.meta.glob(
  "../../../functions/api/private-document-promote.ts",
  { eager: true, import: "default", query: "?raw" },
);
const supabasePromotionModules = import.meta.glob(
  "../../../supabase/functions/private-document-ingest/index.ts",
  { eager: true, import: "default", query: "?raw" },
);

describe("ADR 0010 promotion deployment boundary", () => {
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
});

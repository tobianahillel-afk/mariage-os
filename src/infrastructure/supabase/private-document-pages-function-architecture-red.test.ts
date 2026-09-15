import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const pagesFunctionPath = resolve(
  repositoryRoot,
  "functions/api/private-document-promote.ts",
);
const supabaseFunctionPath = resolve(
  repositoryRoot,
  "supabase/functions/private-document-ingest/index.ts",
);
const supabaseConfigPath = resolve(repositoryRoot, "supabase/config.toml");

describe("ADR 0010 promotion deployment boundary", () => {
  it("provides the same-origin Cloudflare Pages Function", () => {
    expect(existsSync(pagesFunctionPath)).toBe(true);
  });

  it("removes the deployable Supabase promotion Edge Function", () => {
    expect(existsSync(supabaseFunctionPath)).toBe(false);
  });

  it("removes the Supabase promotion function configuration", () => {
    const config = readFileSync(supabaseConfigPath, "utf8");
    expect(config).not.toContain("[functions.private-document-ingest]");
    expect(config).not.toContain("./functions/private-document-ingest/index.ts");
  });
});

import { describe, expect, it } from "vitest";
import {
  cloudflareFailureSummary,
  pagesPreviewMutation,
} from "../../../scripts/private-document-ar006-pages-config.mjs";

describe("ADR 0012 Pages Preview mutation", () => {
  it("sends only the intended binding and environment changes", () => {
    expect(
      pagesPreviewMutation(
        {
          supabaseUrl: "https://synthetic.supabase.co",
          publishableKey: "synthetic-publishable",
        },
        "synthetic-namespace",
      ),
    ).toEqual({
      env_vars: {
        PRIVATE_DOCUMENT_ADMIN_KEY: null,
        SUPABASE_URL: {
          type: "plain_text",
          value: "https://synthetic.supabase.co",
        },
        SUPABASE_PUBLISHABLE_KEY: {
          type: "plain_text",
          value: "synthetic-publishable",
        },
      },
      services: {
        PRIVATE_DOCUMENT_PROMOTION_WORKER: null,
      },
      durable_object_namespaces: {
        PRIVATE_DOCUMENT_LIFECYCLE: {
          namespace_id: "synthetic-namespace",
        },
      },
    });
  });

  it("does not replay unrelated or provider-managed Preview config", () => {
    const patch = pagesPreviewMutation(
      {
        supabaseUrl: "https://synthetic.supabase.co",
        publishableKey: "synthetic-publishable",
      },
      "synthetic-namespace",
    );
    expect(Object.keys(patch).sort()).toEqual([
      "durable_object_namespaces",
      "env_vars",
      "services",
    ]);
    expect(patch).not.toHaveProperty("fail_open");
    expect(patch).not.toHaveProperty("wrangler_config_hash");
    expect(patch).not.toHaveProperty("compatibility_date");
  });
});

describe("Cloudflare failure summary", () => {
  it("keeps only bounded provider codes and safe field pointers", () => {
    expect(
      cloudflareFailureSummary(400, {
        errors: [
          {
            code: 8000111,
            message: "must-not-be-retained secret-value",
            source: { pointer: "/deployment_configs/preview/services" },
          },
        ],
      }),
    ).toBe(
      "status=400 codes=8000111 fields=/deployment_configs/preview/services",
    );
  });

  it("does not echo provider messages or unsafe source values", () => {
    const summary = cloudflareFailureSummary(500, {
      errors: [
        {
          code: "safe-code",
          message: "Bearer should-never-appear",
          source: { pointer: "unsafe pointer with spaces and token=value" },
        },
      ],
    });
    expect(summary).toBe("status=500 codes=safe-code");
    expect(summary).not.toContain("Bearer");
    expect(summary).not.toContain("token=value");
  });
});

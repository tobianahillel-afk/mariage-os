import edgeSource from "../../../supabase/functions/private-document-ingest/index.ts?raw";
import { describe, expect, it } from "vitest";

describe("WP-2.9C AR-001 bounded Edge request body RED", () => {
  it("bounds actual received bytes while streaming before body buffering", () => {
    expect(edgeSource).not.toContain("request.arrayBuffer()");
    expect(edgeSource).toContain("request.body");
    expect(edgeSource).toContain("getReader()");
    expect(edgeSource).toContain("totalBytes > MAX_BYTES");
  });
});

import edgeSource from "../../../supabase/functions/private-document-ingest/index.ts?raw";
import { describe, expect, it } from "vitest";

describe("WP-2.9C ADR-0009 bodyless Edge promotion boundary", () => {
  it("rejects framed bodies without consuming untrusted request bytes", () => {
    expect(edgeSource).not.toContain("request.arrayBuffer()");
    expect(edgeSource).not.toContain("getReader()");
    expect(edgeSource).toContain("requestHasBodyFrame");
    expect(edgeSource).toContain('request.headers.get("transfer-encoding")');
    expect(edgeSource).toContain('request.headers.get("content-length")');
    expect(edgeSource).toContain("request.body !== null");
  });
});

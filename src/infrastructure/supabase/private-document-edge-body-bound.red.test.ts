import promotionSource from "../../../functions/api/private-document-promote.ts?raw";
import { describe, expect, it } from "vitest";

describe("WP-2.9C ADR-0009 bodyless Pages promotion boundary", () => {
  it("rejects framed bodies without consuming untrusted request bytes", () => {
    expect(promotionSource).not.toContain("request.arrayBuffer()");
    expect(promotionSource).not.toContain("getReader()");
    expect(promotionSource).toContain("requestHasBodyFrame");
    expect(promotionSource).toContain(
      'request.headers.get("transfer-encoding")',
    );
    expect(promotionSource).toContain('request.headers.get("content-length")');
    expect(promotionSource).toContain("return request.body !== null;");
  });
});

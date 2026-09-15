import promotionSource from "../../../functions/api/private-document-promote.ts?raw";
import requestSource from "../../../functions/api/private-document-request.ts?raw";
import { describe, expect, it } from "vitest";

describe("WP-2.9C ADR-0009 bodyless Pages promotion boundary", () => {
  it("rejects framed bodies without consuming untrusted request bytes", () => {
    expect(promotionSource).not.toContain("request.arrayBuffer()");
    expect(promotionSource).not.toContain("getReader()");
    expect(requestSource).not.toContain("request.arrayBuffer()");
    expect(requestSource).not.toContain("getReader()");
    expect(promotionSource).toContain("requestHasBodyFrame");
    expect(requestSource).toContain(
      'request.headers.get("transfer-encoding")',
    );
    expect(requestSource).toContain('request.headers.get("content-length")');
    expect(requestSource).toContain("return request.body !== null;");
  });
});

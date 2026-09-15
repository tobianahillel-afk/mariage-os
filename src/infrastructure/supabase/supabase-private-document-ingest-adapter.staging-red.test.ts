import { afterEach, describe, expect, it, vi } from "vitest";
import { SupabasePrivateDocumentIngestAdapter } from "./supabase-private-document-ingest-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ADR 0010 Pages Function promotion transport", () => {
  it("uploads exact staging bytes then promotes through same-origin bodyless POST", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: { path },
      error: null,
    });
    const from = vi.fn(() => ({ upload }));
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true },
      error: null,
    });
    const promotionResponse = Response.json(
      { ok: true, replayed: false },
      { status: 200 },
    );
    const fetchPromotion = vi.fn().mockResolvedValue(promotionResponse);
    vi.stubGlobal("fetch", fetchPromotion);

    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      { storage: { from } },
    );

    await adapter.ingest({
      projectId,
      documentId,
      bytes,
      mimeType: "application/pdf",
    });

    expect(from).toHaveBeenCalledOnce();
    expect(from).toHaveBeenCalledWith("document-ingest-staging");
    expect(upload).toHaveBeenCalledWith(path, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

    expect(invoke).not.toHaveBeenCalled();
    expect(fetchPromotion).toHaveBeenCalledOnce();
    const [url, options] = fetchPromotion.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/private-document-promote");
    expect(options.method).toBe("POST");
    expect(options.body).toBeUndefined();
    expect(options.headers).toMatchObject({
      "x-project-id": projectId,
      "x-document-id": documentId,
    });
  });
});

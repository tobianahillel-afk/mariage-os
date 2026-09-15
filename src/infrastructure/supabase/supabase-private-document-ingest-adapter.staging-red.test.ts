import { describe, expect, it, vi } from "vitest";
import { SupabasePrivateDocumentIngestAdapter } from "./supabase-private-document-ingest-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

describe("ADR 0009 bounded staging transport", () => {
  it("uploads exact bytes to bounded staging and invokes bodyless promotion", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: { path },
      error: null,
    });
    const from = vi.fn(() => ({ upload }));
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true },
      error: null,
    });
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
    expect(upload).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledWith(path, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

    expect(invoke).toHaveBeenCalledOnce();
    const [functionName, options] = invoke.mock.calls[0] as [
      string,
      { body?: unknown; headers: Record<string, string> },
    ];
    expect(functionName).toBe("private-document-ingest");
    expect(options.body).toBeUndefined();
    expect(options.headers).toEqual({
      "x-project-id": projectId,
      "x-document-id": documentId,
    });
  });
});

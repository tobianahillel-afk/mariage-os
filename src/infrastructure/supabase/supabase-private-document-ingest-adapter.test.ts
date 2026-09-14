import { describe, expect, it, vi } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import { SupabasePrivateDocumentIngestAdapter } from "./supabase-private-document-ingest-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

function input() {
  return {
    projectId,
    documentId,
    bytes,
    mimeType: "application/pdf" as const,
  };
}

function persistenceCode(value: unknown) {
  return value instanceof DocumentPersistenceError ? value.code : null;
}

describe("SupabasePrivateDocumentIngestAdapter", () => {
  it("sends raw exact bytes and identifiers without caller-controlled storage authority", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true },
      error: null,
      response: { status: 200 },
    });
    const adapter = new SupabasePrivateDocumentIngestAdapter({ invoke });

    await expect(adapter.ingest(input())).resolves.toBeUndefined();

    expect(invoke).toHaveBeenCalledOnce();
    const [functionName, options] = invoke.mock.calls[0] as [
      string,
      { body: ArrayBuffer; headers: Record<string, string> },
    ];
    expect(functionName).toBe("private-document-ingest");
    expect(new Uint8Array(options.body)).toEqual(bytes);
    expect(options.headers).toEqual({
      "x-project-id": projectId,
      "x-document-id": documentId,
      "x-document-mime-type": "application/pdf",
    });
    expect(options.headers).not.toHaveProperty("x-storage-path");
    expect(options.headers).not.toHaveProperty("x-user-id");
    expect(options.headers).not.toHaveProperty("x-sha256");
    expect(options.headers).not.toHaveProperty("content-type");
  });

  it("fails closed on malformed successful provider data", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: false },
      error: null,
      response: { status: 200 },
    });
    const adapter = new SupabasePrivateDocumentIngestAdapter({ invoke });

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "provider_response_invalid",
    );
  });

  it("maps server and transport failures to retryable storage failure", async () => {
    const serverInvoke = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("server unavailable"),
      response: { status: 503 },
    });
    const transportInvoke = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      new SupabasePrivateDocumentIngestAdapter({ invoke: serverInvoke }).ingest(
        input(),
      ),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
    await expect(
      new SupabasePrivateDocumentIngestAdapter({
        invoke: transportInvoke,
      }).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });

  it("maps authenticated 4xx denial to a non-disclosing persistence failure", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("denied"),
      response: { status: 403 },
    });
    const adapter = new SupabasePrivateDocumentIngestAdapter({ invoke });

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "persistence_failed",
    );
  });
});

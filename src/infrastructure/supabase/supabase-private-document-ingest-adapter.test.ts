import { describe, expect, it, vi } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import { SupabasePrivateDocumentIngestAdapter } from "./supabase-private-document-ingest-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const path = `${projectId}/documents/${documentId}/original`;
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

function functionError(message: string, status: number) {
  return Object.assign(new Error(message), { context: { status } });
}

function storageError(message: string, statusCode: number | string) {
  return Object.assign(new Error(message), { statusCode });
}

function successfulStaging() {
  const upload = vi.fn().mockResolvedValue({
    data: { path },
    error: null,
  });
  const from = vi.fn(() => ({ upload }));
  return { upload, from, client: { storage: { from } } };
}

describe("SupabasePrivateDocumentIngestAdapter staging contract", () => {
  it("stages exact bytes and promotes only identifiers", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true },
      error: null,
    });
    const staging = successfulStaging();
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      staging.client,
    );

    await expect(adapter.ingest(input())).resolves.toBeUndefined();

    expect(staging.from).toHaveBeenCalledWith("document-ingest-staging");
    expect(staging.upload).toHaveBeenCalledWith(path, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
    expect(invoke).toHaveBeenCalledWith("private-document-ingest", {
      headers: {
        "x-project-id": projectId,
        "x-document-id": documentId,
      },
    });
  });

  it("rejects malformed staging success before promotion", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: { path: `${path}-wrong` },
      error: null,
    });
    const invoke = vi.fn();
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      { storage: { from: () => ({ upload }) } },
    );

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) =>
        persistenceCode(error) === "provider_response_invalid",
    );
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("SupabasePrivateDocumentIngestAdapter staging retry", () => {
  it("forwards a conflict for trusted revalidation", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: storageError("already exists", "409"),
    });
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true },
      error: null,
    });
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      { storage: { from: () => ({ upload }) } },
    );

    await expect(adapter.ingest(input())).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledOnce();
  });
});

describe("SupabasePrivateDocumentIngestAdapter response contract", () => {
  it("fails closed on malformed promotion data", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: false },
      error: null,
    });
    const staging = successfulStaging();
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      staging.client,
    );

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) =>
        persistenceCode(error) === "provider_response_invalid",
    );
  });
});

describe("SupabasePrivateDocumentIngestAdapter staging failures", () => {
  it("maps staging transport failure to retryable", async () => {
    const upload = vi.fn().mockRejectedValue(new Error("network down"));
    const invoke = vi.fn();
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      { storage: { from: () => ({ upload }) } },
    );

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it("maps staging server failure to retryable", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: storageError("storage unavailable", 503),
    });
    const invoke = vi.fn();
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      { storage: { from: () => ({ upload }) } },
    );

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("SupabasePrivateDocumentIngestAdapter promotion failures", () => {
  it("maps promotion server failure to retryable", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: functionError("server unavailable", 503),
    });
    const staging = successfulStaging();

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        { invoke },
        staging.client,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });

  it("maps promotion transport failure to retryable", async () => {
    const invoke = vi.fn().mockRejectedValue(new Error("network down"));
    const staging = successfulStaging();

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        { invoke },
        staging.client,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });
});

describe("SupabasePrivateDocumentIngestAdapter malformed errors", () => {
  it("treats malformed promotion errors as retryable", async () => {
    const errors = [
      "raw provider failure",
      new Error("unknown function failure"),
      { context: null },
      { context: { status: "503" } },
    ];

    for (const error of errors) {
      const invoke = vi.fn().mockResolvedValue({ data: null, error });
      const staging = successfulStaging();
      await expect(
        new SupabasePrivateDocumentIngestAdapter(
          { invoke },
          staging.client,
        ).ingest(input()),
      ).rejects.toSatisfy(
        (failure: unknown) => persistenceCode(failure) === "storage_retryable",
      );
    }
  });
});

describe("SupabasePrivateDocumentIngestAdapter non-retryable failures", () => {
  it("maps staging 4xx denial to persistence failure", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: storageError("denied", 403),
    });
    const invoke = vi.fn();
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      { storage: { from: () => ({ upload }) } },
    );

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "persistence_failed",
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it("maps promotion 4xx denial to persistence failure", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: functionError("denied", 403),
    });
    const staging = successfulStaging();
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      { invoke },
      staging.client,
    );

    await expect(adapter.ingest(input())).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "persistence_failed",
    );
  });
});

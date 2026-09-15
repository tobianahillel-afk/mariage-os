import { describe, expect, it, vi } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import { SupabasePrivateDocumentIngestAdapter } from "./supabase-private-document-ingest-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const token = "synthetic-access-token";

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

function storageError(message: string, statusCode: number | string) {
  return Object.assign(new Error(message), { statusCode });
}

function clientWith(
  upload: ReturnType<typeof vi.fn>,
  sessionResult: unknown = {
    data: { session: { access_token: token } },
    error: null,
  },
) {
  const from = vi.fn(() => ({ upload }));
  const getSession = vi.fn().mockResolvedValue(sessionResult);
  return { from, getSession, client: { storage: { from }, auth: { getSession } } };
}

function successfulClient() {
  const upload = vi.fn().mockResolvedValue({ data: { path }, error: null });
  return { upload, ...clientWith(upload) };
}

function promotionResponse(status = 200, body: unknown = { ok: true }) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("SupabasePrivateDocumentIngestAdapter staging contract", () => {
  it("stages exact bytes and promotes only identifiers with the current JWT", async () => {
    const staging = successfulClient();
    const promotionFetch = vi.fn().mockResolvedValue(promotionResponse());
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      staging.client,
      promotionFetch,
    );

    await expect(adapter.ingest(input())).resolves.toBeUndefined();

    expect(staging.from).toHaveBeenCalledWith("document-ingest-staging");
    expect(staging.upload).toHaveBeenCalledWith(path, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
    expect(staging.getSession).toHaveBeenCalledOnce();
    expect(promotionFetch).toHaveBeenCalledWith(
      "/api/private-document-promote",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          authorization: `Bearer ${token}`,
          "x-project-id": projectId,
          "x-document-id": documentId,
        },
      },
    );
  });

  it("rejects malformed staging success before promotion", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: { path: `${path}-wrong` },
      error: null,
    });
    const staging = clientWith(upload);
    const promotionFetch = vi.fn();

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        staging.client,
        promotionFetch,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) =>
        persistenceCode(error) === "provider_response_invalid",
    );
    expect(promotionFetch).not.toHaveBeenCalled();
  });
});

describe("SupabasePrivateDocumentIngestAdapter staging retry", () => {
  it("forwards a 409 conflict for trusted revalidation", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: storageError("already exists", "409"),
    });
    const staging = clientWith(upload);
    const promotionFetch = vi.fn().mockResolvedValue(promotionResponse());

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        staging.client,
        promotionFetch,
      ).ingest(input()),
    ).resolves.toBeUndefined();
    expect(promotionFetch).toHaveBeenCalledOnce();
  });
});

describe("SupabasePrivateDocumentIngestAdapter staging failures", () => {
  it("maps staging transport failure to retryable", async () => {
    const upload = vi.fn().mockRejectedValue(new Error("network down"));
    const staging = clientWith(upload);
    const promotionFetch = vi.fn();

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        staging.client,
        promotionFetch,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
    expect(promotionFetch).not.toHaveBeenCalled();
  });

  it("maps staging server failure to retryable", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: storageError("storage unavailable", 503),
    });
    const staging = clientWith(upload);

    await expect(
      new SupabasePrivateDocumentIngestAdapter(staging.client).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });

  it("maps staging 4xx denial to persistence failure", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: storageError("denied", 403),
    });
    const staging = clientWith(upload);

    await expect(
      new SupabasePrivateDocumentIngestAdapter(staging.client).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "persistence_failed",
    );
  });

  it("treats malformed staging status as retryable", async () => {
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: { statusCode: "invalid" },
    });
    const staging = clientWith(upload);

    await expect(
      new SupabasePrivateDocumentIngestAdapter(staging.client).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });
});

describe("SupabasePrivateDocumentIngestAdapter session boundary", () => {
  it("maps session lookup transport failure to retryable", async () => {
    const staging = successfulClient();
    staging.getSession.mockRejectedValue(new Error("session store unavailable"));

    await expect(
      new SupabasePrivateDocumentIngestAdapter(staging.client).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });

  it("fails closed when no authenticated session exists", async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path }, error: null });
    const staging = clientWith(upload, {
      data: { session: null },
      error: null,
    });
    const promotionFetch = vi.fn();

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        staging.client,
        promotionFetch,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "persistence_failed",
    );
    expect(promotionFetch).not.toHaveBeenCalled();
  });

  it("fails closed on provider session error or malformed token", async () => {
    for (const sessionResult of [
      { data: { session: { access_token: token } }, error: new Error("bad") },
      { data: { session: { access_token: "" } }, error: null },
      { data: { session: { access_token: 42 } }, error: null },
    ]) {
      const upload = vi.fn().mockResolvedValue({ data: { path }, error: null });
      const staging = clientWith(upload, sessionResult);
      await expect(
        new SupabasePrivateDocumentIngestAdapter(staging.client).ingest(input()),
      ).rejects.toSatisfy(
        (error: unknown) => persistenceCode(error) === "persistence_failed",
      );
    }
  });
});

describe("SupabasePrivateDocumentIngestAdapter promotion failures", () => {
  it("maps promotion server failure to retryable", async () => {
    const staging = successfulClient();
    const promotionFetch = vi.fn().mockResolvedValue(promotionResponse(503));

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        staging.client,
        promotionFetch,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });

  it("maps promotion 4xx denial to persistence failure", async () => {
    const staging = successfulClient();
    const promotionFetch = vi.fn().mockResolvedValue(promotionResponse(403));

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        staging.client,
        promotionFetch,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "persistence_failed",
    );
  });

  it("maps promotion transport failure to retryable", async () => {
    const staging = successfulClient();
    const promotionFetch = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      new SupabasePrivateDocumentIngestAdapter(
        staging.client,
        promotionFetch,
      ).ingest(input()),
    ).rejects.toSatisfy(
      (error: unknown) => persistenceCode(error) === "storage_retryable",
    );
  });

  it("fails closed on malformed or negative promotion receipts", async () => {
    const invalidResponses = [
      new Response("not json", { status: 200 }),
      promotionResponse(200, { ok: false }),
      promotionResponse(200, null),
    ];

    for (const response of invalidResponses) {
      const staging = successfulClient();
      const promotionFetch = vi.fn().mockResolvedValue(response);
      await expect(
        new SupabasePrivateDocumentIngestAdapter(
          staging.client,
          promotionFetch,
        ).ingest(input()),
      ).rejects.toSatisfy(
        (error: unknown) =>
          persistenceCode(error) === "provider_response_invalid",
      );
    }
  });
});

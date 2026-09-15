import { describe, expect, it, vi } from "vitest";
import {
  SupabasePrivateDocumentIngestAdapter,
  type SupabasePrivateDocumentStagingClientLike,
} from "./supabase-private-document-ingest-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const token = "synthetic-access-token";

function stagingClient(): {
  readonly client: SupabasePrivateDocumentStagingClientLike;
  readonly from: ReturnType<typeof vi.fn>;
  readonly upload: ReturnType<typeof vi.fn>;
  readonly getSession: ReturnType<typeof vi.fn>;
} {
  const upload = vi.fn();
  const from = vi.fn(() => ({ upload }));
  const getSession = vi.fn(async () => ({
    data: { session: { access_token: token } },
    error: null,
  }));
  return {
    client: {
      storage: { from },
      auth: { getSession },
    },
    from,
    upload,
    getSession,
  };
}

describe("SupabasePrivateDocumentIngestAdapter trusted abandon", () => {
  it("uses the bodyless trusted boundary instead of client Storage deletion", async () => {
    const { client, from, upload, getSession } = stagingClient();
    const promotionFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, absent: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      client,
      promotionFetch,
    );

    await expect(
      adapter.abandon({ operationId, projectId, documentId }),
    ).resolves.toBeUndefined();

    expect(from).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(getSession).toHaveBeenCalledOnce();
    expect(promotionFetch).toHaveBeenCalledWith(
      "/api/private-document-promote",
      {
        method: "DELETE",
        cache: "no-store",
        headers: {
          authorization: `Bearer ${token}`,
          "x-project-id": projectId,
          "x-document-id": documentId,
          "x-operation-id": operationId,
        },
      },
    );
  });

  it("fails closed when the trusted abandon receipt does not prove absence", async () => {
    const { client } = stagingClient();
    const promotionFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, absent: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const adapter = new SupabasePrivateDocumentIngestAdapter(
      client,
      promotionFetch,
    );

    await expect(
      adapter.abandon({ operationId, projectId, documentId }),
    ).rejects.toMatchObject({
      name: "DocumentPersistenceError",
      code: "provider_response_invalid",
      message: "Trusted private document abandon returned an invalid response.",
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { probePrivateDocumentLifecycle } from "../../../scripts/private-document-ar006-do-route-readiness.mjs";

const routeUrl = "https://synthetic.pages.dev/api/private-document-promote";

function unavailable(status = 409) {
  return Response.json({ error: "private_document_unavailable" }, { status });
}

function baseInput(
  fetcher: typeof fetch,
  waiter = vi.fn(async () => undefined),
) {
  return {
    routeUrl,
    token: "synthetic-token",
    projectId: "11111111-1111-4111-8111-111111111111",
    documentId: "22222222-2222-4222-8222-222222222222",
    maxAttempts: 4,
    delayMs: 1,
    fetcher,
    waiter,
  };
}

describe("ADR 0012 lifecycle route readiness", () => {
  it("retries bounded 404/503 before exact 409", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(unavailable());
    const waiter = vi.fn(async () => undefined);

    await expect(
      probePrivateDocumentLifecycle(baseInput(fetcher, waiter)),
    ).resolves.toEqual({ attempts: 3, statuses: [404, 503, 409] });
    expect(waiter).toHaveBeenCalledTimes(2);
  });

  it("fails immediately on authorization-shaped responses", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(unavailable(401));
    const waiter = vi.fn(async () => undefined);

    await expect(
      probePrivateDocumentLifecycle(baseInput(fetcher, waiter)),
    ).rejects.toThrow("statuses [401]");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(waiter).not.toHaveBeenCalled();
  });
});

describe("ADR 0012 lifecycle route readiness fail-closed", () => {
  it("fails after the bounded readiness window", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("unavailable", { status: 503 }));
    const waiter = vi.fn(async () => undefined);

    await expect(
      probePrivateDocumentLifecycle({
        ...baseInput(fetcher, waiter),
        maxAttempts: 3,
      }),
    ).rejects.toThrow("statuses [503,503,503]");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(waiter).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed 409 payloads", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ error: "different" }, { status: 409 }),
      );

    await expect(
      probePrivateDocumentLifecycle(baseInput(fetcher)),
    ).rejects.toThrow("unexpected response shape");
  });
});

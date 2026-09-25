import { describe, expect, it, vi } from "vitest";
import ingress from "../../../workers/private-document-ingress/src/worker";

function request(path: string, method = "GET"): Request {
  return new Request(`https://ingress.example${path}`, { method });
}

describe("ADR 0013 public Worker ingress", () => {
  it("fails unknown API paths closed instead of falling through to assets", async () => {
    const response = await ingress.fetch(request("/api/unknown"), {});
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "private_document_unavailable",
    });
  });

  it("fails the lifecycle route closed when its DO binding is absent", async () => {
    const response = await ingress.fetch(
      request("/api/private-document-promote", "POST"),
      {},
    );
    expect(response.status).toBe(400);
  });

  it("invokes only the server-derived lifecycle binding after validation", async () => {
    const fetch = vi.fn(async () => Response.json({ ok: true }, { status: 200 }));
    const get = vi.fn(() => ({ fetch }));
    const idFromName = vi.fn(() => "synthetic-id");
    const response = await ingress.fetch(
      new Request("https://ingress.example/api/private-document-promote", {
        method: "POST",
        headers: {
          authorization: "Bearer synthetic",
          origin: "https://ingress.example",
          "x-project-id": "00000000-0000-4000-8000-000000000001",
          "x-document-id": "00000000-0000-4000-8000-000000000002",
          "content-length": "0",
        },
      }),
      { PRIVATE_DOCUMENT_LIFECYCLE: { idFromName, get } },
    );
    expect(response.status).toBe(200);
    expect(idFromName).toHaveBeenCalledWith(
      "private-document:00000000-0000-4000-8000-000000000001:00000000-0000-4000-8000-000000000002",
    );
    expect(get).toHaveBeenCalledWith("synthetic-id");
    expect(fetch).toHaveBeenCalledOnce();
  });
});

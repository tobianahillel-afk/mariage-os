import { describe, expect, it, vi } from "vitest";
import {
  assertDenied,
  assertEventuallyDenied,
} from "../../../scripts/private-document-production-smoke.mjs";

const routeUrl = new URL(
  "https://synthetic.pages.dev/api/private-document-promote",
);

function denied(status: number) {
  return Response.json(
    { error: "private_document_unavailable" },
    { status },
  );
}

describe("private-document Pages readiness smoke", () => {
  it("retries only transient 404 until the exact deny route is ready", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(denied(405));
    const waiter = vi.fn(async () => undefined);

    await expect(
      assertEventuallyDenied({
        routeUrl,
        label: "unsupported method",
        expectedStatus: 405,
        init: { method: "GET" },
        maxAttempts: 4,
        delayMs: 1,
        fetcher,
        waiter,
      }),
    ).resolves.toBe(3);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(waiter).toHaveBeenCalledTimes(2);
  });

  it("fails closed when transient 404 never clears", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response("not found", { status: 404 }),
    );
    const waiter = vi.fn(async () => undefined);

    await expect(
      assertEventuallyDenied({
        routeUrl,
        label: "unsupported method",
        expectedStatus: 405,
        maxAttempts: 3,
        delayMs: 1,
        fetcher,
        waiter,
      }),
    ).rejects.toThrow("expected HTTP 405, received 404");

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(waiter).toHaveBeenCalledTimes(2);
  });
});

describe("private-document Pages smoke fail-closed behavior", () => {
  it("does not retry an unexpected non-404 response", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response("<html>fallback</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    const waiter = vi.fn(async () => undefined);

    await expect(
      assertEventuallyDenied({
        routeUrl,
        label: "unsupported method",
        expectedStatus: 405,
        fetcher,
        waiter,
      }),
    ).rejects.toThrow("expected HTTP 405, received 200");

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(waiter).not.toHaveBeenCalled();
  });

  it("still requires JSON and the generic unavailable payload", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response("method not allowed", {
        status: 405,
        headers: { "content-type": "text/plain" },
      }),
    );

    await expect(
      assertDenied({
        routeUrl,
        label: "unsupported method",
        expectedStatus: 405,
        fetcher,
      }),
    ).rejects.toThrow("route resolved to non-JSON content/fallback");
  });
});

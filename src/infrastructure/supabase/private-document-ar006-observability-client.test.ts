import { afterEach, describe, expect, it, vi } from "vitest";
import {
  queryWorkersObservability,
  verifyObservabilityAccountToken,
  verifyObservabilityUserToken,
} from "../../../scripts/private-document-ar006-observability-client.mjs";

const accountId = "e33a5fde02b4ecbc0a36f4ad47ad0597";
const token = "synthetic-test-token";

afterEach(() => vi.unstubAllGlobals());

describe("AR-006 Cloudflare account token precheck", () => {
  it("recognizes an active account token without retaining its value or id", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        success: true,
        errors: [],
        result: { id: "opaque-provider-token-id", status: "active" },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const result = await verifyObservabilityAccountToken({ accountId, token });

    expect(fetch).toHaveBeenCalledWith(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    expect(result).toEqual({
      httpStatus: 200,
      apiSuccess: true,
      tokenActive: true,
      providerErrorCodes: [],
    });
  });

  it("fails closed on a provider authentication rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { success: false, errors: [{ code: 10000 }] },
          { status: 401 },
        ),
      ),
    );

    expect(await verifyObservabilityAccountToken({ accountId, token })).toEqual(
      {
        httpStatus: 401,
        apiSuccess: false,
        tokenActive: false,
        providerErrorCodes: [10000],
      },
    );
  });
});

describe("AR-006 Cloudflare user token precheck", () => {
  it("recognizes an active user token at the documented user endpoint", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        success: true,
        errors: [],
        result: { id: "opaque-provider-token-id", status: "active" },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const result = await verifyObservabilityUserToken({ token });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/user/tokens/verify",
      { headers: { authorization: `Bearer ${token}` } },
    );
    expect(result).toEqual({
      httpStatus: 200,
      apiSuccess: true,
      tokenActive: true,
      providerErrorCodes: [],
    });
  });

  it("retains only sanitized status on user-token rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { success: false, errors: [{ code: 1000, message: "sensitive" }] },
          { status: 401 },
        ),
      ),
    );

    expect(await verifyObservabilityUserToken({ token })).toEqual({
      httpStatus: 401,
      apiSuccess: false,
      tokenActive: false,
      providerErrorCodes: [1000],
    });
  });
});

describe("AR-006 Observability pagination", () => {
  it("reports a complete event page", async () => {
    let requestBody: string | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        requestBody = typeof init?.body === "string" ? init.body : null;
        return Response.json({
          success: true,
          errors: [],
          result: {
            events: {
              count: 1,
              events: [{ $metadata: { id: "event-1" } }],
            },
          },
        });
      }),
    );

    const result = await queryWorkersObservability({
      accountId,
      workerName: "mariage-os-private-document-promotion",
      token,
      timeframe: { from: 1, to: 2 },
      queryId: "synthetic-query",
    });

    const body = requestBody === null ? null : JSON.parse(requestBody);
    expect(body?.limit).toBe(2_000);
    expect(result.totalEventCount).toBe(1);
    expect(result.eventPageComplete).toBe(true);
  });
});

describe("AR-006 Observability pagination fail closed", () => {
  it("fails closed when the provider omits the total event count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          errors: [],
          result: {
            events: {
              events: [{ $metadata: { id: "event-1" } }],
            },
          },
        }),
      ),
    );

    const result = await queryWorkersObservability({
      accountId,
      workerName: "mariage-os-private-document-promotion",
      token,
      timeframe: { from: 1, to: 2 },
      queryId: "synthetic-missing-count-query",
    });

    expect(result.totalEventCount).toBeNull();
    expect(result.eventPageComplete).toBe(false);
  });

  it("rejects a truncated event page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          errors: [],
          result: {
            events: {
              count: 2,
              events: [{ $metadata: { id: "event-1" } }],
            },
          },
        }),
      ),
    );

    const result = await queryWorkersObservability({
      accountId,
      workerName: "mariage-os-private-document-promotion",
      token,
      timeframe: { from: 1, to: 2 },
      queryId: "synthetic-truncated-query",
    });

    expect(result.totalEventCount).toBe(2);
    expect(result.eventPageComplete).toBe(false);
  });
});

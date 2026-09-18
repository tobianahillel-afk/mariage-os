import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyObservabilityAccountToken } from "../../../scripts/private-document-ar006-observability-client.mjs";

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

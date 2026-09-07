import { describe, expect, it } from "vitest";
import { normalizeFactFreshness } from "./fact-freshness";

describe("fact freshness normalization", () => {
  it("keeps unknown freshness explicit without deriving a status", () => {
    expect(
      normalizeFactFreshness({ lastVerifiedAt: null, staleAt: null }),
    ).toEqual({
      ok: true,
      value: { lastVerifiedAt: null, staleAt: null },
    });
  });

  it("normalizes explicit verification and stale timestamps", () => {
    expect(
      normalizeFactFreshness({
        lastVerifiedAt: "2026-09-07T10:00:00+02:00",
        staleAt: "2026-10-07T10:00:00+02:00",
      }),
    ).toEqual({
      ok: true,
      value: {
        lastVerifiedAt: "2026-09-07T08:00:00.000Z",
        staleAt: "2026-10-07T08:00:00.000Z",
      },
    });
  });

  it("allows an explicit verification timestamp without inventing staleAt", () => {
    expect(
      normalizeFactFreshness({
        lastVerifiedAt: "2026-09-07T08:00:00Z",
        staleAt: null,
      }),
    ).toEqual({
      ok: true,
      value: {
        lastVerifiedAt: "2026-09-07T08:00:00.000Z",
        staleAt: null,
      },
    });
  });

  it("rejects malformed timestamps", () => {
    expect(
      normalizeFactFreshness({ lastVerifiedAt: "today", staleAt: null }),
    ).toEqual({ ok: false, error: "invalid_last_verified_at" });
    expect(
      normalizeFactFreshness({
        lastVerifiedAt: "2026-09-07T08:00:00Z",
        staleAt: "next month",
      }),
    ).toEqual({ ok: false, error: "invalid_stale_at" });
  });

  it("rejects stale timestamps without or before verification", () => {
    expect(
      normalizeFactFreshness({
        lastVerifiedAt: null,
        staleAt: "2026-10-07T08:00:00Z",
      }),
    ).toEqual({ ok: false, error: "stale_without_last_verified_at" });
    expect(
      normalizeFactFreshness({
        lastVerifiedAt: "2026-10-07T08:00:00Z",
        staleAt: "2026-09-07T08:00:00Z",
      }),
    ).toEqual({ ok: false, error: "stale_before_last_verified_at" });
  });
});

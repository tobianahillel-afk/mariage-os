import { describe, expect, it } from "vitest";
import {
  isMediaUuid,
  isVenueMediaCategory,
  normalizeVenueRemoteMediaDraft,
} from "./venue-remote-media";

describe("venue remote media domain contract", () => {
  it("accepts exactly the frozen categories", () => {
    for (const category of [
      "exterior",
      "interior_empty",
      "interior_decorated",
      "view",
      "ceremony",
      "kitchen",
      "toilets",
      "parking",
      "accommodation",
      "floorplan",
      "own_visit",
      "other",
    ]) {
      expect(isVenueMediaCategory(category)).toBe(true);
    }
    expect(isVenueMediaCategory("hero")).toBe(false);
  });

  it("normalizes canonical remote metadata without private URL decoration", () => {
    expect(
      normalizeVenueRemoteMediaDraft({
        category: "exterior",
        remoteUrl: "  https://EXAMPLE.com/photo.jpg  ",
        sourcePageUrl: "http://example.com/venue",
        caption: "  Exterior view  ",
      }),
    ).toEqual({
      ok: true,
      value: {
        category: "exterior",
        remoteUrl: "https://example.com/photo.jpg",
        sourcePageUrl: "http://example.com/venue",
        caption: "Exterior view",
      },
    });
  });

  it.each([
    "http://example.com/photo.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "file:///tmp/photo.jpg",
    "https://user:pass@example.com/photo.jpg",
    "https://localhost/photo.jpg",
    "https://router.local/photo.jpg",
    "https://10.0.0.1/photo.jpg",
    "https://127.0.0.1/photo.jpg",
    "https://169.254.1.1/photo.jpg",
    "https://172.16.1.1/photo.jpg",
    "https://192.168.1.1/photo.jpg",
    "https://[::1]/photo.jpg",
    "https://[fc00::1]/photo.jpg",
    "https://[fe80::1]/photo.jpg",
    "https://intranet/photo.jpg",
  ])("rejects unsafe remote URL %s", (remoteUrl) => {
    expect(
      normalizeVenueRemoteMediaDraft({
        category: null,
        remoteUrl,
        sourcePageUrl: null,
        caption: null,
      }),
    ).toEqual({ ok: false, error: "invalid_remote_url" });
  });

  it("enforces Unicode scalar limits and rejects malformed surrogate input", () => {
    const prefix = "https://example.com/";
    expect(
      normalizeVenueRemoteMediaDraft({
        category: null,
        remoteUrl: prefix + "a".repeat(2_048 - prefix.length),
        sourcePageUrl: null,
        caption: "😀".repeat(5_000),
      }),
    ).toMatchObject({ ok: true });
    expect(
      normalizeVenueRemoteMediaDraft({
        category: null,
        remoteUrl: prefix + "a".repeat(2_049 - prefix.length),
        sourcePageUrl: null,
        caption: null,
      }),
    ).toEqual({ ok: false, error: "invalid_remote_url" });
    expect(
      normalizeVenueRemoteMediaDraft({
        category: null,
        remoteUrl: "https://example.com/photo.jpg",
        sourcePageUrl: null,
        caption: "\ud800",
      }),
    ).toEqual({ ok: false, error: "invalid_caption" });
  });

  it("normalizes empty optional fields to null and validates identities", () => {
    expect(
      normalizeVenueRemoteMediaDraft({
        category: undefined,
        remoteUrl: "https://example.com/photo.jpg",
        sourcePageUrl: undefined,
        caption: "   ",
      }),
    ).toEqual({
      ok: true,
      value: {
        category: null,
        remoteUrl: "https://example.com/photo.jpg",
        sourcePageUrl: null,
        caption: null,
      },
    });
    expect(isMediaUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isMediaUuid("not-a-uuid")).toBe(false);
  });
});

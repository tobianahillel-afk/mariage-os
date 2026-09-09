import { expect, it } from "vitest";
import {
  isVenueMediaCategory,
  normalizeVenueRemoteMediaDraft,
} from "./venue-remote-media";

function normalize(
  remoteUrl: unknown,
  sourcePageUrl: unknown = null,
  category: unknown = null,
  caption: unknown = null,
) {
  return normalizeVenueRemoteMediaDraft({
    category,
    remoteUrl,
    sourcePageUrl,
    caption,
  });
}

it.each([
  "not-a-url",
  " ",
  "https://0.1.1.1/photo.jpg",
  "https://100.64.0.1/photo.jpg",
  "https://[::]/photo.jpg",
  "https://[fd00::1]/photo.jpg",
  "https://[::ffff:192.168.1.1]/photo.jpg",
  "https://bad_host.example.com/photo.jpg",
  "https://xn--bcher-kva.example/photo.jpg",
  "https://example.123/photo.jpg",
])("rejects additional non-public remote URL form %s", (remoteUrl) => {
  expect(normalize(remoteUrl)).toEqual({
    ok: false,
    error: "invalid_remote_url",
  });
});

it.each([
  "https://8.8.8.8/photo.jpg",
  "https://[2001:4860:4860::8888]/photo.jpg",
])("accepts public IP remote URL %s", (remoteUrl) => {
  expect(normalize(remoteUrl)).toMatchObject({ ok: true });
});

it("covers source-navigation host and protocol boundaries", () => {
  expect(
    normalize("https://example.com/photo.jpg", "http://intranet/source"),
  ).toMatchObject({ ok: true });
  expect(
    normalize("https://example.com/photo.jpg", "ftp://example.com/source"),
  ).toEqual({ ok: false, error: "invalid_source_page_url" });
  expect(
    normalize("https://example.com/photo.jpg", "http://8.8.8.8/source"),
  ).toEqual({ ok: false, error: "invalid_source_page_url" });
});

it("rejects non-string and invalid optional metadata", () => {
  expect(normalize(42)).toEqual({ ok: false, error: "invalid_remote_url" });
  expect(normalize("https://example.com/photo.jpg", null, "hero")).toEqual({
    ok: false,
    error: "invalid_category",
  });
  expect(normalize("https://example.com/photo.jpg", null, null, 42)).toEqual({
    ok: false,
    error: "invalid_caption",
  });
  expect(isVenueMediaCategory(null)).toBe(false);
});

it("rejects malformed low surrogate and canonical URL expansion overflow", () => {
  expect(
    normalize("https://example.com/photo.jpg", null, null, "\udc00"),
  ).toEqual({ ok: false, error: "invalid_caption" });
  expect(normalize(`https://example.com/${"é".repeat(400)}`)).toEqual({
    ok: false,
    error: "invalid_remote_url",
  });
});

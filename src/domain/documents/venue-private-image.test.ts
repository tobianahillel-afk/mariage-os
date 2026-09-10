import { describe, expect, it } from "vitest";
import { validateVenuePrivateImage } from "./venue-private-image";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const webpWrongTag = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x4e, 0x4f, 0x50, 0x45,
]);

function candidate(
  originalFilename: string,
  bytes: Uint8Array,
  widthPx = 1,
  heightPx = 1,
) {
  return { originalFilename, bytes, widthPx, heightPx };
}

describe("Venue private image validation", () => {
  it.each([
    ["photo.JPG", jpeg, "image/jpeg"],
    ["photo.jpeg", jpeg, "image/jpeg"],
    ["plan.PnG", png, "image/png"],
    ["visit.WeBp", webp, "image/webp"],
  ] as const)(
    "accepts supported extension/signature pairs and preserves %s",
    (originalFilename, bytes, mimeType) => {
      expect(
        validateVenuePrivateImage(candidate(originalFilename, bytes)),
      ).toEqual({
        ok: true,
        value: {
          originalFilename,
          mimeType,
          sizeBytes: bytes.byteLength,
          widthPx: 1,
          heightPx: 1,
        },
      });
    },
  );

  it.each([
    ["photo.gif", jpeg],
    ["photo.jpg", png],
    ["photo.png", webp],
    ["photo.webp", jpeg],
    ["photo.webp", webpWrongTag],
    ["photo", jpeg],
  ] as const)("rejects unsupported or renamed content: %s", (name, bytes) => {
    expect(validateVenuePrivateImage(candidate(name, bytes))).toEqual({
      ok: false,
      error: "unsupported_type",
    });
  });

  it("enforces exact byte-size boundaries", () => {
    expect(
      validateVenuePrivateImage(candidate("empty.jpg", new Uint8Array())),
    ).toEqual({ ok: false, error: "invalid_size" });

    const atLimit = new Uint8Array(20_000_000);
    atLimit.set([0xff, 0xd8, 0xff]);
    expect(validateVenuePrivateImage(candidate("limit.jpg", atLimit)).ok).toBe(
      true,
    );

    const aboveLimit = new Uint8Array(20_000_001);
    aboveLimit.set([0xff, 0xd8, 0xff]);
    expect(
      validateVenuePrivateImage(candidate("large.jpg", aboveLimit)),
    ).toEqual({
      ok: false,
      error: "invalid_size",
    });
  });

  it.each([
    [1.5, 1],
    [1, 1.5],
    [0, 1],
    [1, 0],
    [16_385, 1],
    [1, 16_385],
    [10_000, 5_001],
  ])("rejects unsafe decoded dimensions %i x %i", (widthPx, heightPx) => {
    expect(
      validateVenuePrivateImage(
        candidate("photo.jpg", jpeg, widthPx, heightPx),
      ),
    ).toEqual({ ok: false, error: "invalid_dimensions" });
  });

  it("accepts the exact decoded dimension and pixel ceilings", () => {
    expect(
      validateVenuePrivateImage(candidate("photo.jpg", jpeg, 16_384, 1)),
    ).toMatchObject({ ok: true });
    expect(
      validateVenuePrivateImage(candidate("photo.jpg", jpeg, 10_000, 5_000)),
    ).toMatchObject({ ok: true });
  });

  it.each([
    "",
    "bad\u0000.jpg",
    "bad\u001f.jpg",
    `bad\ud800.jpg`,
    `bad\udc00.jpg`,
    `${"a".repeat(509)}.jpg`,
  ])("rejects unsafe private display filename", (originalFilename) => {
    expect(
      validateVenuePrivateImage(candidate(originalFilename, jpeg)),
    ).toEqual({
      ok: false,
      error: "invalid_filename",
    });
  });

  it("counts Unicode scalar values rather than UTF-16 code units", () => {
    const filename = `${"😀".repeat(508)}.jpg`;
    expect(validateVenuePrivateImage(candidate(filename, jpeg))).toMatchObject({
      ok: true,
    });
  });
});

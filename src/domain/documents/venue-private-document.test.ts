import { describe, expect, it } from "vitest";
import {
  isPrivateDocumentSha256,
  validateVenuePrivatePdf,
} from "./venue-private-document";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

function candidate(
  originalFilename: string,
  bytes: Uint8Array = pdf,
  declaredMimeType: unknown = "application/pdf",
) {
  return { originalFilename, bytes, declaredMimeType };
}

describe("Venue private PDF type and size validation", () => {
  it("accepts a case-insensitive .pdf filename with exact PDF MIME/signature", () => {
    expect(validateVenuePrivatePdf(candidate("Venue_Contract.PDF"))).toEqual({
      ok: true,
      value: {
        originalFilename: "Venue_Contract.PDF",
        mimeType: "application/pdf",
        sizeBytes: pdf.byteLength,
      },
    });
  });

  it.each([
    candidate("renamed.pdf", new Uint8Array([0x50, 0x4e, 0x47])),
    candidate("document.txt"),
    candidate("document.pdf", pdf, "application/octet-stream"),
  ])("rejects renamed, unsupported or MIME-substituted input", (input) => {
    expect(validateVenuePrivatePdf(input)).toEqual({
      ok: false,
      error: "unsupported_type",
    });
  });

  it("enforces exact byte-size boundaries", () => {
    expect(
      validateVenuePrivatePdf(candidate("empty.pdf", new Uint8Array())),
    ).toEqual({
      ok: false,
      error: "invalid_size",
    });

    const atLimit = new Uint8Array(25_000_000);
    atLimit.set(pdf.slice(0, 5));
    expect(validateVenuePrivatePdf(candidate("limit.pdf", atLimit)).ok).toBe(
      true,
    );

    const aboveLimit = new Uint8Array(25_000_001);
    aboveLimit.set(pdf.slice(0, 5));
    expect(validateVenuePrivatePdf(candidate("large.pdf", aboveLimit))).toEqual(
      {
        ok: false,
        error: "invalid_size",
      },
    );
  });
});

describe("Venue private PDF filename validation", () => {
  it.each([
    "",
    "../contract.pdf",
    "folder/contract.pdf",
    "folder\\contract.pdf",
    "bad\u0000.pdf",
    "bad\u001f.pdf",
    "bad\u007f.pdf",
    `bad\ud800.pdf`,
    `bad\udc00.pdf`,
    `${"a".repeat(509)}.pdf`,
  ])("rejects unsafe private filename metadata: %s", (originalFilename) => {
    expect(validateVenuePrivatePdf(candidate(originalFilename))).toEqual({
      ok: false,
      error: "invalid_filename",
    });
  });

  it("counts Unicode scalar values rather than UTF-16 code units", () => {
    expect(
      validateVenuePrivatePdf(candidate(`${"😀".repeat(508)}.pdf`)),
    ).toMatchObject({ ok: true });
  });
});

describe("private document SHA-256 receipt validation", () => {
  it("accepts only exact lowercase SHA-256 hex", () => {
    expect(isPrivateDocumentSha256("a".repeat(64))).toBe(true);
    expect(isPrivateDocumentSha256("A".repeat(64))).toBe(false);
    expect(isPrivateDocumentSha256("a".repeat(63))).toBe(false);
    expect(isPrivateDocumentSha256(`${"a".repeat(63)}g`)).toBe(false);
  });
});

const MAX_PRIVATE_PDF_BYTES = 25_000_000;
const MAX_PRIVATE_PDF_FILENAME_SCALARS = 512;

type VenuePrivatePdfMimeType = "application/pdf";

export interface VenuePrivatePdfCandidate {
  readonly originalFilename: string;
  readonly declaredMimeType: unknown;
  readonly bytes: Uint8Array;
}

export interface ValidatedVenuePrivatePdf {
  readonly originalFilename: string;
  readonly mimeType: VenuePrivatePdfMimeType;
  readonly sizeBytes: number;
}

export type VenuePrivatePdfValidationError =
  "invalid_filename" | "invalid_size" | "unsupported_type";

export type VenuePrivatePdfValidationResult =
  | { readonly ok: true; readonly value: ValidatedVenuePrivatePdf }
  | { readonly ok: false; readonly error: VenuePrivatePdfValidationError };

function unicodeScalarWidth(value: string, index: number): 0 | 1 | 2 {
  const codeUnit = value.charCodeAt(index);
  if (codeUnit < 0xd800 || codeUnit > 0xdfff) return 1;
  if (codeUnit > 0xdbff) return 0;
  const nextCodeUnit = value.charCodeAt(index + 1);
  return nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff ? 2 : 0;
}

function hasSafeUnicodeScalars(value: string, maxScalars: number): boolean {
  let scalars = 0;
  let index = 0;
  while (index < value.length) {
    const width = unicodeScalarWidth(value, index);
    if (width === 0) return false;
    const codeUnit = value.charCodeAt(index);
    if (codeUnit <= 0x1f || (codeUnit >= 0x7f && codeUnit <= 0x9f)) return false;
    index += width;
    scalars += 1;
    if (scalars > maxScalars) return false;
  }
  return scalars > 0;
}

export function isSafePrivateDocumentBoundedText(
  value: unknown,
  maxScalars: number,
): value is string {
  if (typeof value !== "string") return false;
  if (value.trim() !== value) return false;
  return hasSafeUnicodeScalars(value, maxScalars);
}

export function isSafePrivateDocumentFilename(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!hasSafeUnicodeScalars(value, MAX_PRIVATE_PDF_FILENAME_SCALARS)) {
    return false;
  }
  return !value.includes("/") && !value.includes("\\");
}

function hasPdfSignature(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export function isPrivateDocumentSha256(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

export function validateVenuePrivatePdf(
  candidate: VenuePrivatePdfCandidate,
): VenuePrivatePdfValidationResult {
  if (!isSafePrivateDocumentFilename(candidate.originalFilename)) {
    return { ok: false, error: "invalid_filename" };
  }
  if (
    candidate.bytes.byteLength < 1 ||
    candidate.bytes.byteLength > MAX_PRIVATE_PDF_BYTES
  ) {
    return { ok: false, error: "invalid_size" };
  }
  if (
    !candidate.originalFilename.toLowerCase().endsWith(".pdf") ||
    candidate.declaredMimeType !== "application/pdf" ||
    !hasPdfSignature(candidate.bytes)
  ) {
    return { ok: false, error: "unsupported_type" };
  }
  return {
    ok: true,
    value: {
      originalFilename: candidate.originalFilename,
      mimeType: "application/pdf",
      sizeBytes: candidate.bytes.byteLength,
    },
  };
}

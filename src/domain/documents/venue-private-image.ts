const MAX_PRIVATE_IMAGE_BYTES = 20_000_000;
const MAX_PRIVATE_IMAGE_DIMENSION_PX = 16_384;
const MAX_PRIVATE_IMAGE_PIXELS = 50_000_000;
const MAX_PRIVATE_IMAGE_FILENAME_SCALARS = 512;

export type VenuePrivateImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface VenuePrivateImageFileCandidate {
  readonly originalFilename: string;
  readonly bytes: Uint8Array;
}

export interface VenuePrivateImageCandidate extends VenuePrivateImageFileCandidate {
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface VenuePrivateGeneratedImageFileCandidate {
  readonly mimeType: unknown;
  readonly bytes: Uint8Array;
}

export interface VenuePrivateGeneratedImageCandidate
  extends VenuePrivateGeneratedImageFileCandidate {
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface ValidatedVenuePrivateImageFile {
  readonly originalFilename: string;
  readonly mimeType: VenuePrivateImageMimeType;
  readonly sizeBytes: number;
}

export interface ValidatedVenuePrivateGeneratedImageFile {
  readonly mimeType: VenuePrivateImageMimeType;
  readonly sizeBytes: number;
}

interface ValidatedVenuePrivateImage extends ValidatedVenuePrivateImageFile {
  readonly widthPx: number;
  readonly heightPx: number;
}

interface ValidatedVenuePrivateGeneratedImage
  extends ValidatedVenuePrivateGeneratedImageFile {
  readonly widthPx: number;
  readonly heightPx: number;
}

export type VenuePrivateImageValidationError =
  | "invalid_filename"
  | "invalid_size"
  | "unsupported_type"
  | "invalid_dimensions";

type VenuePrivateImageFileValidationError = Exclude<
  VenuePrivateImageValidationError,
  "invalid_dimensions"
>;

export type VenuePrivateImageFileValidationResult =
  | { readonly ok: true; readonly value: ValidatedVenuePrivateImageFile }
  | {
      readonly ok: false;
      readonly error: VenuePrivateImageFileValidationError;
    };

export type VenuePrivateGeneratedImageFileValidationResult =
  | {
      readonly ok: true;
      readonly value: ValidatedVenuePrivateGeneratedImageFile;
    }
  | {
      readonly ok: false;
      readonly error: Exclude<
        VenuePrivateImageFileValidationError,
        "invalid_filename"
      >;
    };

export type VenuePrivateImageValidationResult =
  | { readonly ok: true; readonly value: ValidatedVenuePrivateImage }
  | { readonly ok: false; readonly error: VenuePrivateImageValidationError };

export type VenuePrivateGeneratedImageValidationResult =
  | { readonly ok: true; readonly value: ValidatedVenuePrivateGeneratedImage }
  | {
      readonly ok: false;
      readonly error: Exclude<VenuePrivateImageValidationError, "invalid_filename">;
    };

function unicodeScalarWidth(value: string, index: number): 0 | 1 | 2 {
  const codeUnit = value.charCodeAt(index);
  if (codeUnit < 0xd800 || codeUnit > 0xdfff) return 1;
  if (codeUnit > 0xdbff) return 0;
  const nextCodeUnit = value.charCodeAt(index + 1);
  return nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff ? 2 : 0;
}

function hasSafeFilename(value: string): boolean {
  let scalars = 0;
  let index = 0;

  while (index < value.length) {
    const width = unicodeScalarWidth(value, index);
    if (width === 0) return false;
    const codeUnit = value.charCodeAt(index);
    if (codeUnit <= 0x1f) return false;
    index += width;
    scalars += 1;
    if (scalars > MAX_PRIVATE_IMAGE_FILENAME_SCALARS) return false;
  }

  return scalars > 0;
}

function hasValidSize(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 1 && bytes.byteLength <= MAX_PRIVATE_IMAGE_BYTES;
}

function supportedMimeType(value: unknown): VenuePrivateImageMimeType | null {
  if (value === "image/jpeg" || value === "image/png" || value === "image/webp") {
    return value;
  }
  return null;
}

function mimeTypeForFilename(filename: string): VenuePrivateImageMimeType | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

function hasBytesAt(
  bytes: Uint8Array,
  offset: number,
  expected: readonly number[],
): boolean {
  return expected.every((byte, index) => bytes[offset + index] === byte);
}

function hasExpectedSignature(
  bytes: Uint8Array,
  mimeType: VenuePrivateImageMimeType,
): boolean {
  if (mimeType === "image/jpeg") {
    return hasBytesAt(bytes, 0, [0xff, 0xd8, 0xff]);
  }
  if (mimeType === "image/png") {
    return hasBytesAt(
      bytes,
      0,
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    );
  }
  return (
    hasBytesAt(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytesAt(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  );
}

function hasSafeDimensions(widthPx: number, heightPx: number): boolean {
  return (
    Number.isInteger(widthPx) &&
    Number.isInteger(heightPx) &&
    widthPx >= 1 &&
    heightPx >= 1 &&
    widthPx <= MAX_PRIVATE_IMAGE_DIMENSION_PX &&
    heightPx <= MAX_PRIVATE_IMAGE_DIMENSION_PX &&
    widthPx * heightPx <= MAX_PRIVATE_IMAGE_PIXELS
  );
}

export function validateVenuePrivateImageFile(
  candidate: VenuePrivateImageFileCandidate,
): VenuePrivateImageFileValidationResult {
  if (!hasSafeFilename(candidate.originalFilename)) {
    return { ok: false, error: "invalid_filename" };
  }
  if (!hasValidSize(candidate.bytes)) {
    return { ok: false, error: "invalid_size" };
  }

  const mimeType = mimeTypeForFilename(candidate.originalFilename);
  if (mimeType === null || !hasExpectedSignature(candidate.bytes, mimeType)) {
    return { ok: false, error: "unsupported_type" };
  }

  return {
    ok: true,
    value: {
      originalFilename: candidate.originalFilename,
      mimeType,
      sizeBytes: candidate.bytes.byteLength,
    },
  };
}

export function validateVenuePrivateGeneratedImageFile(
  candidate: VenuePrivateGeneratedImageFileCandidate,
): VenuePrivateGeneratedImageFileValidationResult {
  if (!hasValidSize(candidate.bytes)) {
    return { ok: false, error: "invalid_size" };
  }
  const mimeType = supportedMimeType(candidate.mimeType);
  if (mimeType === null || !hasExpectedSignature(candidate.bytes, mimeType)) {
    return { ok: false, error: "unsupported_type" };
  }
  return {
    ok: true,
    value: { mimeType, sizeBytes: candidate.bytes.byteLength },
  };
}

export function validateVenuePrivateImage(
  candidate: VenuePrivateImageCandidate,
): VenuePrivateImageValidationResult {
  const file = validateVenuePrivateImageFile(candidate);
  if (!file.ok) return { ok: false, error: file.error };
  if (!hasSafeDimensions(candidate.widthPx, candidate.heightPx)) {
    return { ok: false, error: "invalid_dimensions" };
  }

  return {
    ok: true,
    value: {
      ...file.value,
      widthPx: candidate.widthPx,
      heightPx: candidate.heightPx,
    },
  };
}

export function validateVenuePrivateGeneratedImage(
  candidate: VenuePrivateGeneratedImageCandidate,
): VenuePrivateGeneratedImageValidationResult {
  const file = validateVenuePrivateGeneratedImageFile(candidate);
  if (!file.ok) return file;
  if (!hasSafeDimensions(candidate.widthPx, candidate.heightPx)) {
    return { ok: false, error: "invalid_dimensions" };
  }
  return {
    ok: true,
    value: {
      ...file.value,
      widthPx: candidate.widthPx,
      heightPx: candidate.heightPx,
    },
  };
}

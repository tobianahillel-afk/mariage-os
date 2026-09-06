const CODE_PART_PATTERN = /\d+|\D+/g;

interface CodePart {
  readonly text: string;
  readonly numeric: boolean;
}

function normalizedVenueCode(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length === 0 ? null : normalized;
}

function codeParts(value: string): readonly CodePart[] {
  return Array.from(value.matchAll(CODE_PART_PATTERN), ([text]) => ({
    text,
    numeric: /^\d+$/.test(text),
  }));
}

function significantDigits(value: string): string {
  return value.replace(/^0+(?=\d)/, "");
}

function compareNumericText(left: string, right: string): number {
  const significantLeft = significantDigits(left);
  const significantRight = significantDigits(right);
  if (significantLeft.length !== significantRight.length) {
    return significantLeft.length - significantRight.length;
  }
  if (significantLeft < significantRight) return -1;
  if (significantLeft > significantRight) return 1;
  return left.length - right.length;
}

function comparePart(left: CodePart, right: CodePart): number {
  if (left.numeric && right.numeric) {
    return compareNumericText(left.text, right.text);
  }
  if (left.numeric) return -1;
  if (right.numeric) return 1;
  return left.text.localeCompare(right.text, "en", { sensitivity: "base" });
}

export function compareVenueCodes(
  left: string | null,
  right: string | null,
): number {
  const normalizedLeft = normalizedVenueCode(left);
  const normalizedRight = normalizedVenueCode(right);
  if (normalizedLeft === normalizedRight) return 0;
  if (normalizedLeft === null) return 1;
  if (normalizedRight === null) return -1;

  const leftParts = codeParts(normalizedLeft);
  const rightParts = codeParts(normalizedRight);
  for (const [index, leftPart] of leftParts.entries()) {
    const rightPart = rightParts[index];
    if (rightPart === undefined) return 1;
    const compared = comparePart(leftPart, rightPart);
    if (compared !== 0) return compared;
  }
  return leftParts.length - rightParts.length;
}

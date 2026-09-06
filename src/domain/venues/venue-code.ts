const CODE_PART_PATTERN = /\d+|\D+/g;

interface CodePart {
  readonly text: string;
  readonly number: number | null;
}

function normalizedVenueCode(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length === 0 ? null : normalized;
}

function codeParts(value: string): readonly CodePart[] {
  return Array.from(value.matchAll(CODE_PART_PATTERN), ([text]) => {
    const number = /^\d+$/.test(text) ? Number(text) : null;
    return { text, number };
  });
}

function comparePart(left: CodePart, right: CodePart): number {
  if (left.number !== null && right.number !== null) {
    return left.number - right.number || left.text.length - right.text.length;
  }
  if (left.number !== null) return -1;
  if (right.number !== null) return 1;
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

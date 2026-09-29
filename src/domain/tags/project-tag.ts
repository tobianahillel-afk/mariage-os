import { hasCodePointLengthBetween } from "@domain/facts/fact-text-length";

const TAG_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
function hasUnsafeControl(value: string): boolean {
  for (const character of value) {
    const point = character.codePointAt(0);
    if (
      point !== undefined &&
      (point <= 31 || (point >= 127 && point <= 159))
    ) {
      return true;
    }
  }
  return false;
}

export interface ProjectTagRecord {
  readonly id: string;
  readonly projectId: string;
  readonly key: string;
  readonly label: string;
  readonly revision: number;
  readonly deletedAt: string | null;
}

export interface VenueTagAssignmentRecord {
  readonly id: string;
  readonly projectId: string;
  readonly tagId: string;
  readonly targetType: "venue";
  readonly venueId: string;
}

export function isCanonicalTagKey(value: unknown): value is string {
  return typeof value === "string" && TAG_KEY_PATTERN.test(value);
}

export function normalizeTagKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return isCanonicalTagKey(key) ? key : null;
}

export function isCanonicalTagLabel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    hasCodePointLengthBetween(value, 1, 80) &&
    !hasUnsafeControl(value)
  );
}

export function normalizeTagLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const label = value.trim();
  return isCanonicalTagLabel(label) ? label : null;
}

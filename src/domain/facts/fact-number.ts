export const MAX_CANONICAL_FACT_NUMBER = 1e308;

export function isCanonicalFactNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= MAX_CANONICAL_FACT_NUMBER
  );
}

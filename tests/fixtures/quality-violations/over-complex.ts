export function deliberatelyBadComplexity(
  a: boolean,
  b: boolean,
  c: boolean,
  d: boolean,
  e: boolean,
): number {
  let score = 0;
  if (a) score += 1;
  if (b) score += 1;
  if (c) score += 1;
  if (d) score += 1;
  if (e) score += 1;
  if (a && b) score += 1;
  if (b && c) score += 1;
  if (c && d) score += 1;
  if (d && e) score += 1;
  return score;
}

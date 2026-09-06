export function hasCodePointLengthBetween(
  value: string,
  minimum: number,
  maximum: number,
): boolean {
  let length = 0;
  for (const _codePoint of value) {
    length += 1;
    if (length > maximum) return false;
  }
  return length >= minimum;
}

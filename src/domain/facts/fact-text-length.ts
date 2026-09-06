export function hasCodePointLengthBetween(
  value: string,
  minimum: number,
  maximum: number,
): boolean {
  let length = 0;
  const iterator = value[Symbol.iterator]();
  while (!iterator.next().done) {
    length += 1;
    if (length > maximum) return false;
  }
  return length >= minimum;
}

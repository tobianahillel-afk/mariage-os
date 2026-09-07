function unicodeScalarWidth(value: string, index: number): 0 | 1 | 2 {
  const codeUnit = value.charCodeAt(index);
  if (codeUnit < 0xd800 || codeUnit > 0xdfff) return 1;
  if (codeUnit > 0xdbff) return 0;

  const nextCodeUnit = value.charCodeAt(index + 1);
  return nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff ? 2 : 0;
}

export function hasCodePointLengthBetween(
  value: string,
  minimum: number,
  maximum: number,
): boolean {
  let length = 0;
  let index = 0;
  while (index < value.length) {
    const width = unicodeScalarWidth(value, index);
    if (width === 0) return false;
    index += width;
    length += 1;
    if (length > maximum) return false;
  }
  return length >= minimum;
}

import { hasCodePointLengthBetween } from "@domain/facts/fact-text-length";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_MONEY_MAX = Number.MAX_SAFE_INTEGER;
const POSTGRES_INT32_MAX = 2_147_483_647;
const QUANTITY_MAX = 999_999_999.999;

export function isVenueCommercialUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function normalizeCommercialRequiredText(
  value: string,
  maximum: number,
): string | null {
  const normalized = value.trim();
  return hasCodePointLengthBetween(normalized, 1, maximum) ? normalized : null;
}

export function normalizeCommercialOptionalText(
  value: string | null | undefined,
  maximum: number,
): string | null | undefined {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  return hasCodePointLengthBetween(normalized, 1, maximum)
    ? normalized
    : undefined;
}

export function isCommercialCurrency(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

export function isCommercialMoney(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= SAFE_MONEY_MAX
  );
}

export function isCommercialNonNegativeInt32(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= POSTGRES_INT32_MAX
  );
}

export function isCommercialBasisPoints(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 10_000;
}

export function isCommercialWeekday(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 6;
}

export function isCommercialDayOffset(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 2;
}

function daysInMonth(year: number, month: number): number {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1] as number;
}

export function isCommercialCivilDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

export function isCommercialLocalTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeCommercialProviderTime(value: unknown): string | null {
  if (value === null) return null;
  if (isCommercialLocalTime(value)) return value;
  if (typeof value !== "string") return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d):00$/.exec(value);
  return match === null ? null : `${match[1]}:${match[2]}`;
}

export function isCommercialQuantity(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (value < 0 || value > QUANTITY_MAX) return false;
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-7;
}

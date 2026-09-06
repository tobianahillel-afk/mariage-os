import type {
  FactOptions,
  FactValueType,
  NumericFactOptions,
  SelectFactOptions,
} from "./fact-types";

export interface FactValueDefinition {
  readonly valueType: FactValueType;
  readonly optionsJson: FactOptions;
}

export type FactValueError = "invalid_fact_value";
export type FactValueResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: FactValueError };

type UnknownRecord = Record<string, unknown>;
type ValueNormalizer = (
  definition: FactValueDefinition,
  raw: unknown,
) => FactValueResult;

const INVALID: FactValueResult = { ok: false, error: "invalid_fact_value" };

function plainRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function exactKeys(record: UnknownRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(record);
  return (
    actual.length === keys.length && actual.every((key) => keys.includes(key))
  );
}

function numericOptions(options: FactOptions): NumericFactOptions {
  if (options === null || "options" in options) return {};
  return options;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function integerMatches(value: number, integer: boolean | undefined): boolean {
  if (integer !== true) return true;
  return Number.isSafeInteger(value);
}

function minimumMatches(value: number, minimum: number | undefined): boolean {
  if (minimum === undefined) return true;
  return value >= minimum;
}

function maximumMatches(value: number, maximum: number | undefined): boolean {
  if (maximum === undefined) return true;
  return value <= maximum;
}

function numberMatches(
  value: unknown,
  options: NumericFactOptions,
): value is number {
  if (!finiteNumber(value)) return false;
  if (!integerMatches(value, options.integer)) return false;
  if (!minimumMatches(value, options.min)) return false;
  if (!maximumMatches(value, options.max)) return false;
  return true;
}

function normalizeNumber(
  definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  return numberMatches(raw, numericOptions(definition.optionsJson))
    ? { ok: true, value: raw }
    : INVALID;
}

function normalizeRating(
  definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  const options = numericOptions(definition.optionsJson);
  const bounds: NumericFactOptions = {
    min: options.min ?? 0,
    max: options.max ?? 10,
    ...(options.integer === undefined ? {} : { integer: options.integer }),
  };
  return numberMatches(raw, bounds) ? { ok: true, value: raw } : INVALID;
}

function normalizeMoney(
  _definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  const record = plainRecord(raw);
  const valid =
    record !== null &&
    exactKeys(record, ["minor", "currency"]) &&
    Number.isSafeInteger(record.minor) &&
    (record.minor as number) >= 0 &&
    typeof record.currency === "string" &&
    /^[A-Z]{3}$/.test(record.currency);
  return valid ? { ok: true, value: raw } : INVALID;
}

function normalizeText(
  _definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  return typeof raw === "string" && raw.length <= 5000
    ? { ok: true, value: raw }
    : INVALID;
}

function normalizeUrl(
  _definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  if (typeof raw !== "string" || raw.length > 2048) return INVALID;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? { ok: true, value: raw }
      : INVALID;
  } catch {
    return INVALID;
  }
}

function normalizeDate(
  _definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return INVALID;
  }
  const [yearText, monthText, dayText] = raw.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const valid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  return valid ? { ok: true, value: raw } : INVALID;
}

function normalizeTime(
  _definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  const record = plainRecord(raw);
  const valid =
    record !== null &&
    exactKeys(record, ["time", "dayOffset"]) &&
    typeof record.time === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(record.time) &&
    Number.isSafeInteger(record.dayOffset) &&
    (record.dayOffset as number) >= 0 &&
    (record.dayOffset as number) <= 2;
  return valid ? { ok: true, value: raw } : INVALID;
}

function normalizeIntegerQuantity(
  definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  const options: NumericFactOptions = {
    ...numericOptions(definition.optionsJson),
    integer: true,
  };
  return numberMatches(raw, options) && raw >= 0
    ? { ok: true, value: raw }
    : INVALID;
}

function selectOptions(options: FactOptions): SelectFactOptions | null {
  if (options === null || !("options" in options)) return null;
  return options;
}

function normalizeSelect(
  definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  const select = selectOptions(definition.optionsJson);
  if (select === null || typeof raw !== "string") return INVALID;
  return select.options.some((option) => option.key === raw)
    ? { ok: true, value: raw }
    : INVALID;
}

function normalizeMultiselect(
  definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  const select = selectOptions(definition.optionsJson);
  if (select === null || !Array.isArray(raw)) return INVALID;
  const requested = new Set<string>();
  for (const candidate of raw) {
    if (typeof candidate !== "string" || requested.has(candidate))
      return INVALID;
    requested.add(candidate);
  }
  const known = new Set(select.options.map((option) => option.key));
  if ([...requested].some((key) => !known.has(key))) return INVALID;
  return {
    ok: true,
    value: select.options
      .map((option) => option.key)
      .filter((key) => requested.has(key)),
  };
}

const VALUE_NORMALIZERS: Readonly<Record<FactValueType, ValueNormalizer>> = {
  boolean: (_definition, raw) =>
    typeof raw === "boolean" ? { ok: true, value: raw } : INVALID,
  number: normalizeNumber,
  money: normalizeMoney,
  text: normalizeText,
  date: normalizeDate,
  time: normalizeTime,
  rating: normalizeRating,
  select: normalizeSelect,
  multiselect: normalizeMultiselect,
  duration: normalizeIntegerQuantity,
  distance: normalizeIntegerQuantity,
  url: normalizeUrl,
};

export function normalizeFactValue(
  definition: FactValueDefinition,
  raw: unknown,
): FactValueResult {
  return VALUE_NORMALIZERS[definition.valueType](definition, raw);
}

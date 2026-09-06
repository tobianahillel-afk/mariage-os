import { isCanonicalFactNumber } from "./fact-number";
import { hasCodePointLengthBetween } from "./fact-text-length";
import type {
  FactOption,
  FactOptions,
  FactValueType,
  NumericFactOptions,
  SelectFactOptions,
} from "./fact-types";

type FactOptionsError = "invalid_options";
export type FactOptionsResult =
  | { readonly ok: true; readonly value: FactOptions }
  | { readonly ok: false; readonly error: FactOptionsError };

type UnknownRecord = Record<string, unknown>;

const NUMERIC_TYPES: readonly FactValueType[] = [
  "number",
  "rating",
  "duration",
  "distance",
];
const INTEGER_QUANTITY_TYPES: readonly FactValueType[] = ["duration", "distance"];
const INVALID_OPTIONS: FactOptionsResult = {
  ok: false,
  error: "invalid_options",
};

function plainRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function hasOnlyKeys(
  record: UnknownRecord,
  allowed: readonly string[],
): boolean {
  return Object.keys(record).every((key) => allowed.includes(key));
}

function optionalFiniteNumber(value: unknown): number | undefined | null {
  if (value === undefined) return undefined;
  return isCanonicalFactNumber(value) ? value : null;
}

function numericRecord(raw: unknown): UnknownRecord | null {
  const record = plainRecord(raw);
  if (record === null) return null;
  return hasOnlyKeys(record, ["min", "max", "integer"]) ? record : null;
}

function validIntegerOption(value: unknown): boolean {
  return value === undefined || typeof value === "boolean";
}

function validNumericBounds(
  min: number | undefined,
  max: number | undefined,
): boolean {
  if (min === undefined || max === undefined) return true;
  return min <= max;
}

function intervalContainsSafeInteger(
  min: number | undefined,
  max: number | undefined,
): boolean {
  const lower = Math.max(min ?? Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
  const upper = Math.min(max ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  return Math.ceil(lower) <= Math.floor(upper);
}

function ratingSemanticsValid(
  record: UnknownRecord,
  min: number | undefined,
  max: number | undefined,
): boolean {
  const lower = min ?? 0;
  const upper = max ?? 10;
  if (lower > upper) return false;
  return record.integer === true
    ? intervalContainsSafeInteger(lower, upper)
    : true;
}

function integerQuantitySemanticsValid(
  record: UnknownRecord,
  min: number | undefined,
  max: number | undefined,
): boolean {
  if (record.integer === false) return false;
  const lower = Math.max(min ?? 0, 0);
  const upper = Math.min(max ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  return Math.ceil(lower) <= Math.floor(upper);
}

function numericSemanticsValid(
  valueType: FactValueType,
  record: UnknownRecord,
  min: number | undefined,
  max: number | undefined,
): boolean {
  if (valueType === "rating") return ratingSemanticsValid(record, min, max);
  if (INTEGER_QUANTITY_TYPES.includes(valueType)) {
    return integerQuantitySemanticsValid(record, min, max);
  }
  if (record.integer === true) return intervalContainsSafeInteger(min, max);
  return true;
}

function buildNumericOptions(
  record: UnknownRecord,
  min: number | undefined,
  max: number | undefined,
): NumericFactOptions {
  return {
    ...(min === undefined ? {} : { min }),
    ...(max === undefined ? {} : { max }),
    ...(record.integer === undefined
      ? {}
      : { integer: record.integer as boolean }),
  };
}

function normalizeNumericOptions(
  valueType: FactValueType,
  raw: unknown,
): FactOptionsResult {
  if (raw === null) return { ok: true, value: null };
  const record = numericRecord(raw);
  if (record === null) return INVALID_OPTIONS;
  const min = optionalFiniteNumber(record.min);
  const max = optionalFiniteNumber(record.max);
  if (min === null || max === null) return INVALID_OPTIONS;
  if (!validIntegerOption(record.integer)) return INVALID_OPTIONS;
  if (!validNumericBounds(min, max)) return INVALID_OPTIONS;
  if (!numericSemanticsValid(valueType, record, min, max)) return INVALID_OPTIONS;
  return { ok: true, value: buildNumericOptions(record, min, max) };
}

function validOptionKey(key: string): boolean {
  return key.length <= 80 && /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(key);
}

function normalizeOption(value: unknown): FactOption | null {
  const record = plainRecord(value);
  if (record === null) return null;
  if (!hasOnlyKeys(record, ["key", "labelKey"])) return null;
  if (typeof record.key !== "string" || typeof record.labelKey !== "string") {
    return null;
  }
  const key = record.key.trim();
  const labelKey = record.labelKey.trim();
  if (!validOptionKey(key)) return null;
  if (!hasCodePointLengthBetween(labelKey, 1, 160)) return null;
  return { key, labelKey };
}

function optionCandidates(raw: unknown): readonly unknown[] | null {
  const record = plainRecord(raw);
  if (record === null || !hasOnlyKeys(record, ["options"])) return null;
  if (!Array.isArray(record.options)) return null;
  if (record.options.length < 1 || record.options.length > 100) return null;
  return record.options;
}

function normalizeOptionList(
  candidates: readonly unknown[],
): FactOption[] | null {
  const options: FactOption[] = [];
  const keys = new Set<string>();
  for (const candidate of candidates) {
    const option = normalizeOption(candidate);
    if (option === null) return null;
    if (keys.has(option.key)) return null;
    keys.add(option.key);
    options.push(option);
  }
  return options;
}

function normalizeSelectOptions(raw: unknown): FactOptionsResult {
  const candidates = optionCandidates(raw);
  if (candidates === null) return INVALID_OPTIONS;
  const options = normalizeOptionList(candidates);
  if (options === null) return INVALID_OPTIONS;
  const value: SelectFactOptions = { options };
  return { ok: true, value };
}

export function normalizeFactOptions(
  valueType: FactValueType,
  raw: unknown,
): FactOptionsResult {
  if (NUMERIC_TYPES.includes(valueType)) {
    return normalizeNumericOptions(valueType, raw);
  }
  if (valueType === "select" || valueType === "multiselect") {
    return normalizeSelectOptions(raw);
  }
  if (raw === null) return { ok: true, value: null };
  return INVALID_OPTIONS;
}

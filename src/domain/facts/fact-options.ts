import type {
  FactOption,
  FactOptions,
  FactValueType,
  NumericFactOptions,
  SelectFactOptions,
} from "./fact-types";

export type FactOptionsError = "invalid_options";
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
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function normalizeNumericOptions(raw: unknown): FactOptionsResult {
  if (raw === null) return { ok: true, value: null };
  const record = plainRecord(raw);
  if (record === null || !hasOnlyKeys(record, ["min", "max", "integer"])) {
    return { ok: false, error: "invalid_options" };
  }

  const min = optionalFiniteNumber(record.min);
  const max = optionalFiniteNumber(record.max);
  if (min === null || max === null)
    return { ok: false, error: "invalid_options" };
  if (record.integer !== undefined && typeof record.integer !== "boolean") {
    return { ok: false, error: "invalid_options" };
  }
  if (min !== undefined && max !== undefined && min > max) {
    return { ok: false, error: "invalid_options" };
  }

  const value: NumericFactOptions = {
    ...(min === undefined ? {} : { min }),
    ...(max === undefined ? {} : { max }),
    ...(record.integer === undefined ? {} : { integer: record.integer }),
  };
  return { ok: true, value };
}

function normalizeOption(value: unknown): FactOption | null {
  const record = plainRecord(value);
  if (record === null || !hasOnlyKeys(record, ["key", "labelKey"])) return null;
  if (typeof record.key !== "string" || typeof record.labelKey !== "string") {
    return null;
  }
  const key = record.key.trim();
  const labelKey = record.labelKey.trim();
  if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(key) || key.length > 80) {
    return null;
  }
  if (labelKey.length < 1 || labelKey.length > 160) return null;
  return { key, labelKey };
}

function normalizeSelectOptions(raw: unknown): FactOptionsResult {
  const record = plainRecord(raw);
  if (record === null || !hasOnlyKeys(record, ["options"])) {
    return { ok: false, error: "invalid_options" };
  }
  if (
    !Array.isArray(record.options) ||
    record.options.length < 1 ||
    record.options.length > 100
  ) {
    return { ok: false, error: "invalid_options" };
  }
  const options: FactOption[] = [];
  const keys = new Set<string>();
  for (const candidate of record.options) {
    const option = normalizeOption(candidate);
    if (option === null || keys.has(option.key)) {
      return { ok: false, error: "invalid_options" };
    }
    keys.add(option.key);
    options.push(option);
  }
  const value: SelectFactOptions = { options };
  return { ok: true, value };
}

export function normalizeFactOptions(
  valueType: FactValueType,
  raw: unknown,
): FactOptionsResult {
  if (NUMERIC_TYPES.includes(valueType)) return normalizeNumericOptions(raw);
  if (valueType === "select" || valueType === "multiselect") {
    return normalizeSelectOptions(raw);
  }
  if (raw === null) return { ok: true, value: null };
  return { ok: false, error: "invalid_options" };
}

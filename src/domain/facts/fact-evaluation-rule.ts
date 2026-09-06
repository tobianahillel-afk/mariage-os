import type {
  FactOptions,
  FactValueType,
  SelectFactOptions,
} from "./fact-types";

export type FactEvaluationRule = Readonly<Record<string, unknown>>;
type FactEvaluationRuleError = "invalid_evaluation_rule";
export type FactEvaluationRuleResult =
  | { readonly ok: true; readonly value: FactEvaluationRule | null }
  | { readonly ok: false; readonly error: FactEvaluationRuleError };

type UnknownRecord = Record<string, unknown>;
type RuleValidator = (
  valueType: FactValueType,
  options: FactOptions,
  record: UnknownRecord,
) => boolean;

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

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validClock(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validMoney(value: unknown): boolean {
  const money = plainRecord(value);
  return (
    money !== null &&
    exactKeys(money, ["minor", "currency"]) &&
    Number.isSafeInteger(money.minor) &&
    (money.minor as number) >= 0 &&
    typeof money.currency === "string" &&
    /^[A-Z]{3}$/.test(money.currency)
  );
}

function optionKeys(options: FactOptions): ReadonlySet<string> {
  if (options === null || !("options" in options)) return new Set<string>();
  return new Set(
    (options as SelectFactOptions).options.map((option) => option.key),
  );
}

function validStringSet(value: unknown, allowed: ReadonlySet<string>): boolean {
  if (!Array.isArray(value) || value.length < 1) return false;
  const seen = new Set<string>();
  for (const candidate of value) {
    if (
      typeof candidate !== "string" ||
      !allowed.has(candidate) ||
      seen.has(candidate)
    ) {
      return false;
    }
    seen.add(candidate);
  }
  return true;
}

function booleanRule(
  valueType: FactValueType,
  _options: FactOptions,
  record: UnknownRecord,
): boolean {
  return (
    valueType === "boolean" &&
    exactKeys(record, ["type", "expected"]) &&
    typeof record.expected === "boolean"
  );
}

function numericRule(field: "minimum" | "maximum"): RuleValidator {
  return (valueType, _options, record) =>
    ["number", "duration", "distance"].includes(valueType) &&
    exactKeys(record, ["type", field]) &&
    finiteNumber(record[field]);
}

function numberRangeRule(
  valueType: FactValueType,
  _options: FactOptions,
  record: UnknownRecord,
): boolean {
  return (
    ["number", "duration", "distance"].includes(valueType) &&
    exactKeys(record, ["type", "minimum", "maximum"]) &&
    finiteNumber(record.minimum) &&
    finiteNumber(record.maximum) &&
    record.minimum <= record.maximum
  );
}

function ratingRule(
  valueType: FactValueType,
  _options: FactOptions,
  record: UnknownRecord,
): boolean {
  return (
    valueType === "rating" &&
    exactKeys(record, ["type", "minimum"]) &&
    finiteNumber(record.minimum)
  );
}

function selectRule(field: "accepted" | "rejected"): RuleValidator {
  return (valueType, options, record) =>
    valueType === "select" &&
    exactKeys(record, ["type", field]) &&
    validStringSet(record[field], optionKeys(options));
}

function timeRule(
  valueType: FactValueType,
  _options: FactOptions,
  record: UnknownRecord,
): boolean {
  return (
    valueType === "time" &&
    exactKeys(record, ["type", "time", "dayOffset"]) &&
    validClock(record.time) &&
    Number.isSafeInteger(record.dayOffset) &&
    (record.dayOffset as number) >= 0 &&
    (record.dayOffset as number) <= 2
  );
}

function moneyRule(
  valueType: FactValueType,
  _options: FactOptions,
  record: UnknownRecord,
): boolean {
  return (
    valueType === "money" &&
    exactKeys(record, ["type", "maximum"]) &&
    validMoney(record.maximum)
  );
}

function typeOnlyRule(allowed: readonly FactValueType[]): RuleValidator {
  return (valueType, _options, record) =>
    allowed.includes(valueType) && exactKeys(record, ["type"]);
}

const RULE_VALIDATORS: Readonly<Record<string, RuleValidator>> = {
  boolean_equals: booleanRule,
  number_min: numericRule("minimum"),
  number_max: numericRule("maximum"),
  number_range: numberRangeRule,
  rating_min: ratingRule,
  select_in: selectRule("accepted"),
  select_not_in: selectRule("rejected"),
  time_at_or_after: timeRule,
  time_at_or_before: timeRule,
  money_max: moneyRule,
  project_target_guest_count_supported: typeOnlyRule(["boolean"]),
  custom_manual_assessment: typeOnlyRule(["boolean", "select", "rating"]),
};

export function normalizeFactEvaluationRule(
  valueType: FactValueType,
  options: FactOptions,
  raw: unknown,
): FactEvaluationRuleResult {
  if (raw === null) return { ok: true, value: null };
  const record = plainRecord(raw);
  if (record === null || typeof record.type !== "string") {
    return { ok: false, error: "invalid_evaluation_rule" };
  }
  const validator = RULE_VALIDATORS[record.type];
  if (validator === undefined || !validator(valueType, options, record)) {
    return { ok: false, error: "invalid_evaluation_rule" };
  }
  return { ok: true, value: Object.freeze({ ...record }) };
}

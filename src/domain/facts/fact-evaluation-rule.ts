import { isCanonicalFactNumber } from "./fact-number";
import type {
  FactOptions,
  FactValueType,
  SelectFactOptions,
} from "./fact-types";
import { normalizeFactValue } from "./fact-value";

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

const booleanRule: RuleValidator = (valueType, _options, record) =>
  valueType === "boolean" &&
  exactKeys(record, ["type", "expected"]) &&
  typeof record.expected === "boolean";

function numericRule(field: "minimum" | "maximum"): RuleValidator {
  return (valueType, _options, record) =>
    ["number", "duration", "distance"].includes(valueType) &&
    exactKeys(record, ["type", field]) &&
    isCanonicalFactNumber(record[field]);
}

const numberRangeRule: RuleValidator = (valueType, _options, record) =>
  ["number", "duration", "distance"].includes(valueType) &&
  exactKeys(record, ["type", "minimum", "maximum"]) &&
  isCanonicalFactNumber(record.minimum) &&
  isCanonicalFactNumber(record.maximum) &&
  record.minimum <= record.maximum;

const ratingRule: RuleValidator = (valueType, _options, record) =>
  valueType === "rating" &&
  exactKeys(record, ["type", "minimum"]) &&
  isCanonicalFactNumber(record.minimum);

function selectRule(field: "accepted" | "rejected"): RuleValidator {
  return (valueType, options, record) =>
    valueType === "select" &&
    exactKeys(record, ["type", field]) &&
    validStringSet(record[field], optionKeys(options));
}

const timeRule: RuleValidator = (valueType, _options, record) =>
  valueType === "time" &&
  exactKeys(record, ["type", "time", "dayOffset"]) &&
  validClock(record.time) &&
  Number.isSafeInteger(record.dayOffset) &&
  (record.dayOffset as number) >= 0 &&
  (record.dayOffset as number) <= 2;

const moneyRule: RuleValidator = (valueType, _options, record) =>
  valueType === "money" &&
  exactKeys(record, ["type", "maximum"]) &&
  validMoney(record.maximum);

const dynamicGuestRule: RuleValidator = (valueType, _options, record) =>
  valueType === "boolean" && exactKeys(record, ["type"]);

const manualAssessmentRule: RuleValidator = (valueType, options, record) => {
  if (
    !["boolean", "select", "rating"].includes(valueType) ||
    !exactKeys(record, ["type", "accepted"])
  ) {
    return false;
  }
  return normalizeFactValue(
    { valueType, optionsJson: options },
    record.accepted,
  ).ok;
};

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
  project_target_guest_count_supported: dynamicGuestRule,
  custom_manual_assessment: manualAssessmentRule,
};

function freezeCanonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => freezeCanonicalValue(item)));
  }
  const record = plainRecord(value);
  if (record === null) return value;
  return freezeCanonicalRecord(record);
}

function freezeCanonicalRecord(record: UnknownRecord): FactEvaluationRule {
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    copy[key] = freezeCanonicalValue(value);
  }
  return Object.freeze(copy);
}

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
  return { ok: true, value: freezeCanonicalRecord(record) };
}

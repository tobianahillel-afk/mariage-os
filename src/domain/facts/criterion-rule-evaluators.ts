import type { FactEvaluationRule } from "./fact-evaluation-rule";
import type { CriterionOutcome, CriterionReason } from "./criterion-types";

type KnownRuleResult = Readonly<{
  outcome: Extract<CriterionOutcome, "PASS" | "FAIL" | "UNKNOWN">;
  reason: Extract<
    CriterionReason,
    "rule_pass" | "rule_fail" | "currency_mismatch"
  >;
  target: unknown;
}>;
type RuleEvaluator = (
  value: unknown,
  rule: FactEvaluationRule,
) => KnownRuleResult;
type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value as UnknownRecord;
}

function binary(pass: boolean, target: unknown): KnownRuleResult {
  return {
    outcome: pass ? "PASS" : "FAIL",
    reason: pass ? "rule_pass" : "rule_fail",
    target,
  };
}

const booleanEvaluator: RuleEvaluator = (value, rule) =>
  binary(value === rule.expected, rule.expected);

function numericEvaluator(
  field: "minimum" | "maximum",
  compare: (value: number, target: number) => boolean,
): RuleEvaluator {
  return (value, rule) => {
    const target = rule[field] as number;
    return binary(compare(value as number, target), target);
  };
}

const rangeEvaluator: RuleEvaluator = (value, rule) => {
  const minimum = rule.minimum as number;
  const maximum = rule.maximum as number;
  const actual = value as number;
  return binary(actual >= minimum && actual <= maximum, { minimum, maximum });
};

function selectEvaluator(
  field: "accepted" | "rejected",
  expectedMembership: boolean,
): RuleEvaluator {
  return (value, rule) => {
    const values = rule[field] as readonly string[];
    return binary(
      values.includes(value as string) === expectedMembership,
      values,
    );
  };
}

function clockMinutes(value: unknown): number {
  const time = record(value);
  const clock = time.time as string;
  const hours = Number(clock.slice(0, 2));
  const minutes = Number(clock.slice(3, 5));
  return (time.dayOffset as number) * 1440 + hours * 60 + minutes;
}

function timeEvaluator(
  compare: (value: number, target: number) => boolean,
): RuleEvaluator {
  return (value, rule) => {
    const targetValue = { time: rule.time, dayOffset: rule.dayOffset };
    return binary(
      compare(clockMinutes(value), clockMinutes(targetValue)),
      targetValue,
    );
  };
}

const moneyEvaluator: RuleEvaluator = (value, rule) => {
  const actual = record(value);
  const maximum = record(rule.maximum);
  if (actual.currency !== maximum.currency) {
    return { outcome: "UNKNOWN", reason: "currency_mismatch", target: maximum };
  }
  return binary((actual.minor as number) <= (maximum.minor as number), maximum);
};

const manualEvaluator: RuleEvaluator = (value, rule) =>
  binary(value === rule.accepted, rule.accepted);

const RULE_EVALUATORS: Readonly<Record<string, RuleEvaluator>> = {
  boolean_equals: booleanEvaluator,
  number_min: numericEvaluator("minimum", (value, target) => value >= target),
  number_max: numericEvaluator("maximum", (value, target) => value <= target),
  number_range: rangeEvaluator,
  rating_min: numericEvaluator("minimum", (value, target) => value >= target),
  select_in: selectEvaluator("accepted", true),
  select_not_in: selectEvaluator("rejected", false),
  time_at_or_after: timeEvaluator((value, target) => value >= target),
  time_at_or_before: timeEvaluator((value, target) => value <= target),
  money_max: moneyEvaluator,
  custom_manual_assessment: manualEvaluator,
};

export function evaluateKnownRule(
  value: unknown,
  rule: FactEvaluationRule,
): KnownRuleResult | null {
  const evaluator = RULE_EVALUATORS[rule.type as string];
  return evaluator?.(value, rule) ?? null;
}

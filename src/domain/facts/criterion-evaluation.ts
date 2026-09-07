import {
  isDerivedTargetGuestDefinition,
  TWO_DANCE_AREAS_MAX_GUEST_KEY,
} from "./derived-fact-definition";
import { normalizeFactEvaluationRule } from "./fact-evaluation-rule";
import { evaluateKnownRule } from "./criterion-rule-evaluators";
import type {
  CriterionEvaluation,
  CriterionEvaluationContext,
  CriterionFactSnapshot,
  CriterionOutcome,
  CriterionReason,
} from "./criterion-types";
import { normalizeFactValue } from "./fact-value";

interface ResultDetails {
  readonly actual?: unknown;
  readonly target?: unknown;
}

function result(
  snapshot: CriterionFactSnapshot,
  outcome: CriterionOutcome,
  reason: CriterionReason,
  details: ResultDetails = {},
): CriterionEvaluation {
  return {
    key: snapshot.definition.key,
    priority: snapshot.definition.priority,
    configuredWeight: snapshot.definition.weight,
    outcome,
    reason,
    actual: details.actual ?? null,
    target: details.target ?? null,
  };
}

function validGuestCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function sourceSnapshot(
  snapshots: readonly CriterionFactSnapshot[],
): CriterionFactSnapshot | null {
  const candidates = snapshots.filter(
    (snapshot) => snapshot.definition.key === TWO_DANCE_AREAS_MAX_GUEST_KEY,
  );
  return candidates.length === 1
    ? (candidates[0] as CriterionFactSnapshot)
    : null;
}

function sourceStateIssue(
  source: CriterionFactSnapshot,
  derived: CriterionFactSnapshot,
): CriterionEvaluation | null {
  if (source.state === "conflict")
    return result(derived, "CONFLICT", "conflict");
  if (source.state === "not_applicable") {
    return result(derived, "UNKNOWN", "support_ceiling_not_applicable");
  }
  if (source.state !== "known") {
    return result(derived, "UNKNOWN", "missing_support_ceiling");
  }
  return null;
}

function evaluateSupportCeiling(
  target: number,
  source: CriterionFactSnapshot,
  derived: CriterionFactSnapshot,
): CriterionEvaluation {
  const stateIssue = sourceStateIssue(source, derived);
  if (stateIssue !== null) return stateIssue;
  const normalized = normalizeFactValue(
    source.definition,
    source.retainedValue,
  );
  if (!normalized.ok || !validGuestCount(normalized.value)) {
    return result(derived, "UNKNOWN", "invalid_support_ceiling");
  }
  const ceiling = normalized.value;
  const passes = target <= ceiling;
  return result(
    derived,
    passes ? "PASS" : "FAIL",
    passes ? "rule_pass" : "rule_fail",
    { actual: ceiling, target },
  );
}

function evaluateDynamic(
  snapshot: CriterionFactSnapshot,
  snapshots: readonly CriterionFactSnapshot[],
  context: CriterionEvaluationContext,
): CriterionEvaluation {
  if (!isDerivedTargetGuestDefinition(snapshot.definition)) {
    return result(snapshot, "UNKNOWN", "configuration_incomplete");
  }
  if (context.targetGuestCount === null) {
    return result(snapshot, "UNKNOWN", "missing_target_guest_count");
  }
  if (!validGuestCount(context.targetGuestCount)) {
    return result(snapshot, "UNKNOWN", "invalid_target_guest_count");
  }
  const source = sourceSnapshot(snapshots);
  if (source === null || source.definition.valueType !== "number") {
    return result(snapshot, "UNKNOWN", "configuration_incomplete");
  }
  return evaluateSupportCeiling(context.targetGuestCount, source, snapshot);
}

function evaluateOrdinary(
  snapshot: CriterionFactSnapshot,
  rule: Readonly<Record<string, unknown>>,
): CriterionEvaluation {
  if (snapshot.state === null)
    return result(snapshot, "UNKNOWN", "missing_fact");
  if (snapshot.state === "unknown")
    return result(snapshot, "UNKNOWN", "unknown_fact");
  if (snapshot.state === "conflict")
    return result(snapshot, "CONFLICT", "conflict");
  if (snapshot.state === "not_applicable") {
    return result(snapshot, "NOT_APPLICABLE", "not_applicable");
  }
  const normalized = normalizeFactValue(
    snapshot.definition,
    snapshot.retainedValue,
  );
  if (!normalized.ok)
    return result(snapshot, "UNKNOWN", "invalid_retained_value");
  const evaluated = evaluateKnownRule(normalized.value, rule);
  if (evaluated === null)
    return result(snapshot, "UNKNOWN", "configuration_incomplete");
  return result(snapshot, evaluated.outcome, evaluated.reason, {
    actual: normalized.value,
    target: evaluated.target,
  });
}

export function evaluateCriterion(
  snapshot: CriterionFactSnapshot,
  snapshots: readonly CriterionFactSnapshot[],
  context: CriterionEvaluationContext,
): CriterionEvaluation {
  const normalized = normalizeFactEvaluationRule(
    snapshot.definition.valueType,
    snapshot.definition.optionsJson,
    snapshot.definition.evaluationRuleJson,
  );
  if (!normalized.ok || normalized.value === null) {
    return result(snapshot, "UNKNOWN", "configuration_incomplete");
  }
  if (normalized.value.type === "project_target_guest_count_supported") {
    return evaluateDynamic(snapshot, snapshots, context);
  }
  return evaluateOrdinary(snapshot, normalized.value);
}

export function evaluateCriteria(
  snapshots: readonly CriterionFactSnapshot[],
  context: CriterionEvaluationContext,
): readonly CriterionEvaluation[] {
  return Object.freeze(
    snapshots.map((snapshot) =>
      evaluateCriterion(snapshot, snapshots, context),
    ),
  );
}

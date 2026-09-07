import type { FactEvaluationRule } from "./fact-evaluation-rule";
import type { FactObservationStatus } from "./fact-evidence-types";
import type {
  FactOptions,
  FactPriority,
  FactState,
  FactValueType,
} from "./fact-types";

export type CriterionOutcome =
  "PASS" | "FAIL" | "UNKNOWN" | "NOT_APPLICABLE" | "CONFLICT";

export type CriterionReason =
  | "rule_pass"
  | "rule_fail"
  | "missing_fact"
  | "unknown_fact"
  | "conflict"
  | "not_applicable"
  | "configuration_incomplete"
  | "invalid_retained_value"
  | "currency_mismatch"
  | "missing_target_guest_count"
  | "invalid_target_guest_count"
  | "missing_support_ceiling"
  | "support_ceiling_not_applicable"
  | "invalid_support_ceiling";

export interface CriterionDefinition {
  readonly key: string;
  readonly valueType: FactValueType;
  readonly unit: string | null;
  readonly optionsJson: FactOptions;
  readonly priority: FactPriority;
  readonly weight: number | null;
  readonly evaluationRuleJson: FactEvaluationRule | null;
  readonly systemDefined: boolean;
}

export interface CriterionFactSnapshot {
  readonly definition: CriterionDefinition;
  readonly state: FactState | null;
  readonly retainedValue: unknown;
  readonly retainedObservationStatus: FactObservationStatus | null;
  readonly staleAt: string | null;
}

export interface CriterionEvaluationContext {
  readonly targetGuestCount: number | null;
}

export interface CriterionEvaluation {
  readonly key: string;
  readonly priority: FactPriority;
  readonly configuredWeight: number | null;
  readonly outcome: CriterionOutcome;
  readonly reason: CriterionReason;
  readonly actual: unknown;
  readonly target: unknown;
}

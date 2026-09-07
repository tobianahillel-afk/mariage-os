import type { FactEvaluationRule } from "./fact-evaluation-rule";
import type { FactValueType } from "./fact-types";

export const TARGET_GUEST_COUNT_SUPPORTED_KEY =
  "target_guest_count_supported" as const;
export const TWO_DANCE_AREAS_MAX_GUEST_KEY =
  "two_dance_areas_max_guest_estimate" as const;
export const DYNAMIC_GUEST_RULE_TYPE =
  "project_target_guest_count_supported" as const;

interface DefinitionLike {
  readonly key: string;
  readonly valueType: FactValueType;
  readonly systemDefined: boolean;
  readonly evaluationRuleJson: FactEvaluationRule | null;
}

export function isDynamicGuestRule(rule: FactEvaluationRule | null): boolean {
  return rule?.type === DYNAMIC_GUEST_RULE_TYPE;
}

export function isDerivedTargetGuestDefinition(
  definition: DefinitionLike,
): boolean {
  return (
    definition.systemDefined &&
    definition.key === TARGET_GUEST_COUNT_SUPPORTED_KEY &&
    definition.valueType === "boolean" &&
    isDynamicGuestRule(definition.evaluationRuleJson)
  );
}

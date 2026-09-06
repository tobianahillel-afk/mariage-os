import {
  normalizeFactEvaluationRule,
  type FactEvaluationRule,
} from "./fact-evaluation-rule";
import { normalizeFactOptions } from "./fact-options";
import {
  isFactPriority,
  isFactValueType,
  type FactOptions,
  type FactPriority,
  type FactValueType,
} from "./fact-types";

export interface FactDefinitionDraft {
  readonly key: unknown;
  readonly label: unknown;
  readonly valueType: unknown;
  readonly unit: unknown;
  readonly priority: unknown;
  readonly weight: unknown;
  readonly freshnessPolicy: unknown;
  readonly optionsJson: unknown;
  readonly evaluationRuleJson: unknown;
}

export interface NormalizedFactDefinition {
  readonly key: string;
  readonly label: string;
  readonly valueType: FactValueType;
  readonly unit: string | null;
  readonly priority: FactPriority;
  readonly weight: number | null;
  readonly freshnessPolicy: string | null;
  readonly optionsJson: FactOptions;
  readonly evaluationRuleJson: FactEvaluationRule | null;
}

export type FactDefinitionError =
  | "invalid_key"
  | "invalid_label"
  | "invalid_value_type"
  | "invalid_unit"
  | "invalid_priority"
  | "invalid_weight"
  | "invalid_freshness_policy"
  | "invalid_options"
  | "invalid_evaluation_rule";

export type FactDefinitionResult =
  | { readonly ok: true; readonly value: NormalizedFactDefinition }
  | { readonly ok: false; readonly error: FactDefinitionError };

interface CoreFields {
  readonly key: string;
  readonly label: string;
  readonly valueType: FactValueType;
  readonly unit: string | null;
}

interface MetadataFields {
  readonly priority: FactPriority;
  readonly weight: number | null;
  readonly freshnessPolicy: string | null;
}

function normalizeRequiredText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > maximum) return null;
  return normalized;
}

function normalizeOptionalText(
  value: unknown,
  maximum: number,
): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > maximum) return undefined;
  return normalized;
}

function normalizeWeight(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 99_999.999
  ) {
    return undefined;
  }
  const scaled = value * 1000;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-9) return undefined;
  return value;
}

function unitMatchesType(valueType: FactValueType, unit: string | null): boolean {
  if (valueType === "duration") return unit === "minutes";
  if (valueType === "distance") return unit === "meters";
  return true;
}

function normalizeCore(draft: FactDefinitionDraft): CoreFields | FactDefinitionError {
  const key = normalizeRequiredText(draft.key, 120);
  if (key === null || !/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(key)) {
    return "invalid_key";
  }
  const label = normalizeRequiredText(draft.label, 240);
  if (label === null) return "invalid_label";
  if (!isFactValueType(draft.valueType)) return "invalid_value_type";
  const unit = normalizeOptionalText(draft.unit, 80);
  if (unit === undefined || !unitMatchesType(draft.valueType, unit)) {
    return "invalid_unit";
  }
  return { key, label, valueType: draft.valueType, unit };
}

function normalizeMetadata(
  draft: FactDefinitionDraft,
): MetadataFields | FactDefinitionError {
  if (!isFactPriority(draft.priority)) return "invalid_priority";
  const weight = normalizeWeight(draft.weight);
  if (weight === undefined) return "invalid_weight";
  const freshnessPolicy = normalizeOptionalText(draft.freshnessPolicy, 160);
  if (freshnessPolicy === undefined) return "invalid_freshness_policy";
  return { priority: draft.priority, weight, freshnessPolicy };
}

export function normalizeFactDefinition(
  draft: FactDefinitionDraft,
): FactDefinitionResult {
  const core = normalizeCore(draft);
  if (typeof core === "string") return { ok: false, error: core };
  const metadata = normalizeMetadata(draft);
  if (typeof metadata === "string") return { ok: false, error: metadata };
  const options = normalizeFactOptions(core.valueType, draft.optionsJson);
  if (!options.ok) return options;
  const rule = normalizeFactEvaluationRule(
    core.valueType,
    options.value,
    draft.evaluationRuleJson,
  );
  if (!rule.ok) return rule;
  return {
    ok: true,
    value: {
      ...core,
      ...metadata,
      optionsJson: options.value,
      evaluationRuleJson: rule.value,
    },
  };
}

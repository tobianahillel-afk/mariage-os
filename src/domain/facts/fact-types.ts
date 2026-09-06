export const FACT_VALUE_TYPES = [
  "boolean",
  "number",
  "money",
  "text",
  "date",
  "time",
  "rating",
  "select",
  "multiselect",
  "duration",
  "distance",
  "url",
] as const;

export const FACT_PRIORITIES = [
  "blocking",
  "important",
  "bonus",
  "informational",
] as const;

export const FACT_STATES = [
  "known",
  "unknown",
  "not_applicable",
  "conflict",
] as const;

export type FactValueType = (typeof FACT_VALUE_TYPES)[number];
export type FactPriority = (typeof FACT_PRIORITIES)[number];
export type FactState = (typeof FACT_STATES)[number];

export interface FactOption {
  readonly key: string;
  readonly labelKey: string;
}

export interface NumericFactOptions {
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
}

export interface SelectFactOptions {
  readonly options: readonly FactOption[];
}

export type FactOptions = NumericFactOptions | SelectFactOptions | null;

export function isFactValueType(value: unknown): value is FactValueType {
  return FACT_VALUE_TYPES.some((candidate) => candidate === value);
}

export function isFactPriority(value: unknown): value is FactPriority {
  return FACT_PRIORITIES.some((candidate) => candidate === value);
}

export function isFactState(value: unknown): value is FactState {
  return FACT_STATES.some((candidate) => candidate === value);
}

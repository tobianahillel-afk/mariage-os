import {
  isDerivedTargetGuestDefinition,
  isDynamicGuestSupportSourceDefinition,
} from "./derived-fact-definition";
import { normalizeFactInstant } from "./fact-observation";
import type {
  CriterionEvaluation,
  CriterionFactSnapshot,
  CriterionReason,
} from "./criterion-types";

export type CriterionGuidanceKind =
  | "missing_or_unknown"
  | "conflicting"
  | "stale"
  | "retained_evidence_missing_or_non_active"
  | "configuration_incomplete";

export interface CriterionGuidance {
  readonly key: string;
  readonly kind: CriterionGuidanceKind;
}

const MISSING_REASONS: ReadonlySet<CriterionReason> = new Set([
  "missing_fact",
  "unknown_fact",
  "missing_target_guest_count",
  "missing_support_ceiling",
  "support_ceiling_not_applicable",
]);

const CONFIGURATION_REASONS: ReadonlySet<CriterionReason> = new Set([
  "configuration_incomplete",
  "invalid_retained_value",
  "currency_mismatch",
  "invalid_target_guest_count",
  "invalid_support_ceiling",
]);

function isCritical(evaluation: CriterionEvaluation): boolean {
  return ["blocking", "important"].includes(evaluation.priority);
}

function evidenceSubject(
  snapshot: CriterionFactSnapshot,
  snapshots: readonly CriterionFactSnapshot[],
): CriterionFactSnapshot | null {
  if (!isDerivedTargetGuestDefinition(snapshot.definition)) return snapshot;
  const sources = snapshots.filter((item) =>
    isDynamicGuestSupportSourceDefinition(item.definition),
  );
  return sources.length === 1 ? (sources[0] as CriterionFactSnapshot) : null;
}

function addSemanticIssue(
  issues: Set<CriterionGuidanceKind>,
  evaluation: CriterionEvaluation,
): void {
  if (evaluation.outcome === "CONFLICT") issues.add("conflicting");
  if (MISSING_REASONS.has(evaluation.reason)) issues.add("missing_or_unknown");
  if (CONFIGURATION_REASONS.has(evaluation.reason)) {
    issues.add("configuration_incomplete");
  }
}

function addEvidenceIssues(
  issues: Set<CriterionGuidanceKind>,
  subject: CriterionFactSnapshot | null,
  evaluatedAt: string | null,
): void {
  if (subject === null) return;
  if (subject.retainedObservationStatus !== "active") {
    issues.add("retained_evidence_missing_or_non_active");
  }
  if (subject.staleAt === null || evaluatedAt === null) return;
  const staleAt = normalizeFactInstant(subject.staleAt);
  if (staleAt === null) {
    issues.add("configuration_incomplete");
  } else if (staleAt <= evaluatedAt) {
    issues.add("stale");
  }
}

export function classifyCriterionGuidance(
  snapshot: CriterionFactSnapshot,
  evaluation: CriterionEvaluation,
  snapshots: readonly CriterionFactSnapshot[],
  evaluatedAtInput: string,
): readonly CriterionGuidance[] {
  if (!isCritical(evaluation) || evaluation.outcome === "NOT_APPLICABLE") {
    return Object.freeze([]);
  }
  const issues = new Set<CriterionGuidanceKind>();
  addSemanticIssue(issues, evaluation);
  const evaluatedAt = normalizeFactInstant(evaluatedAtInput);
  if (evaluatedAt === null) issues.add("configuration_incomplete");
  addEvidenceIssues(issues, evidenceSubject(snapshot, snapshots), evaluatedAt);
  return Object.freeze(
    [...issues].map((kind) => ({ key: evaluation.key, kind })),
  );
}

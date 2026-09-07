import {
  isDerivedTargetGuestDefinition,
  TWO_DANCE_AREAS_MAX_GUEST_KEY,
} from "./derived-fact-definition";
import { normalizeFactInstant } from "./fact-observation";
import type {
  CriterionEvaluation,
  CriterionEvaluationContext,
  CriterionFactSnapshot,
} from "./criterion-types";

export interface EvidenceReadiness {
  readonly evidenceReadiness: number | null;
  readonly readyCriteria: number;
  readonly applicableCriteria: number;
}

interface ReadinessContext {
  readonly snapshots: readonly CriterionFactSnapshot[];
  readonly evaluationContext: CriterionEvaluationContext;
  readonly evaluatedAt: string | null;
}

function freshAt(
  snapshot: CriterionFactSnapshot,
  evaluatedAt: string,
): boolean {
  if (snapshot.staleAt === null) return true;
  const staleAt = normalizeFactInstant(snapshot.staleAt);
  return staleAt !== null && staleAt > evaluatedAt;
}

function ordinaryReady(
  snapshot: CriterionFactSnapshot,
  evaluation: CriterionEvaluation,
  evaluatedAt: string,
): boolean {
  return (
    ["PASS", "FAIL"].includes(evaluation.outcome) &&
    snapshot.state === "known" &&
    snapshot.retainedObservationStatus === "active" &&
    freshAt(snapshot, evaluatedAt)
  );
}

function dynamicReady(
  snapshots: readonly CriterionFactSnapshot[],
  evaluation: CriterionEvaluation,
  context: CriterionEvaluationContext,
  evaluatedAt: string,
): boolean {
  if (
    context.targetGuestCount === null ||
    !Number.isSafeInteger(context.targetGuestCount)
  ) {
    return false;
  }
  const sources = snapshots.filter(
    (item) => item.definition.key === TWO_DANCE_AREAS_MAX_GUEST_KEY,
  );
  if (sources.length !== 1) return false;
  const source = sources[0] as CriterionFactSnapshot;
  return ordinaryReady(source, evaluation, evaluatedAt);
}

function isApplicable(evaluation: CriterionEvaluation): boolean {
  return evaluation.outcome !== "NOT_APPLICABLE";
}

function isCritical(evaluation: CriterionEvaluation): boolean {
  return ["blocking", "important"].includes(evaluation.priority);
}

function criterionReady(
  snapshot: CriterionFactSnapshot,
  evaluation: CriterionEvaluation,
  context: ReadinessContext,
): boolean {
  if (context.evaluatedAt === null) return false;
  return isDerivedTargetGuestDefinition(snapshot.definition)
    ? dynamicReady(
        context.snapshots,
        evaluation,
        context.evaluationContext,
        context.evaluatedAt,
      )
    : ordinaryReady(snapshot, evaluation, context.evaluatedAt);
}

export function calculateEvidenceReadiness(
  snapshots: readonly CriterionFactSnapshot[],
  evaluations: readonly CriterionEvaluation[],
  context: CriterionEvaluationContext,
  evaluatedAtInput: string,
): EvidenceReadiness {
  const snapshotsByKey = new Map(
    snapshots.map((snapshot) => [snapshot.definition.key, snapshot] as const),
  );
  const readinessContext: ReadinessContext = {
    snapshots,
    evaluationContext: context,
    evaluatedAt: normalizeFactInstant(evaluatedAtInput),
  };
  let applicable = 0;
  let ready = 0;
  for (const evaluation of evaluations) {
    if (!isCritical(evaluation) || !isApplicable(evaluation)) continue;
    applicable += 1;
    const snapshot = snapshotsByKey.get(evaluation.key);
    if (snapshot !== undefined && criterionReady(snapshot, evaluation, readinessContext)) {
      ready += 1;
    }
  }
  return {
    evidenceReadiness: applicable === 0 ? null : ready / applicable,
    readyCriteria: ready,
    applicableCriteria: applicable,
  };
}

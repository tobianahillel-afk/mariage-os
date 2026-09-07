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

export function calculateEvidenceReadiness(
  snapshots: readonly CriterionFactSnapshot[],
  evaluations: readonly CriterionEvaluation[],
  context: CriterionEvaluationContext,
  evaluatedAtInput: string,
): EvidenceReadiness {
  const evaluatedAt = normalizeFactInstant(evaluatedAtInput);
  const snapshotsByKey = new Map(
    snapshots.map((snapshot) => [snapshot.definition.key, snapshot] as const),
  );
  let applicable = 0;
  let ready = 0;
  for (const evaluation of evaluations) {
    if (
      !["blocking", "important"].includes(evaluation.priority) ||
      !isApplicable(evaluation)
    ) {
      continue;
    }
    applicable += 1;
    if (evaluatedAt === null) continue;
    const snapshot = snapshotsByKey.get(evaluation.key);
    if (snapshot === undefined) continue;
    const criterionReady = isDerivedTargetGuestDefinition(snapshot.definition)
      ? dynamicReady(snapshots, evaluation, context, evaluatedAt)
      : ordinaryReady(snapshot, evaluation, evaluatedAt);
    if (criterionReady) ready += 1;
  }
  return {
    evidenceReadiness: applicable === 0 ? null : ready / applicable,
    readyCriteria: ready,
    applicableCriteria: applicable,
  };
}

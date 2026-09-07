import type { CriterionEvaluation, CriterionOutcome } from "./criterion-types";

export type BlockingStatus = "PASS" | "UNKNOWN" | "CONFLICT" | "FAIL";

export interface ScoreComponent {
  readonly key: string;
  readonly weight: number;
  readonly contribution: 0 | 1;
  readonly weightedContribution: number;
}

export interface CriterionAggregate {
  readonly blockingStatus: BlockingStatus;
  readonly weightedScore: number | null;
  readonly knownWeightedCriteria: number;
  readonly unknownImportantCriteria: number;
  readonly conflictingCriteria: number;
  readonly scoreComponents: readonly ScoreComponent[];
}

const BLOCKING_RANK: Readonly<Record<BlockingStatus, number>> = {
  PASS: 0,
  UNKNOWN: 1,
  CONFLICT: 2,
  FAIL: 3,
};

function blockingOutcome(outcome: CriterionOutcome): BlockingStatus {
  if (outcome === "FAIL") return "FAIL";
  if (outcome === "CONFLICT") return "CONFLICT";
  if (outcome === "UNKNOWN") return "UNKNOWN";
  return "PASS";
}

function blockingStatus(
  evaluations: readonly CriterionEvaluation[],
): BlockingStatus {
  let status: BlockingStatus = "PASS";
  for (const evaluation of evaluations) {
    if (evaluation.priority !== "blocking") continue;
    const candidate = blockingOutcome(evaluation.outcome);
    if (BLOCKING_RANK[candidate] > BLOCKING_RANK[status]) status = candidate;
  }
  return status;
}

function scoreWeight(evaluation: CriterionEvaluation): number | null {
  if (evaluation.priority !== "important" && evaluation.priority !== "bonus") {
    return null;
  }
  return (
    evaluation.configuredWeight ?? (evaluation.priority === "important" ? 3 : 1)
  );
}

function scoreComponents(
  evaluations: readonly CriterionEvaluation[],
): readonly ScoreComponent[] {
  const components: ScoreComponent[] = [];
  for (const evaluation of evaluations) {
    const weight = scoreWeight(evaluation);
    if (weight === null || !["PASS", "FAIL"].includes(evaluation.outcome))
      continue;
    const contribution: 0 | 1 = evaluation.outcome === "PASS" ? 1 : 0;
    components.push({
      key: evaluation.key,
      weight,
      contribution,
      weightedContribution: contribution * weight,
    });
  }
  return Object.freeze(components);
}

function weightedScore(components: readonly ScoreComponent[]): number | null {
  const denominator = components.reduce((sum, item) => sum + item.weight, 0);
  if (denominator === 0) return null;
  return (
    components.reduce((sum, item) => sum + item.weightedContribution, 0) /
    denominator
  );
}

export function aggregateCriteria(
  evaluations: readonly CriterionEvaluation[],
): CriterionAggregate {
  const components = scoreComponents(evaluations);
  return {
    blockingStatus: blockingStatus(evaluations),
    weightedScore: weightedScore(components),
    knownWeightedCriteria: components.length,
    unknownImportantCriteria: evaluations.filter(
      (item) => item.priority === "important" && item.outcome === "UNKNOWN",
    ).length,
    conflictingCriteria: evaluations.filter(
      (item) => item.outcome === "CONFLICT",
    ).length,
    scoreComponents: components,
  };
}

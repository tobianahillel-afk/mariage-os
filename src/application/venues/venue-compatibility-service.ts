import {
  aggregateCriteria,
  type CriterionAggregate,
} from "@domain/facts/criterion-aggregate";
import {
  calculateEvidenceReadiness,
  type EvidenceReadiness,
} from "@domain/facts/criterion-readiness";
import {
  classifyCriterionGuidance,
  type CriterionGuidance,
} from "@domain/facts/criterion-guidance";
import { evaluateCriteria } from "@domain/facts/criterion-evaluation";
import type { CriterionEvaluation } from "@domain/facts/criterion-types";
import type {
  VenueCompatibilityInputs,
  VenueCompatibilityQueryPort,
} from "./venue-compatibility-query-port";

export interface VenueCompatibilityQuery {
  readonly projectId: string;
  readonly venueId: string;
  readonly evaluatedAt: string;
  readonly targetGuestCountOverride?: number | null;
}

export interface VenueCompatibilityReadModel {
  readonly projectId: string;
  readonly venueId: string;
  readonly evaluatedAt: string;
  readonly targetGuestCount: number | null;
  readonly evaluations: readonly CriterionEvaluation[];
  readonly aggregate: CriterionAggregate;
  readonly readiness: EvidenceReadiness;
  readonly guidance: readonly CriterionGuidance[];
}

function targetGuestCount(
  input: VenueCompatibilityInputs,
  query: VenueCompatibilityQuery,
): number | null {
  return query.targetGuestCountOverride === undefined
    ? input.projectTargetGuestCount
    : query.targetGuestCountOverride;
}

function ensureIdentity(
  input: VenueCompatibilityInputs,
  query: VenueCompatibilityQuery,
): void {
  if (input.projectId !== query.projectId || input.venueId !== query.venueId) {
    throw new Error("Venue compatibility query failed.");
  }
}

function guidanceFor(
  input: VenueCompatibilityInputs,
  evaluations: readonly CriterionEvaluation[],
  evaluatedAt: string,
): readonly CriterionGuidance[] {
  const guidance: CriterionGuidance[] = [];
  input.snapshots.forEach((snapshot, index) => {
    const evaluation = evaluations[index] as CriterionEvaluation;
    guidance.push(
      ...classifyCriterionGuidance(
        snapshot,
        evaluation,
        input.snapshots,
        evaluatedAt,
      ),
    );
  });
  return Object.freeze(guidance);
}

export async function getVenueCompatibility(
  port: VenueCompatibilityQueryPort,
  query: VenueCompatibilityQuery,
): Promise<VenueCompatibilityReadModel | null> {
  const input = await port.loadVenueCompatibilityInputs(
    query.projectId,
    query.venueId,
  );
  if (input === null) return null;
  ensureIdentity(input, query);
  const target = targetGuestCount(input, query);
  const context = { targetGuestCount: target };
  const evaluations = evaluateCriteria(input.snapshots, context);
  return Object.freeze({
    projectId: input.projectId,
    venueId: input.venueId,
    evaluatedAt: query.evaluatedAt,
    targetGuestCount: target,
    evaluations,
    aggregate: aggregateCriteria(evaluations),
    readiness: calculateEvidenceReadiness(
      input.snapshots,
      evaluations,
      context,
      query.evaluatedAt,
    ),
    guidance: guidanceFor(input, evaluations, query.evaluatedAt),
  });
}

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
import { isDynamicGuestSupportSourceDefinition } from "@domain/facts/derived-fact-definition";
import { normalizeFactInstant } from "@domain/facts/fact-observation";
import type {
  CriterionEvaluation,
  CriterionFactSnapshot,
} from "@domain/facts/criterion-types";
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

export type VenueCompatibilityTargetSource = "project" | "explicit_context";
export type VenueCompatibilityFreshness = "fresh" | "stale" | "unknown";

export interface DynamicGuestCountComparison {
  readonly targetGuestCount: number;
  readonly supportMaximumGuestCount: number;
  readonly passes: boolean;
}

export interface DynamicGuestCountExplanation {
  readonly targetGuestCount: number | null;
  readonly targetSource: VenueCompatibilityTargetSource;
  readonly supportSourceKey: "two_dance_areas_max_guest_estimate";
  readonly supportSourceState: CriterionFactSnapshot["state"];
  readonly supportSourceValue: unknown;
  readonly supportSourceObservationStatus: CriterionFactSnapshot["retainedObservationStatus"];
  readonly supportSourceStaleAt: string | null;
  readonly supportSourceFreshness: VenueCompatibilityFreshness;
  readonly ready: boolean;
  readonly outcome: CriterionEvaluation["outcome"];
  readonly reason: CriterionEvaluation["reason"];
  readonly comparison: DynamicGuestCountComparison | null;
}

export interface VenueCompatibilityReadModel {
  readonly projectId: string;
  readonly venueId: string;
  readonly evaluatedAt: string;
  readonly targetGuestCount: number | null;
  readonly targetGuestCountSource: VenueCompatibilityTargetSource;
  readonly evaluations: readonly CriterionEvaluation[];
  readonly aggregate: CriterionAggregate;
  readonly readiness: EvidenceReadiness;
  readonly guidance: readonly CriterionGuidance[];
  readonly dynamicGuestCountExplanation: DynamicGuestCountExplanation | null;
}

interface SelectedTarget {
  readonly value: number | null;
  readonly source: VenueCompatibilityTargetSource;
}

function selectedTarget(
  input: VenueCompatibilityInputs,
  query: VenueCompatibilityQuery,
): SelectedTarget {
  return query.targetGuestCountOverride === undefined
    ? { value: input.projectTargetGuestCount, source: "project" }
    : { value: query.targetGuestCountOverride, source: "explicit_context" };
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

function supportSnapshot(
  snapshots: readonly CriterionFactSnapshot[],
): CriterionFactSnapshot | null {
  const matches = snapshots.filter((snapshot) =>
    isDynamicGuestSupportSourceDefinition(snapshot.definition),
  );
  return matches.length === 1 ? (matches[0] as CriterionFactSnapshot) : null;
}

function supportFreshness(
  source: CriterionFactSnapshot | null,
  evaluatedAt: string,
): VenueCompatibilityFreshness {
  if (source === null) return "unknown";
  const normalizedEvaluation = normalizeFactInstant(evaluatedAt);
  if (normalizedEvaluation === null) return "unknown";
  if (source.staleAt === null) return "fresh";
  const normalizedStaleAt = normalizeFactInstant(source.staleAt);
  if (normalizedStaleAt === null) return "unknown";
  return normalizedStaleAt <= normalizedEvaluation ? "stale" : "fresh";
}

function guestCount(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : null;
}

function comparisonFor(
  target: SelectedTarget,
  source: CriterionFactSnapshot | null,
): DynamicGuestCountComparison | null {
  const targetGuestCount = guestCount(target.value);
  const supportMaximumGuestCount = guestCount(source?.retainedValue);
  if (
    targetGuestCount === null ||
    source?.state !== "known" ||
    supportMaximumGuestCount === null
  ) {
    return null;
  }
  return Object.freeze({
    targetGuestCount,
    supportMaximumGuestCount,
    passes: targetGuestCount <= supportMaximumGuestCount,
  });
}

function dynamicGuestCountExplanation(
  input: VenueCompatibilityInputs,
  evaluations: readonly CriterionEvaluation[],
  target: SelectedTarget,
  evaluatedAt: string,
): DynamicGuestCountExplanation | null {
  const evaluation = evaluations.find(
    (item) => item.key === "target_guest_count_supported",
  );
  if (evaluation === undefined) return null;
  const source = supportSnapshot(input.snapshots);
  const freshness = supportFreshness(source, evaluatedAt);
  const comparison = comparisonFor(target, source);
  const ready =
    comparison !== null &&
    source?.retainedObservationStatus === "active" &&
    freshness === "fresh" &&
    ["PASS", "FAIL"].includes(evaluation.outcome);
  return Object.freeze({
    targetGuestCount: target.value,
    targetSource: target.source,
    supportSourceKey: "two_dance_areas_max_guest_estimate",
    supportSourceState: source?.state ?? null,
    supportSourceValue: source?.retainedValue ?? null,
    supportSourceObservationStatus: source?.retainedObservationStatus ?? null,
    supportSourceStaleAt: source?.staleAt ?? null,
    supportSourceFreshness: freshness,
    ready,
    outcome: evaluation.outcome,
    reason: evaluation.reason,
    comparison,
  });
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
  const target = selectedTarget(input, query);
  const context = { targetGuestCount: target.value };
  const evaluations = evaluateCriteria(input.snapshots, context);
  return Object.freeze({
    projectId: input.projectId,
    venueId: input.venueId,
    evaluatedAt: query.evaluatedAt,
    targetGuestCount: target.value,
    targetGuestCountSource: target.source,
    evaluations,
    aggregate: aggregateCriteria(evaluations),
    readiness: calculateEvidenceReadiness(
      input.snapshots,
      evaluations,
      context,
      query.evaluatedAt,
    ),
    guidance: guidanceFor(input, evaluations, query.evaluatedAt),
    dynamicGuestCountExplanation: dynamicGuestCountExplanation(
      input,
      evaluations,
      target,
      query.evaluatedAt,
    ),
  });
}

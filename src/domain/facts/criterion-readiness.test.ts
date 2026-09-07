import { expect, it } from "vitest";
import { evaluateCriteria } from "./criterion-evaluation";
import { calculateEvidenceReadiness } from "./criterion-readiness";
import type { CriterionDefinition, CriterionFactSnapshot } from "./criterion-types";

function snapshot(
  definition: CriterionDefinition,
  retainedValue: unknown,
  staleAt: string | null = null,
): CriterionFactSnapshot {
  return {
    definition,
    state: "known",
    retainedValue,
    retainedObservationStatus: "active",
    staleAt,
  };
}

const ordinaryDefinition: CriterionDefinition = {
  key: "external_caterer_allowed",
  valueType: "boolean",
  optionsJson: null,
  priority: "blocking",
  weight: null,
  evaluationRuleJson: { type: "boolean_equals", expected: true },
  systemDefined: true,
};

const derivedDefinition: CriterionDefinition = {
  key: "target_guest_count_supported",
  valueType: "boolean",
  optionsJson: null,
  priority: "blocking",
  weight: null,
  evaluationRuleJson: { type: "project_target_guest_count_supported" },
  systemDefined: true,
};

const ceilingDefinition: CriterionDefinition = {
  key: "two_dance_areas_max_guest_estimate",
  valueType: "number",
  optionsJson: { min: 0, integer: true },
  priority: "important",
  weight: null,
  evaluationRuleJson: { type: "number_min", minimum: 0 },
  systemDefined: true,
};

it("counts only active non-stale critical evidence as ready", () => {
  const current = snapshot(ordinaryDefinition, true);
  const evaluations = evaluateCriteria([current], { targetGuestCount: 160 });
  expect(
    calculateEvidenceReadiness(
      [current],
      evaluations,
      { targetGuestCount: 160 },
      "2026-09-07T17:00:00Z",
    ),
  ).toEqual({ evidenceReadiness: 1, readyCriteria: 1, applicableCriteria: 1 });
});

it("keeps stale known outcome but readiness becomes zero", () => {
  const current = snapshot(
    ordinaryDefinition,
    true,
    "2026-09-07T16:00:00Z",
  );
  const evaluations = evaluateCriteria([current], { targetGuestCount: 160 });
  expect(evaluations[0]?.outcome).toBe("PASS");
  expect(
    calculateEvidenceReadiness(
      [current],
      evaluations,
      { targetGuestCount: 160 },
      "2026-09-07T17:00:00Z",
    ).evidenceReadiness,
  ).toBe(0);
});

it("uses source evidence for the derived target-support criterion", () => {
  const derived: CriterionFactSnapshot = {
    definition: derivedDefinition,
    state: null,
    retainedValue: null,
    retainedObservationStatus: null,
    staleAt: null,
  };
  const ceiling = snapshot(ceilingDefinition, 170);
  const snapshots = [derived, ceiling];
  const context = { targetGuestCount: 160 };
  const evaluations = evaluateCriteria(snapshots, context);
  expect(calculateEvidenceReadiness(
    snapshots,
    evaluations,
    context,
    "2026-09-07T17:00:00Z",
  )).toEqual({ evidenceReadiness: 1, readyCriteria: 2, applicableCriteria: 2 });
});

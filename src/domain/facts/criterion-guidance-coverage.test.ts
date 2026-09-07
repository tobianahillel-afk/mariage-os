import { describe, expect, it } from "vitest";
import { evaluateCriterion } from "./criterion-evaluation";
import { classifyCriterionGuidance } from "./criterion-guidance";
import type {
  CriterionDefinition,
  CriterionFactSnapshot,
} from "./criterion-types";

const EVALUATED_AT = "2026-09-07T18:00:00Z";

function definition(
  key: string,
  overrides: Partial<CriterionDefinition> = {},
): CriterionDefinition {
  return {
    key,
    valueType: "boolean",
    unit: null,
    optionsJson: null,
    priority: "important",
    weight: null,
    evaluationRuleJson: { type: "boolean_equals", expected: true },
    systemDefined: false,
    ...overrides,
  };
}

function snapshot(
  current: CriterionDefinition,
  overrides: Partial<CriterionFactSnapshot> = {},
): CriterionFactSnapshot {
  return {
    definition: current,
    state: "known",
    retainedValue: true,
    retainedObservationStatus: "active",
    staleAt: null,
    ...overrides,
  };
}

function guidance(
  current: CriterionFactSnapshot,
  snapshots: readonly CriterionFactSnapshot[] = [current],
) {
  const evaluation = evaluateCriterion(current, snapshots, {
    targetGuestCount: 160,
  });
  return classifyCriterionGuidance(
    current,
    evaluation,
    snapshots,
    EVALUATED_AT,
  );
}

describe("criterion guidance freshness boundaries", () => {
  it("reports malformed retained freshness as configuration incomplete", () => {
    const current = snapshot(definition("parking"), {
      staleAt: "not-an-instant",
    });
    expect(guidance(current)).toEqual([
      { key: "parking", kind: "configuration_incomplete" },
    ]);
  });

  it("does not report evidence that is still fresh", () => {
    const current = snapshot(definition("parking"), {
      staleAt: "2026-09-07T19:00:00Z",
    });
    expect(guidance(current)).toEqual([]);
  });
});

describe("criterion guidance derived-source boundaries", () => {
  it("keeps derived configuration guidance when no evidence source exists", () => {
    const derived = snapshot(
      definition("target_guest_count_supported", {
        priority: "blocking",
        systemDefined: true,
        evaluationRuleJson: { type: "project_target_guest_count_supported" },
      }),
      { state: null, retainedValue: null, retainedObservationStatus: null },
    );
    expect(guidance(derived)).toEqual([
      { key: "target_guest_count_supported", kind: "configuration_incomplete" },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { evaluateCriteria } from "./criterion-evaluation";
import { calculateEvidenceReadiness } from "./criterion-readiness";
import type {
  CriterionDefinition,
  CriterionEvaluation,
  CriterionFactSnapshot,
} from "./criterion-types";

const EVALUATED_AT = "2026-09-07T17:00:00Z";

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

function passEvaluation(key: string): CriterionEvaluation {
  return {
    key,
    priority: "important",
    configuredWeight: null,
    outcome: "PASS",
    reason: "rule_pass",
    actual: true,
    target: true,
  };
}

const derivedDefinition = definition("target_guest_count_supported", {
  valueType: "boolean",
  priority: "blocking",
  systemDefined: true,
  evaluationRuleJson: { type: "project_target_guest_count_supported" },
});
const ceilingDefinition = definition("two_dance_areas_max_guest_estimate", {
  valueType: "number",
  unit: "people",
  optionsJson: { min: 0, integer: true },
  systemDefined: true,
  evaluationRuleJson: { type: "number_min", minimum: 0 },
});

describe("criterion readiness invalid context", () => {
  it("fails closed for an invalid evaluation instant", () => {
    const current = snapshot(definition("parking"));
    const evaluations = evaluateCriteria([current], { targetGuestCount: 160 });
    expect(
      calculateEvidenceReadiness(
        [current],
        evaluations,
        { targetGuestCount: 160 },
        "not-an-instant",
      ).evidenceReadiness,
    ).toBe(0);
  });

  it.each([null, 160.5])("does not ready derived target for %#", (target) => {
    const derived = snapshot(derivedDefinition, { state: null, retainedValue: null });
    const ceiling = snapshot(ceilingDefinition, { retainedValue: 170 });
    const snapshots = [derived, ceiling];
    const context = { targetGuestCount: target };
    const evaluations = evaluateCriteria(snapshots, context);
    expect(
      calculateEvidenceReadiness(snapshots, evaluations, context, EVALUATED_AT),
    ).toEqual({ evidenceReadiness: 0.5, readyCriteria: 1, applicableCriteria: 2 });
  });
});

describe("criterion readiness structural fail-closed cases", () => {
  it("does not ready a derived criterion without exactly one source", () => {
    const derived = snapshot(derivedDefinition, { state: null, retainedValue: null });
    const evaluations = evaluateCriteria([derived], { targetGuestCount: 160 });
    expect(
      calculateEvidenceReadiness(
        [derived],
        evaluations,
        { targetGuestCount: 160 },
        EVALUATED_AT,
      ).evidenceReadiness,
    ).toBe(0);
  });

  it("does not infer readiness when an evaluation key has no snapshot", () => {
    expect(
      calculateEvidenceReadiness(
        [],
        [passEvaluation("missing")],
        { targetGuestCount: 160 },
        EVALUATED_AT,
      ),
    ).toEqual({ evidenceReadiness: 0, readyCriteria: 0, applicableCriteria: 1 });
  });
});

describe("criterion readiness evidence boundaries", () => {
  it.each([
    ["unknown", "active", null],
    ["known", "withdrawn", null],
    ["known", "active", "not-an-instant"],
  ] as const)("rejects unsafe evidence %#", (state, status, staleAt) => {
    const current = snapshot(definition("parking"), {
      state,
      retainedObservationStatus: status,
      staleAt,
    });
    expect(
      calculateEvidenceReadiness(
        [current],
        [passEvaluation("parking")],
        { targetGuestCount: 160 },
        EVALUATED_AT,
      ).evidenceReadiness,
    ).toBe(0);
  });

  it("accepts evidence whose stale boundary is still in the future", () => {
    const current = snapshot(definition("parking"), {
      staleAt: "2026-09-07T18:00:00Z",
    });
    expect(
      calculateEvidenceReadiness(
        [current],
        [passEvaluation("parking")],
        { targetGuestCount: 160 },
        EVALUATED_AT,
      ).evidenceReadiness,
    ).toBe(1);
  });
});

describe("criterion readiness applicability", () => {
  it("returns null when no critical criterion is applicable", () => {
    const bonus = snapshot(definition("panorama", { priority: "bonus" }));
    const na = snapshot(definition("parking"), { state: "not_applicable" });
    const evaluations = evaluateCriteria([bonus, na], { targetGuestCount: 160 });
    expect(
      calculateEvidenceReadiness(
        [bonus, na],
        evaluations,
        { targetGuestCount: 160 },
        EVALUATED_AT,
      ),
    ).toEqual({ evidenceReadiness: null, readyCriteria: 0, applicableCriteria: 0 });
  });
});

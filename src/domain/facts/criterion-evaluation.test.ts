import { describe, expect, it } from "vitest";
import { evaluateCriterion } from "./criterion-evaluation";
import type {
  CriterionDefinition,
  CriterionFactSnapshot,
} from "./criterion-types";

function definition(
  key: string,
  overrides: Partial<CriterionDefinition> = {},
): CriterionDefinition {
  return {
    key,
    valueType: "boolean",
    optionsJson: null,
    priority: "blocking",
    weight: null,
    evaluationRuleJson: { type: "boolean_equals", expected: true },
    systemDefined: false,
    ...overrides,
  };
}

function snapshot(
  current: CriterionDefinition,
  state: CriterionFactSnapshot["state"],
  retainedValue: unknown,
): CriterionFactSnapshot {
  return {
    definition: current,
    state,
    retainedValue,
    retainedObservationStatus: "active",
    staleAt: null,
  };
}

describe("ordinary criterion evaluation", () => {
  it("keeps false distinct and applies rule direction", () => {
    const item = snapshot(
      definition("external_caterer_allowed"),
      "known",
      false,
    );
    expect(
      evaluateCriterion(item, [item], { targetGuestCount: 160 }),
    ).toMatchObject({
      outcome: "FAIL",
      reason: "rule_fail",
      actual: false,
      target: true,
    });
  });

  it.each([
    [null, "UNKNOWN", "missing_fact"],
    ["unknown", "UNKNOWN", "unknown_fact"],
    ["conflict", "CONFLICT", "conflict"],
    ["not_applicable", "NOT_APPLICABLE", "not_applicable"],
  ] as const)("maps fact state %s", (state, outcome, reason) => {
    const item = snapshot(definition("rain_plan"), state, null);
    expect(
      evaluateCriterion(item, [item], { targetGuestCount: 160 }),
    ).toMatchObject({
      outcome,
      reason,
    });
  });

  it("supports exact custom manual assessment", () => {
    const item = snapshot(
      definition("two_dance_areas_feasible", {
        evaluationRuleJson: {
          type: "custom_manual_assessment",
          accepted: true,
        },
      }),
      "known",
      true,
    );
    expect(
      evaluateCriterion(item, [item], { targetGuestCount: 160 }).outcome,
    ).toBe("PASS");
  });
});

describe("dynamic guest-count evaluation", () => {
  const derived = snapshot(
    definition("target_guest_count_supported", {
      systemDefined: true,
      evaluationRuleJson: { type: "project_target_guest_count_supported" },
    }),
    null,
    null,
  );
  const ceilingDefinition = definition("two_dance_areas_max_guest_estimate", {
    valueType: "number",
    optionsJson: { min: 0, integer: true },
    priority: "important",
    evaluationRuleJson: { type: "number_min", minimum: 0 },
    systemDefined: true,
  });

  it.each([
    [169, "PASS"],
    [170, "PASS"],
    [171, "FAIL"],
  ] as const)("compares target %i inclusively", (targetGuestCount, outcome) => {
    const ceiling = snapshot(ceilingDefinition, "known", 170);
    expect(
      evaluateCriterion(derived, [derived, ceiling], { targetGuestCount }),
    ).toMatchObject({ outcome, actual: 170, target: targetGuestCount });
  });

  it("fails safe for absent target and source conflict", () => {
    const ceiling = snapshot(ceilingDefinition, "conflict", null);
    expect(
      evaluateCriterion(derived, [derived, ceiling], { targetGuestCount: null })
        .reason,
    ).toBe("missing_target_guest_count");
    expect(
      evaluateCriterion(derived, [derived, ceiling], { targetGuestCount: 170 })
        .outcome,
    ).toBe("CONFLICT");
  });

  it("never falls back to advertised capacity", () => {
    const advertised = snapshot(
      definition("capacity_seated_advertised", {
        valueType: "number",
        priority: "important",
        evaluationRuleJson: { type: "number_min", minimum: 1 },
      }),
      "known",
      500,
    );
    expect(
      evaluateCriterion(derived, [derived, advertised], {
        targetGuestCount: 160,
      }),
    ).toMatchObject({ outcome: "UNKNOWN", reason: "configuration_incomplete" });
  });
});

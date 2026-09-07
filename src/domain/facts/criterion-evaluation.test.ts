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
    unit: null,
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
    ).toMatchObject({ outcome, reason });
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
    unit: "people",
    optionsJson: { min: 0, integer: true },
    priority: "important",
    evaluationRuleJson: { type: "number_min", minimum: 0 },
    systemDefined: true,
  });

  it.each([
    [0, "PASS"],
    [169, "PASS"],
    [170, "PASS"],
    [171, "FAIL"],
  ] as const)("compares target %i inclusively", (targetGuestCount, outcome) => {
    const ceiling = snapshot(ceilingDefinition, "known", 170);
    expect(
      evaluateCriterion(derived, [derived, ceiling], { targetGuestCount }),
    ).toMatchObject({ outcome, actual: 170, target: targetGuestCount });
  });

  it.each([
    ["unknown", "UNKNOWN", "missing_support_ceiling"],
    ["not_applicable", "UNKNOWN", "support_ceiling_not_applicable"],
    ["conflict", "CONFLICT", "conflict"],
  ] as const)("maps support source state %s", (state, outcome, reason) => {
    const ceiling = snapshot(ceilingDefinition, state, null);
    expect(
      evaluateCriterion(derived, [derived, ceiling], { targetGuestCount: 170 }),
    ).toMatchObject({ outcome, reason });
  });

  it("fails safe for absent target and malformed source value", () => {
    const ceiling = snapshot(ceilingDefinition, "known", 170.5);
    expect(
      evaluateCriterion(derived, [derived, ceiling], { targetGuestCount: null })
        .reason,
    ).toBe("missing_target_guest_count");
    expect(
      evaluateCriterion(derived, [derived, ceiling], { targetGuestCount: 170 }),
    ).toMatchObject({ outcome: "UNKNOWN", reason: "invalid_support_ceiling" });
  });

  it("requires the exact system support-source definition", () => {
    const wrongUnit = snapshot(
      { ...ceilingDefinition, unit: null },
      "known",
      500,
    );
    expect(
      evaluateCriterion(derived, [derived, wrongUnit], {
        targetGuestCount: 160,
      }),
    ).toMatchObject({ outcome: "UNKNOWN", reason: "configuration_incomplete" });
  });

  it("never falls back to advertised capacity", () => {
    const advertised = snapshot(
      definition("capacity_seated_advertised", {
        valueType: "number",
        unit: "people",
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

  it("ignores a legacy retained value on the derived criterion", () => {
    const legacyDerived = {
      ...derived,
      state: "known" as const,
      retainedValue: false,
    };
    const ceiling = snapshot(ceilingDefinition, "known", 170);
    expect(
      evaluateCriterion(legacyDerived, [legacyDerived, ceiling], {
        targetGuestCount: 160,
      }),
    ).toMatchObject({ outcome: "PASS", actual: 170, target: 160 });
  });
});

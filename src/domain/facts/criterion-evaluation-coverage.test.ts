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
  retainedValue: unknown,
): CriterionFactSnapshot {
  return {
    definition: current,
    state: "known",
    retainedValue,
    retainedObservationStatus: "active",
    staleAt: null,
  };
}

const derived = snapshot(
  definition("target_guest_count_supported", {
    systemDefined: true,
    evaluationRuleJson: { type: "project_target_guest_count_supported" },
  }),
  null,
);

const ceiling = snapshot(
  definition("two_dance_areas_max_guest_estimate", {
    valueType: "number",
    unit: "people",
    optionsJson: { min: 0, integer: true },
    priority: "important",
    systemDefined: true,
    evaluationRuleJson: { type: "number_min", minimum: 0 },
  }),
  170,
);

describe("criterion evaluation invalid dynamic inputs", () => {
  it.each([-1, 160.5])("rejects invalid target guest count %#", (target) => {
    expect(
      evaluateCriterion(derived, [derived, ceiling], {
        targetGuestCount: target,
      }),
    ).toMatchObject({
      outcome: "UNKNOWN",
      reason: "invalid_target_guest_count",
    });
  });

  it("requires the exact derived definition for the dynamic rule", () => {
    const wrong = snapshot(
      definition("other_boolean", {
        systemDefined: true,
        evaluationRuleJson: { type: "project_target_guest_count_supported" },
      }),
      true,
    );
    expect(
      evaluateCriterion(wrong, [wrong, ceiling], { targetGuestCount: 160 }),
    ).toMatchObject({ outcome: "UNKNOWN", reason: "configuration_incomplete" });
  });
});

describe("criterion evaluation invalid ordinary inputs", () => {
  it("rejects a retained value outside the definition type", () => {
    const item = snapshot(definition("rain_plan"), "yes");
    expect(
      evaluateCriterion(item, [item], { targetGuestCount: 160 }),
    ).toMatchObject({ outcome: "UNKNOWN", reason: "invalid_retained_value" });
  });

  it("rejects an invalid evaluation rule before evaluation", () => {
    const item = snapshot(
      definition("rain_plan", {
        evaluationRuleJson: { type: "boolean_equals", expected: "yes" },
      }),
      true,
    );
    expect(
      evaluateCriterion(item, [item], { targetGuestCount: 160 }),
    ).toMatchObject({ outcome: "UNKNOWN", reason: "configuration_incomplete" });
  });
});

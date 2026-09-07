import { describe, expect, it } from "vitest";
import { evaluateCriterion } from "./criterion-evaluation";
import { classifyCriterionGuidance } from "./criterion-guidance";
import type { FactObservationStatus } from "./fact-evidence-types";
import type {
  CriterionDefinition,
  CriterionFactSnapshot,
} from "./criterion-types";

const EVALUATED_AT = "2026-09-07T18:00:00Z";

interface SnapshotEvidence {
  readonly retainedObservationStatus?: FactObservationStatus | null;
  readonly staleAt?: string | null;
}

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
  state: CriterionFactSnapshot["state"],
  retainedValue: unknown,
  evidence: SnapshotEvidence = {},
): CriterionFactSnapshot {
  return {
    definition: current,
    state,
    retainedValue,
    retainedObservationStatus:
      evidence.retainedObservationStatus === undefined
        ? "active"
        : evidence.retainedObservationStatus,
    staleAt: evidence.staleAt ?? null,
  };
}

function kinds(
  item: CriterionFactSnapshot,
  snapshots: readonly CriterionFactSnapshot[] = [item],
): readonly string[] {
  const evaluation = evaluateCriterion(item, snapshots, {
    targetGuestCount: 160,
  });
  return classifyCriterionGuidance(
    item,
    evaluation,
    snapshots,
    EVALUATED_AT,
  ).map((guidance) => guidance.kind);
}

describe("criterion guidance classification", () => {
  it("can expose missing information and missing evidence together", () => {
    const item = snapshot(definition("rain_plan"), null, null, {
      retainedObservationStatus: null,
    });
    expect(kinds(item)).toEqual([
      "missing_or_unknown",
      "retained_evidence_missing_or_non_active",
    ]);
  });

  it("classifies conflict, staleness, evidence and configuration", () => {
    const conflict = snapshot(definition("parking"), "conflict", null);
    const stale = snapshot(definition("music_until"), "known", true, {
      staleAt: EVALUATED_AT,
    });
    const inactive = snapshot(definition("accommodation"), "known", true, {
      retainedObservationStatus: "withdrawn",
    });
    const malformed = snapshot(
      definition("access", { evaluationRuleJson: null }),
      "known",
      true,
    );
    expect(kinds(conflict)).toEqual(["conflicting"]);
    expect(kinds(stale)).toEqual(["stale"]);
    expect(kinds(inactive)).toEqual([
      "retained_evidence_missing_or_non_active",
    ]);
    expect(kinds(malformed)).toEqual(["configuration_incomplete"]);
  });

  it("excludes explicit not-applicable and non-critical criteria", () => {
    const notApplicable = snapshot(
      definition("parking"),
      "not_applicable",
      null,
    );
    const bonus = snapshot(
      definition("panorama", { priority: "bonus" }),
      "unknown",
      null,
    );
    expect(kinds(notApplicable)).toEqual([]);
    expect(kinds(bonus)).toEqual([]);
  });
});

describe("criterion guidance derived evidence", () => {
  it("uses source evidence for the derived guest-count criterion", () => {
    const derived = snapshot(
      definition("target_guest_count_supported", {
        valueType: "boolean",
        unit: null,
        priority: "blocking",
        systemDefined: true,
        evaluationRuleJson: { type: "project_target_guest_count_supported" },
      }),
      null,
      null,
      { retainedObservationStatus: null },
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
      "known",
      170,
      { staleAt: "2026-09-07T17:00:00Z" },
    );
    expect(kinds(derived, [derived, ceiling])).toEqual(["stale"]);
  });

  it("reports malformed evaluation instant as configuration incomplete", () => {
    const item = snapshot(definition("rain_plan"), "known", true);
    const evaluation = evaluateCriterion(item, [item], {
      targetGuestCount: 160,
    });
    expect(
      classifyCriterionGuidance(item, evaluation, [item], "not-an-instant"),
    ).toEqual([{ key: "rain_plan", kind: "configuration_incomplete" }]);
  });
});

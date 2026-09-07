import { expect, it } from "vitest";
import { aggregateCriteria } from "./criterion-aggregate";
import type { CriterionEvaluation } from "./criterion-types";

function item(
  key: string,
  outcome: CriterionEvaluation["outcome"],
  priority: CriterionEvaluation["priority"],
  configuredWeight: number | null = null,
): CriterionEvaluation {
  return {
    key,
    outcome,
    priority,
    configuredWeight,
    reason: outcome === "PASS" ? "rule_pass" : "rule_fail",
    actual: null,
    target: null,
  };
}

it("never lets weighted score hide a blocking failure", () => {
  const aggregate = aggregateCriteria([
    item("blocker", "FAIL", "blocking"),
    item("important", "PASS", "important"),
    item("bonus", "PASS", "bonus"),
  ]);
  expect(aggregate.blockingStatus).toBe("FAIL");
  expect(aggregate.weightedScore).toBe(1);
  expect(aggregate.scoreComponents).toEqual([
    { key: "important", weight: 3, contribution: 1, weightedContribution: 3 },
    { key: "bonus", weight: 1, contribution: 1, weightedContribution: 1 },
  ]);
});

it("uses FAIL > CONFLICT > UNKNOWN > PASS blocking severity", () => {
  expect(
    aggregateCriteria([
      item("unknown", "UNKNOWN", "blocking"),
      item("conflict", "CONFLICT", "blocking"),
    ]).blockingStatus,
  ).toBe("CONFLICT");
});

it("returns null score for zero denominator", () => {
  expect(aggregateCriteria([item("only", "UNKNOWN", "important")]).weightedScore).toBeNull();
});

it("reconstructs weighted pass/fail score", () => {
  const aggregate = aggregateCriteria([
    item("a", "PASS", "important", 2),
    item("b", "FAIL", "bonus", 1),
  ]);
  expect(aggregate.weightedScore).toBeCloseTo(2 / 3);
  expect(aggregate.knownWeightedCriteria).toBe(2);
});

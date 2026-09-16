import assert from "node:assert/strict";
import {
  cpuMicrosecondsToMilliseconds,
  metricEvidence,
  metricsPass,
} from "./private-document-ar006-metrics.mjs";

const CPU_BUDGET_MS = 10;
const INVOCATION_COUNT = 10;

function row(index, cpuTimeP50, cpuTimeP99) {
  return {
    dimensions: {
      datetime: `2026-09-16T08:00:${String(index).padStart(2, "0")}Z`,
      status: "success",
    },
    sum: { requests: 1, errors: 0 },
    quantiles: { cpuTimeP50, cpuTimeP99 },
  };
}

assert.equal(cpuMicrosecondsToMilliseconds(9_999), 9.999);
assert.equal(cpuMicrosecondsToMilliseconds(10_000), 10);
assert.equal(cpuMicrosecondsToMilliseconds(10_001), 10.001);
assert.equal(cpuMicrosecondsToMilliseconds("not-a-number"), null);

const withinBudget = metricEvidence(
  Array.from({ length: INVOCATION_COUNT }, (_, index) =>
    row(index, 9_999, 10_000),
  ),
);

assert.equal(withinBudget[0].cpuTimeP50Us, 9_999);
assert.equal(withinBudget[0].cpuTimeP99Us, 10_000);
assert.equal(withinBudget[0].cpuTimeP50Ms, 9.999);
assert.equal(withinBudget[0].cpuTimeP99Ms, 10);
assert.equal(metricsPass(withinBudget, INVOCATION_COUNT, CPU_BUDGET_MS), true);

const overBudget = metricEvidence([
  ...Array.from({ length: INVOCATION_COUNT - 1 }, (_, index) =>
    row(index, 9_999, 10_000),
  ),
  row(INVOCATION_COUNT - 1, 10_000, 10_001),
]);

assert.equal(metricsPass(overBudget, INVOCATION_COUNT, CPU_BUDGET_MS), false);

console.log("AR-006 CPU unit controls passed.");

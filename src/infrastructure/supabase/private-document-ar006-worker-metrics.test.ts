import { describe, expect, it } from "vitest";
import {
  CPU_BUDGET_MS,
  evaluateAr006WorkerEvents,
} from "../../../scripts/private-document-ar006-worker-metrics.mjs";
import { workerEvidenceTimeframe } from "../../../scripts/private-document-ar006-observability-timeframe.mjs";

const evidenceId = "8b6d1122-bc15-4f17-a5bd-bcec57fcc0c6";
const requestId = "c91e2d6a-4eb1-4b72-9d43-873ae7bc2fd3";
const scriptName = "mariage-os-private-document-promotion";

function marker() {
  return {
    $metadata: {
      message: JSON.stringify({
        event: "mariage-os.ar006.promotion",
        evidenceId,
        status: 200,
      }),
    },
    $workers: { scriptName, requestId },
  };
}

function invocation(cpuTimeMs = CPU_BUDGET_MS) {
  return {
    $metadata: { type: "cf-worker-event" },
    $workers: {
      scriptName,
      requestId,
      cpuTimeMs,
      statusCode: 200,
      outcome: "ok",
    },
  };
}

describe("AR-006 Worker provider-event correlation", () => {
  it("uses numeric Unix-millisecond bounds for the Observability API", () => {
    const timeframe = workerEvidenceTimeframe(
      "2026-09-17T17:10:00.000Z",
      "2026-09-17T17:10:30.000Z",
    );
    expect(timeframe).toEqual({
      request: { from: 1_789_664_990_000, to: 1_789_665_030_000 },
      record: {
        from: "2026-09-17T17:09:50.000Z",
        to: "2026-09-17T17:10:30.000Z",
      },
    });
  });

  it("requires one opaque marker and one numeric invocation log", () => {
    const result = evaluateAr006WorkerEvents(
      [marker(), invocation()],
      [evidenceId],
      scriptName,
    );
    expect(result.pass).toBe(true);
    expect(result.measurements).toEqual([
      expect.objectContaining({
        evidenceId,
        workerRequestId: requestId,
        cpuTimeMs: CPU_BUDGET_MS,
        withinFreeCpuBudget: true,
      }),
    ]);
  });

  it("fails closed for a missing invocation or a CPU over the Free budget", () => {
    expect(
      evaluateAr006WorkerEvents([marker()], [evidenceId], scriptName).pass,
    ).toBe(false);
    expect(
      evaluateAr006WorkerEvents(
        [marker(), invocation(CPU_BUDGET_MS + 0.1)],
        [evidenceId],
        scriptName,
      ).pass,
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  AR006_EVIDENCE_COUNT,
  DURABLE_OBJECT_CPU_BUDGET_MS,
  INGRESS_CPU_BUDGET_MS,
  evaluateAr006TwoSurfaceEvents,
} from "../../../scripts/private-document-ar006-two-surface-metrics.mjs";

const ingressScript = "mariage-os-ar006-ingress";
const workerScript = "mariage-os-private-document-promotion";
const ingressVersion = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const workerVersion = "11111111-2222-4333-8444-555555555555";

function evidenceId(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function marker(
  id: string,
  requestId: string,
  scriptName: string,
  surface: "worker-ingress" | "durable-object",
) {
  return {
    source: {
      event: "mariage-os.ar006.promotion",
      surface,
      evidenceId: id,
      status: 200,
    },
    $workers: { scriptName, requestId },
  };
}

function invocation({
  requestId,
  scriptName,
  executionModel,
  cpuTimeMs,
  durableObjectId = null,
  scriptVersionId,
}: {
  requestId: string;
  scriptName: string;
  executionModel: "stateless" | "durableObject";
  cpuTimeMs: number | null | string;
  durableObjectId?: string | null;
  scriptVersionId: string;
}) {
  return {
    $metadata: { type: "cf-worker-event", statusCode: 200 },
    $workers: {
      scriptName,
      requestId,
      executionModel,
      eventType: "fetch",
      outcome: "ok",
      cpuTimeMs,
      durableObjectId,
      scriptVersion: { id: scriptVersionId },
    },
  };
}

function fixture(count: number = AR006_EVIDENCE_COUNT) {
  const ids = Array.from({ length: count }, (_, index) => evidenceId(index + 1));
  const ingressEvents: unknown[] = [];
  const durableObjectEvents: unknown[] = [];
  ids.forEach((id, index) => {
    const ingressRequestId = `ingress-${index + 1}`;
    const durableRequestId = `do-${index + 1}`;
    ingressEvents.push(
      marker(id, ingressRequestId, ingressScript, "worker-ingress"),
      invocation({
        requestId: ingressRequestId,
        scriptName: ingressScript,
        executionModel: "stateless",
        cpuTimeMs: INGRESS_CPU_BUDGET_MS,
        scriptVersionId: ingressVersion,
      }),
    );
    durableObjectEvents.push(
      marker(id, durableRequestId, workerScript, "durable-object"),
      invocation({
        requestId: durableRequestId,
        scriptName: workerScript,
        executionModel: "durableObject",
        cpuTimeMs: 250,
        durableObjectId: `do-object-${index + 1}`,
        scriptVersionId: workerVersion,
      }),
    );
  });
  return { ids, ingressEvents, durableObjectEvents };
}

function evaluate(data = fixture()) {
  return evaluateAr006TwoSurfaceEvents({
    ingressEvents: data.ingressEvents,
    durableObjectEvents: data.durableObjectEvents,
    expectedEvidenceIds: data.ids,
    ingressScriptName: ingressScript,
    durableObjectScriptName: workerScript,
    ingressVersionId: ingressVersion,
    durableObjectVersionId: workerVersion,
  });
}

function workerFields(events: unknown[], index: number): Record<string, unknown> {
  const event = events[index];
  if (typeof event !== "object" || event === null || !("$workers" in event)) {
    throw new Error("Synthetic event is missing worker fields.");
  }
  return event.$workers as Record<string, unknown>;
}

describe("ADR 0013 two-surface CPU evaluator success", () => {
  it("requires ten complete ingress and Durable Object measurements", () => {
    const result = evaluate();
    expect(result.pass).toBe(true);
    expect(result.ingress.measurements).toHaveLength(AR006_EVIDENCE_COUNT);
    expect(result.durableObject.measurements).toHaveLength(
      AR006_EVIDENCE_COUNT,
    );
    expect(result.ingress.measurements[0]).toEqual(
      expect.objectContaining({
        executionModel: "stateless",
        cpuTimeMs: INGRESS_CPU_BUDGET_MS,
        scriptVersionId: ingressVersion,
      }),
    );
  });
});

describe("ADR 0013 two-surface fail-closed checks", () => {
  it("rejects missing DO invocation and reused DO identity", () => {
    const missing = fixture();
    missing.durableObjectEvents.pop();
    expect(evaluate(missing).pass).toBe(false);

    const reused = fixture();
    const first = workerFields(reused.durableObjectEvents, 1);
    const second = workerFields(reused.durableObjectEvents, 3);
    second.durableObjectId = first.durableObjectId;
    expect(evaluate(reused).pass).toBe(false);
  });

  it("rejects CPU over either provider budget", () => {
    const ingress = fixture();
    workerFields(ingress.ingressEvents, 1).cpuTimeMs =
      INGRESS_CPU_BUDGET_MS + 0.001;
    expect(evaluate(ingress).pass).toBe(false);

    const durable = fixture();
    workerFields(durable.durableObjectEvents, 1).cpuTimeMs =
      DURABLE_OBJECT_CPU_BUDGET_MS + 0.001;
    expect(evaluate(durable).pass).toBe(false);
  });

  it("rejects exceeded CPU, nonnumeric CPU and wrong execution model", () => {
    const exceeded = fixture();
    workerFields(exceeded.durableObjectEvents, 1).outcome = "exceededCpu";
    expect(evaluate(exceeded).pass).toBe(false);

    const nonnumeric = fixture();
    workerFields(nonnumeric.ingressEvents, 1).cpuTimeMs = "5";
    expect(evaluate(nonnumeric).pass).toBe(false);

    const wrongModel = fixture();
    workerFields(wrongModel.durableObjectEvents, 1).executionModel = "stateless";
    expect(evaluate(wrongModel).pass).toBe(false);
  });

  it("rejects wrong script version and fewer than ten promotions", () => {
    const version = fixture();
    workerFields(version.ingressEvents, 1).scriptVersion = {
      id: "ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb",
    };
    expect(evaluate(version).pass).toBe(false);
    expect(evaluate(fixture(AR006_EVIDENCE_COUNT - 1)).pass).toBe(false);
  });
});

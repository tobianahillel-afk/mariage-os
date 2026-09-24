import { describe, expect, it } from "vitest";
import {
  DURABLE_OBJECT_CPU_BUDGET_MS,
  PAGES_CPU_BUDGET_MS,
  evaluateAr006TwoSurfaceEvents,
} from "../../../scripts/private-document-ar006-two-surface-metrics.mjs";

const pagesScript = "pages-worker--isolated-preview";
const workerScript = "mariage-os-private-document-promotion";

function evidenceId(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function marker(
  id: string,
  requestId: string,
  scriptName: string,
  surface: "pages-ingress" | "durable-object",
) {
  return {
    $metadata: {
      message: JSON.stringify({
        event: "mariage-os.ar006.promotion",
        surface,
        evidenceId: id,
        status: 200,
      }),
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
  metadataRequestId = false,
}: {
  requestId: string;
  scriptName: string;
  executionModel: "stateless" | "durableObject";
  cpuTimeMs: number | null | string;
  durableObjectId?: string | null;
  metadataRequestId?: boolean;
}) {
  return {
    $metadata: {
      type: "cf-worker-event",
      statusCode: 200,
      ...(metadataRequestId ? { requestId } : {}),
    },
    $workers: {
      scriptName,
      ...(metadataRequestId ? {} : { requestId }),
      executionModel,
      eventType: "fetch",
      outcome: "ok",
      cpuTimeMs,
      durableObjectId,
    },
  };
}

function fixture(count = 10) {
  const ids = Array.from({ length: count }, (_, index) => evidenceId(index + 1));
  const pagesEvents: unknown[] = [];
  const durableObjectEvents: unknown[] = [];
  ids.forEach((id, index) => {
    const pagesRequestId = `pages-${index + 1}`;
    const durableRequestId = `do-${index + 1}`;
    pagesEvents.push(
      marker(id, pagesRequestId, pagesScript, "pages-ingress"),
      invocation({
        requestId: pagesRequestId,
        scriptName: pagesScript,
        executionModel: "stateless",
        cpuTimeMs: PAGES_CPU_BUDGET_MS,
        metadataRequestId: index === 0,
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
      }),
    );
  });
  return { ids, pagesEvents, durableObjectEvents };
}

function evaluate(data = fixture()) {
  return evaluateAr006TwoSurfaceEvents({
    pagesEvents: data.pagesEvents,
    durableObjectEvents: data.durableObjectEvents,
    expectedEvidenceIds: data.ids,
    pagesScriptName: pagesScript,
    durableObjectScriptName: workerScript,
  });
}

describe("ADR 0012 two-surface CPU evaluator success", () => {
  it("requires ten complete stateless Pages and Durable Object measurements", () => {
    const result = evaluate();
    expect(result.pass).toBe(true);
    expect(result.pages.measurements).toHaveLength(10);
    expect(result.durableObject.measurements).toHaveLength(10);
    expect(result.pages.measurements[0]).toEqual(
      expect.objectContaining({
        executionModel: "stateless",
        cpuTimeMs: PAGES_CPU_BUDGET_MS,
      }),
    );
    expect(result.durableObject.measurements[0]).toEqual(
      expect.objectContaining({
        executionModel: "durableObject",
        cpuBudgetMs: DURABLE_OBJECT_CPU_BUDGET_MS,
      }),
    );
  });
});

describe("ADR 0012 two-surface CPU evaluator failures", () => {
  it("rejects a missing Durable Object invocation", () => {
    const data = fixture();
    data.durableObjectEvents.pop();
    expect(evaluate(data).pass).toBe(false);
  });

  it("rejects wrong execution models and missing Durable Object identity", () => {
    const data = fixture(1);
    const invocationEvent = data.durableObjectEvents[1] as {
      $workers: Record<string, unknown>;
    };
    invocationEvent.$workers.executionModel = "stateless";
    invocationEvent.$workers.durableObjectId = null;
    expect(evaluate(data).pass).toBe(false);
  });

  it("rejects CPU above either provider budget", () => {
    const pages = fixture(1);
    (pages.pagesEvents[1] as { $workers: Record<string, unknown> }).$workers.cpuTimeMs =
      PAGES_CPU_BUDGET_MS + 0.001;
    expect(evaluate(pages).pass).toBe(false);

    const durable = fixture(1);
    (
      durable.durableObjectEvents[1] as { $workers: Record<string, unknown> }
    ).$workers.cpuTimeMs = DURABLE_OBJECT_CPU_BUDGET_MS + 0.001;
    expect(evaluate(durable).pass).toBe(false);
  });

  it("rejects exceeded CPU, nonnumeric CPU and unexpected markers", () => {
    const exceeded = fixture(1);
    (
      exceeded.durableObjectEvents[1] as { $workers: Record<string, unknown> }
    ).$workers.outcome = "exceededCpu";
    expect(evaluate(exceeded).pass).toBe(false);

    const nonnumeric = fixture(1);
    (
      nonnumeric.pagesEvents[1] as { $workers: Record<string, unknown> }
    ).$workers.cpuTimeMs = "5";
    expect(evaluate(nonnumeric).pass).toBe(false);

    const contaminated = fixture(1);
    contaminated.pagesEvents.push(
      marker(evidenceId(99), "pages-extra", pagesScript, "pages-ingress"),
    );
    expect(evaluate(contaminated).pass).toBe(false);
  });

  it("rejects duplicate expected evidence ids", () => {
    const data = fixture(1);
    data.ids.push(data.ids[0]);
    expect(evaluate(data).pass).toBe(false);
  });
});

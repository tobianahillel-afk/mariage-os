import { describe, expect, it } from "vitest";
import {
  AR006_EVIDENCE_COUNT,
  DURABLE_OBJECT_CPU_BUDGET_MS,
  PAGES_CPU_BUDGET_MS,
  evaluateAr006TwoSurfaceEvents,
} from "../../../scripts/private-document-ar006-two-surface-metrics.mjs";

const pagesScript = "pages-worker--isolated-preview";
const workerScript = "mariage-os-private-document-promotion";
const workerVersion = "11111111-2222-4333-8444-555555555555";

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
  scriptVersionId = null,
  metadataRequestId = false,
}: {
  requestId: string;
  scriptName: string;
  executionModel: "stateless" | "durableObject";
  cpuTimeMs: number | null | string;
  durableObjectId?: string | null;
  scriptVersionId?: string | null;
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
      ...(scriptVersionId === null
        ? {}
        : { scriptVersion: { id: scriptVersionId } }),
    },
  };
}

function fixture(count: number = AR006_EVIDENCE_COUNT) {
  const ids = Array.from({ length: count }, (_, index) =>
    evidenceId(index + 1),
  );
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
        scriptVersionId: workerVersion,
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
    durableObjectVersionId: workerVersion,
  });
}

function workerFields(
  events: unknown[],
  index: number,
): Record<string, unknown> {
  const event = events[index];
  if (typeof event !== "object" || event === null || !("$workers" in event)) {
    throw new Error("Synthetic event is missing worker fields.");
  }
  const value = event.$workers;
  if (typeof value !== "object" || value === null) {
    throw new Error("Synthetic worker fields are malformed.");
  }
  return value as Record<string, unknown>;
}

describe("ADR 0012 two-surface CPU evaluator success", () => {
  it("requires ten complete stateless Pages and Durable Object measurements", () => {
    const result = evaluate();
    expect(result.pass).toBe(true);
    expect(result.exactEvidenceCount).toBe(true);
    expect(result.uniqueDurableObjects).toBe(true);
    expect(result.pages.measurements).toHaveLength(AR006_EVIDENCE_COUNT);
    expect(result.durableObject.measurements).toHaveLength(
      AR006_EVIDENCE_COUNT,
    );
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
        scriptVersionId: workerVersion,
      }),
    );
  });
});

describe("ADR 0012 two-surface correlation failures", () => {
  it("rejects a missing Durable Object invocation", () => {
    const data = fixture();
    data.durableObjectEvents.pop();
    expect(evaluate(data).pass).toBe(false);
  });

  it("rejects wrong execution model and missing Durable Object identity", () => {
    const data = fixture();
    const worker = workerFields(data.durableObjectEvents, 1);
    worker.executionModel = "stateless";
    worker.durableObjectId = null;
    expect(evaluate(data).pass).toBe(false);
  });

  it("rejects reused Durable Object identity across distinct documents", () => {
    const data = fixture();
    const first = workerFields(data.durableObjectEvents, 1);
    const second = workerFields(data.durableObjectEvents, 3);
    second.durableObjectId = first.durableObjectId;
    expect(evaluate(data).pass).toBe(false);
  });

  it("rejects a different or missing Durable Object script version", () => {
    const mismatched = fixture();
    workerFields(mismatched.durableObjectEvents, 1).scriptVersion = {
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    };
    expect(evaluate(mismatched).pass).toBe(false);

    const missing = fixture();
    delete workerFields(missing.durableObjectEvents, 1).scriptVersion;
    expect(evaluate(missing).pass).toBe(false);
  });
});

describe("ADR 0012 two-surface CPU failures", () => {

  it("rejects a provider invocation with missing HTTP status", () => {
    const data = fixture();
    const event = data.pagesEvents[1];
    if (
      typeof event !== "object" ||
      event === null ||
      !("$metadata" in event) ||
      typeof event.$metadata !== "object" ||
      event.$metadata === null
    ) {
      throw new Error("Synthetic event is missing metadata.");
    }
    delete (event.$metadata as Record<string, unknown>).statusCode;
    expect(evaluate(data).pass).toBe(false);
  });

  it("rejects CPU above either provider budget", () => {
    const pages = fixture();
    workerFields(pages.pagesEvents, 1).cpuTimeMs = PAGES_CPU_BUDGET_MS + 0.001;
    expect(evaluate(pages).pass).toBe(false);

    const durable = fixture();
    workerFields(durable.durableObjectEvents, 1).cpuTimeMs =
      DURABLE_OBJECT_CPU_BUDGET_MS + 0.001;
    expect(evaluate(durable).pass).toBe(false);
  });

  it("rejects exceeded CPU and nonnumeric CPU", () => {
    const exceeded = fixture();
    workerFields(exceeded.durableObjectEvents, 1).outcome = "exceededCpu";
    expect(evaluate(exceeded).pass).toBe(false);

    const nonnumeric = fixture();
    workerFields(nonnumeric.pagesEvents, 1).cpuTimeMs = "5";
    expect(evaluate(nonnumeric).pass).toBe(false);
  });
});

describe("ADR 0012 two-surface campaign-shape failures", () => {
  it("rejects unexpected evidence markers", () => {
    const data = fixture();
    data.pagesEvents.push(
      marker(evidenceId(99), "pages-extra", pagesScript, "pages-ingress"),
    );
    expect(evaluate(data).pass).toBe(false);
  });

  it("rejects fewer than ten expected promotions", () => {
    expect(evaluate(fixture(AR006_EVIDENCE_COUNT - 1)).pass).toBe(false);
  });

  it("rejects duplicate expected evidence ids", () => {
    const data = fixture();
    const [firstId] = data.ids;
    if (firstId === undefined) throw new Error("Fixture must contain an id.");
    data.ids[AR006_EVIDENCE_COUNT - 1] = firstId;
    expect(evaluate(data).pass).toBe(false);
  });
});

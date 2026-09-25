import { describe, expect, it } from "vitest";
import { discoverAr006SurfaceScripts } from "../../../scripts/private-document-ar006-surface-discovery.mjs";

const ingressScript = "mariage-os-ar006-ingress";
const durableScript = "mariage-os-private-document-promotion";
const ingressVersion = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const durableVersion = "11111111-2222-4333-8444-555555555555";
const ids = Array.from(
  { length: 10 },
  (_, index) =>
    `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);

function firstEvidenceId(): string {
  const value = ids[0];
  if (value === undefined) throw new Error("Fixture must contain an id.");
  return value;
}

function marker({
  evidenceId,
  surface,
  scriptName,
  requestId,
}: {
  evidenceId: string;
  surface: "worker-ingress" | "durable-object";
  scriptName: string;
  requestId: string;
}) {
  return {
    source: {
      event: "mariage-os.ar006.promotion",
      surface,
      evidenceId,
      status: 409,
    },
    $workers: { scriptName, requestId },
  };
}

function invocation(
  scriptName: string,
  requestId: string,
  executionModel: "stateless" | "durableObject",
  durableObjectId: string | null,
) {
  return {
    $metadata: { type: "cf-worker-event", statusCode: 409 },
    $workers: {
      scriptName,
      requestId,
      executionModel,
      eventType: "fetch",
      outcome: "ok",
      cpuTimeMs: executionModel === "stateless" ? 3 : 25,
      durableObjectId,
      scriptVersion: {
        id: executionModel === "stateless" ? ingressVersion : durableVersion,
      },
      truncated: false,
    },
  };
}

function completeEvents() {
  return ids.flatMap((evidenceId, index) => {
    const ingressRequestId = `ingress-${index + 1}`;
    const durableRequestId = `do-${index + 1}`;
    return [
      marker({
        evidenceId,
        surface: "worker-ingress",
        scriptName: ingressScript,
        requestId: ingressRequestId,
      }),
      invocation(ingressScript, ingressRequestId, "stateless", null),
      marker({
        evidenceId,
        surface: "durable-object",
        scriptName: durableScript,
        requestId: durableRequestId,
      }),
      invocation(
        durableScript,
        durableRequestId,
        "durableObject",
        `do-object-${index + 1}`,
      ),
    ];
  });
}

function discover(events: unknown[]) {
  return discoverAr006SurfaceScripts({
    events,
    expectedEvidenceIds: ids,
    ingressScriptName: ingressScript,
    durableObjectScriptName: durableScript,
    ingressVersionId: ingressVersion,
    durableObjectVersionId: durableVersion,
  });
}

describe("AR-006 structured surface discovery success", () => {
  it("proves exact scripts plus marker-to-provider attribution", () => {
    const result = discover(completeEvents());
    expect(result.pass).toBe(true);
    expect(result.ingressScriptName).toBe(ingressScript);
    expect(result.markerCount).toBe(20);
    expect(result.attributedInvocationCount).toBe(20);
    expect(result.failures).toEqual([]);
  });

});

describe("AR-006 structured surface discovery marker failures", () => {
  it("fails malformed marker logs but ignores unrelated invocation events", () => {
    const ordinary = {
      $metadata: { type: "cf-worker-event" },
      $workers: { scriptName: "unrelated-worker", requestId: "other" },
    };
    expect(discover([...completeEvents(), ordinary]).pass).toBe(true);

    const malformed = {
      source: {
        event: "mariage-os.ar006.promotion",
        surface: "worker-ingress",
      },
      $workers: { scriptName: ingressScript, requestId: "malformed" },
    };
    const result = discover([...completeEvents(), malformed]);
    expect(result.pass).toBe(false);
    expect(result.failures.map((item) => item.code)).toContain(
      "malformed_marker_event",
    );
  });

});

describe("AR-006 structured surface attribution failures", () => {
  it("fails closed when a persisted marker cannot reach one provider event", () => {
    const missing = completeEvents();
    missing.splice(1, 1);
    const missingResult = discover(missing);
    expect(missingResult.pass).toBe(false);
    expect(missingResult.failures.map((item) => item.code)).toContain(
      "missing_provider_invocation",
    );

    const noRequestId = completeEvents();
    const first = noRequestId[0] as { $workers: Record<string, unknown> };
    delete first.$workers.requestId;
    const requestIdResult = discover(noRequestId);
    expect(requestIdResult.pass).toBe(false);
    expect(requestIdResult.failures.map((item) => item.code)).toContain(
      "missing_marker_request_id",
    );
  });

  it("fails on wrong model, CPU, Durable Object identity or version", () => {
    const wrongModel = completeEvents();
    const doInvocation = wrongModel[3] as {
      $workers: Record<string, unknown>;
    };
    doInvocation.$workers.executionModel = "stateless";
    expect(discover(wrongModel).pass).toBe(false);

    const overBudget = completeEvents();
    const ingressInvocation = overBudget[1] as {
      $workers: Record<string, unknown>;
    };
    ingressInvocation.$workers.cpuTimeMs = 10.001;
    expect(discover(overBudget).pass).toBe(false);

    const missingDoId = completeEvents();
    const durableInvocation = missingDoId[3] as {
      $workers: Record<string, unknown>;
    };
    durableInvocation.$workers.durableObjectId = null;
    expect(discover(missingDoId).pass).toBe(false);

    const wrongVersion = completeEvents();
    const ingressVersionEvent = wrongVersion[1] as {
      $workers: Record<string, unknown>;
    };
    ingressVersionEvent.$workers.scriptVersion = {
      id: "ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb",
    };
    expect(discover(wrongVersion).pass).toBe(false);
  });

});

describe("AR-006 structured surface identity failures", () => {
  it("fails closed on unexpected ingress or DO script identity", () => {
    const ingressEvents = completeEvents();
    const first = ingressEvents[0] as {
      $workers: Record<string, unknown>;
      source: Record<string, unknown>;
    };
    first.$workers.scriptName = "unexpected-ingress";
    expect(discover(ingressEvents).failures.map((item) => item.code)).toContain(
      "unexpected_ingress_script",
    );

    const durableEvents = completeEvents();
    const firstDo = durableEvents[2] as {
      $workers: Record<string, unknown>;
      source: Record<string, unknown>;
    };
    firstDo.$workers.scriptName = "unexpected-durable";
    firstDo.source.evidenceId = firstEvidenceId();
    expect(discover(durableEvents).failures.map((item) => item.code)).toContain(
      "unexpected_durable_object_script",
    );
  });
});

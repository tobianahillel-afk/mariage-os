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

function invalidReasons(events: unknown[]): ReadonlyArray<string> {
  const invalid = discover(events).failures.find(
    (item) => item.code === "invalid_provider_invocation",
  );
  return invalid?.reasons ?? [];
}

function providerWorker(
  events: unknown[],
  index: number,
): Record<string, unknown> {
  const event = events[index] as { $workers: Record<string, unknown> };
  return event.$workers;
}

function providerMetadata(
  events: unknown[],
  index: number,
): Record<string, unknown> {
  const event = events[index] as { $metadata: Record<string, unknown> };
  return event.$metadata;
}

describe("AR-006 provider invocation diagnostic reasons", () => {
  it("distinguishes model, CPU, DO identity and version failures", () => {
    const wrongModel = completeEvents();
    providerWorker(wrongModel, 3).executionModel = "stateless";
    expect(invalidReasons(wrongModel)).toContain("unexpected_execution_model");

    const overBudget = completeEvents();
    providerWorker(overBudget, 1).cpuTimeMs = 10.001;
    expect(invalidReasons(overBudget)).toContain("cpu_over_budget");

    const missingDoId = completeEvents();
    providerWorker(missingDoId, 3).durableObjectId = null;
    expect(invalidReasons(missingDoId)).toContain("missing_durable_object_id");

    const wrongVersion = completeEvents();
    providerWorker(wrongVersion, 1).scriptVersion = {
      id: "ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb",
    };
    expect(invalidReasons(wrongVersion)).toContain("script_version_mismatch");
  });

  it("distinguishes CPU presence/sign and provider outcome failures", () => {
    const missingCpu = completeEvents();
    providerWorker(missingCpu, 1).cpuTimeMs = null;
    expect(invalidReasons(missingCpu)).toContain("missing_cpu_time");

    const negativeCpu = completeEvents();
    providerWorker(negativeCpu, 1).cpuTimeMs = -1;
    expect(invalidReasons(negativeCpu)).toContain("negative_cpu_time");

    const outcome = completeEvents();
    providerWorker(outcome, 1).outcome = "exception";
    expect(invalidReasons(outcome)).toContain("unexpected_outcome");
  });
});

describe("AR-006 provider invocation diagnostic protocol reasons", () => {
  it("distinguishes event type, status and truncation failures", () => {
    const eventType = completeEvents();
    providerWorker(eventType, 1).eventType = "scheduled";
    expect(invalidReasons(eventType)).toContain("unexpected_event_type");

    const missingStatus = completeEvents();
    delete providerMetadata(missingStatus, 1).statusCode;
    expect(invalidReasons(missingStatus)).toContain("missing_provider_status");

    const mismatch = completeEvents();
    providerMetadata(mismatch, 1).statusCode = 500;
    expect(invalidReasons(mismatch)).toContain("provider_status_mismatch");

    const truncated = completeEvents();
    providerWorker(truncated, 1).truncated = true;
    expect(invalidReasons(truncated)).toContain("truncated_provider_event");
  });

  it("distinguishes a missing script version", () => {
    const events = completeEvents();
    delete providerWorker(events, 1).scriptVersion;
    expect(invalidReasons(events)).toContain("missing_script_version");
  });
});

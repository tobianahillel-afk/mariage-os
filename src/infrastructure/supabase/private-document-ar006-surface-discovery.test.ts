import { describe, expect, it } from "vitest";
import { discoverAr006SurfaceScripts } from "../../../scripts/private-document-ar006-surface-discovery.mjs";

const ingressScript = "mariage-os-ar006-ingress";
const durableScript = "mariage-os-private-document-promotion";
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
}: {
  evidenceId: string;
  surface: "worker-ingress" | "durable-object";
  scriptName: string;
}) {
  return {
    source: {
      event: "mariage-os.ar006.promotion",
      surface,
      evidenceId,
      status: 200,
    },
    $workers: { scriptName },
  };
}

function completeEvents() {
  return ids.flatMap((evidenceId) => [
    marker({
      evidenceId,
      surface: "worker-ingress",
      scriptName: ingressScript,
    }),
    marker({
      evidenceId,
      surface: "durable-object",
      scriptName: durableScript,
    }),
  ]);
}

function discover(events: unknown[]) {
  return discoverAr006SurfaceScripts({
    events,
    expectedEvidenceIds: ids,
    ingressScriptName: ingressScript,
    durableObjectScriptName: durableScript,
  });
}

describe("AR-006 structured surface discovery", () => {
  it("discovers the exact ingress and Durable Object marker scripts", () => {
    const result = discover(completeEvents());
    expect(result.pass).toBe(true);
    expect(result.ingressScriptName).toBe(ingressScript);
    expect(result.markerCount).toBe(20);
    expect(result.failures).toEqual([]);
  });

  it("ignores ordinary invocation events while failing malformed marker logs", () => {
    const ordinary = {
      $metadata: { type: "cf-worker-event" },
      $workers: { scriptName: ingressScript },
    };
    expect(discover([...completeEvents(), ordinary]).pass).toBe(true);

    const malformed = {
      source: {
        event: "mariage-os.ar006.promotion",
        surface: "worker-ingress",
      },
      $workers: { scriptName: ingressScript },
    };
    const result = discover([...completeEvents(), malformed]);
    expect(result.pass).toBe(false);
    expect(result.failures.map((item) => item.code)).toContain(
      "malformed_marker_event",
    );
  });

  it("fails closed on unexpected ingress or DO script identity", () => {
    const ingressEvents = completeEvents();
    ingressEvents[0] = marker({
      evidenceId: firstEvidenceId(),
      surface: "worker-ingress",
      scriptName: "unexpected-ingress",
    });
    expect(discover(ingressEvents).failures.map((item) => item.code)).toContain(
      "unexpected_ingress_script",
    );

    const durableEvents = completeEvents().map((event, index) =>
      index % 2 === 1
        ? { ...event, $workers: { scriptName: "unexpected-durable" } }
        : event,
    );
    expect(discover(durableEvents).failures.map((item) => item.code)).toContain(
      "unexpected_durable_object_script",
    );
  });
});

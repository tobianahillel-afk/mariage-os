import { describe, expect, it } from "vitest";
import { discoverAr006SurfaceScripts } from "../../../scripts/private-document-ar006-surface-discovery.mjs";

const pagesScript = "pages-worker--synthetic-preview";
const durableScript = "mariage-os-private-document-promotion";
const ids = Array.from(
  { length: 10 },
  (_, index) =>
    `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);

function marker({
  evidenceId,
  surface,
  scriptName,
}: {
  evidenceId: string;
  surface: "pages-ingress" | "durable-object";
  scriptName: string;
}) {
  return {
    $workers: { scriptName },
    $metadata: {
      message: JSON.stringify({
        event: "mariage-os.ar006.promotion",
        surface,
        evidenceId,
        status: 200,
      }),
    },
  };
}

function completeEvents() {
  return ids.flatMap((evidenceId) => [
    marker({ evidenceId, surface: "pages-ingress", scriptName: pagesScript }),
    marker({
      evidenceId,
      surface: "durable-object",
      scriptName: durableScript,
    }),
  ]);
}

describe("AR-006 surface script discovery", () => {
  it("discovers one exact Pages script and verifies the DO script", () => {
    const result = discoverAr006SurfaceScripts({
      events: completeEvents(),
      expectedEvidenceIds: ids,
      durableObjectScriptName: durableScript,
    });
    expect(result.pass).toBe(true);
    expect(result.pagesScriptName).toBe(pagesScript);
    expect(result.markerCount).toBe(20);
    expect(result.failures).toEqual([]);
  });

  it("fails closed on an ambiguous Pages script", () => {
    const events = completeEvents();
    events[0] = marker({
      evidenceId: ids[0]!,
      surface: "pages-ingress",
      scriptName: "different-pages-script",
    });
    const result = discoverAr006SurfaceScripts({
      events,
      expectedEvidenceIds: ids,
      durableObjectScriptName: durableScript,
    });
    expect(result.pass).toBe(false);
    expect(result.failures).toContainEqual({
      code: "ambiguous_pages_script",
      evidenceId: null,
    });
  });

  it("fails closed on unexpected or malformed marker traffic", () => {
    const events = [
      ...completeEvents(),
      marker({
        evidenceId: "00000000-0000-4000-8000-999999999999",
        surface: "pages-ingress",
        scriptName: pagesScript,
      }),
      { $workers: { scriptName: pagesScript }, $metadata: { message: "bad" } },
    ];
    const result = discoverAr006SurfaceScripts({
      events,
      expectedEvidenceIds: ids,
      durableObjectScriptName: durableScript,
    });
    expect(result.pass).toBe(false);
    expect(result.failures.map((item) => item.code)).toContain(
      "unexpected_marker",
    );
    expect(result.failures.map((item) => item.code)).toContain(
      "unparseable_marker_event",
    );
  });

  it("fails closed when the DO markers come from another script", () => {
    const events = completeEvents().map((event, index) =>
      index % 2 === 1
        ? {
            ...event,
            $workers: { scriptName: "unexpected-durable-script" },
          }
        : event,
    );
    const result = discoverAr006SurfaceScripts({
      events,
      expectedEvidenceIds: ids,
      durableObjectScriptName: durableScript,
    });
    expect(result.pass).toBe(false);
    expect(result.failures).toContainEqual({
      code: "unexpected_durable_object_script",
      evidenceId: null,
    });
  });
});

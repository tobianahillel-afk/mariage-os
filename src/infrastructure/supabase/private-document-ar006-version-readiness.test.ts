import { describe, expect, it } from "vitest";
import { discoverAr006SurfaceScripts } from "../../../scripts/private-document-ar006-surface-discovery.mjs";
import { markerReadiness } from "../../../scripts/private-document-ar006-version-readiness.mjs";

const accepted = {
  pass: true,
  markerCount: 2,
  attributedInvocationCount: 2,
  failures: [],
};

function mismatch(reasons: string[]) {
  return {
    pass: false,
    markerCount: 2,
    attributedInvocationCount: 1,
    failures: [
      {
        code: "invalid_provider_invocation",
        surface: "worker-ingress",
        reasons,
      },
    ],
  };
}

describe("ADR 0013 exact-version marker readiness", () => {
  it("accepts only a complete, fully attributed marker", () => {
    expect(markerReadiness(true, accepted)).toBe("ready");
    expect(markerReadiness(false, accepted)).toBe("await_logs");
  });

  it("permits a new safe marker only for an isolated ingress version mismatch", () => {
    expect(markerReadiness(true, mismatch(["script_version_mismatch"]))).toBe(
      "retry_marker",
    );
    expect(
      markerReadiness(
        true,
        mismatch(["script_version_mismatch", "cpu_over_budget"]),
      ),
    ).toBe("blocked");
    expect(markerReadiness(true, mismatch(["cpu_over_budget"]))).toBe(
      "blocked",
    );
  });
});

describe("ADR 0013 delayed marker logs", () => {
  it("waits only for the exact empty-page discovery shape", () => {
    // Reproduce the exact empty-page shape from the isolated provider campaign.
    const empty = discoverAr006SurfaceScripts({
      events: [],
      expectedEvidenceIds: ["5264a71f-e0b9-4faf-8dbc-7d2e813a5839"],
      ingressScriptName: "mariage-os-ar006-ingress",
      durableObjectScriptName: "mariage-os-private-document-promotion",
      ingressVersionId: "7da58962-4389-449f-88fa-e44f8e238c46",
      durableObjectVersionId: "a2c81dc6-b169-4fea-82be-7bd5ae9bfebf",
    });
    expect(empty.failures).toHaveLength(4);
    expect(markerReadiness(true, empty)).toBe("await_logs");
    expect(
      markerReadiness(true, {
        pass: false,
        markerCount: 1,
        attributedInvocationCount: 0,
        failures: [
          { code: "missing_marker" },
          { code: "unexpected_ingress_script" },
        ],
      }),
    ).toBe("blocked");
  });

  it("waits for delayed logs but rejects ambiguous or wrong-surface invocations", () => {
    expect(
      markerReadiness(true, {
        pass: false,
        markerCount: 0,
        attributedInvocationCount: 0,
        failures: [{ code: "missing_marker" }],
      }),
    ).toBe("await_logs");
    expect(
      markerReadiness(true, {
        ...mismatch(["script_version_mismatch"]),
        failures: [
          {
            code: "invalid_provider_invocation",
            surface: "durable-object",
            reasons: ["script_version_mismatch"],
          },
        ],
      }),
    ).toBe("blocked");
    expect(
      markerReadiness(true, {
        ...mismatch(["script_version_mismatch"]),
        failures: [
          ...mismatch(["script_version_mismatch"]).failures,
          { code: "duplicate_marker" },
        ],
      }),
    ).toBe("blocked");
  });
});

import { describe, expect, it } from "vitest";
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

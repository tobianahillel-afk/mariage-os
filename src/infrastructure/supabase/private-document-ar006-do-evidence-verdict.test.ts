import { describe, expect, it } from "vitest";
import { campaignPassed } from "../../../scripts/private-document-ar006-do-evidence-verdict.mjs";

const successfulInvocations = Array.from({ length: 10 }, () => ({
  success: true,
  status: 200,
  finalized: true,
}));

function discovery(eventPageComplete = true) {
  return {
    apiSuccess: true,
    eventPageComplete,
    discovery: { pass: true },
  };
}

function observation(eventPageComplete = true, evaluationPass = true) {
  return {
    pages: { apiSuccess: true, eventPageComplete },
    durableObject: { apiSuccess: true, eventPageComplete },
    evaluation: { pass: evaluationPass },
  };
}

function verdict(
  invocations = successfulInvocations,
  markerPreflight = discovery(),
  campaignDiscovery = discovery(),
  campaignObservation = observation(),
) {
  return campaignPassed(
    invocations,
    markerPreflight,
    campaignDiscovery,
    campaignObservation,
    invocations.length,
  );
}

describe("ADR 0012 exact-size campaign verdict success", () => {
  it("passes only the complete reviewed campaign shape", () => {
    expect(verdict()).toBe(true);
  });

  it("rejects a failed marker preflight", () => {
    expect(verdict(successfulInvocations, discovery(false))).toBe(false);
  });
});

describe("ADR 0012 exact-size campaign verdict provider failures", () => {
  it("rejects incomplete provider event pages", () => {
    expect(verdict(successfulInvocations, discovery(), discovery(false))).toBe(
      false,
    );
    expect(
      verdict(
        successfulInvocations,
        discovery(),
        discovery(),
        observation(false),
      ),
    ).toBe(false);
  });

  it("rejects a provider evaluation failure", () => {
    expect(
      verdict(
        successfulInvocations,
        discovery(),
        discovery(),
        observation(true, false),
      ),
    ).toBe(false);
  });
});

describe("ADR 0012 exact-size campaign verdict flow failures", () => {
  it("rejects a failed promotion", () => {
    const failed = [...successfulInvocations];
    failed[0] = { success: false, status: 503, finalized: false };
    expect(verdict(failed)).toBe(false);
  });

  it("rejects a promotion that was not verified finalized", () => {
    const notFinalized = [...successfulInvocations];
    notFinalized[0] = { success: true, status: 200, finalized: false };
    expect(verdict(notFinalized)).toBe(false);
  });
});

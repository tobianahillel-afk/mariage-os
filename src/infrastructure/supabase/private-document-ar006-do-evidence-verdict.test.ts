import { describe, expect, it } from "vitest";
import { campaignPassed } from "../../../scripts/private-document-ar006-do-evidence-verdict.mjs";

const successfulInvocations = Array.from({ length: 10 }, () => ({
  success: true,
  status: 200,
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

describe("ADR 0012 exact-size campaign verdict", () => {
  it("passes only the complete reviewed campaign shape", () => {
    expect(
      campaignPassed(
        successfulInvocations,
        discovery(),
        observation(),
        successfulInvocations.length,
      ),
    ).toBe(true);
  });

  it("rejects incomplete provider event pages", () => {
    expect(
      campaignPassed(
        successfulInvocations,
        discovery(false),
        observation(),
        successfulInvocations.length,
      ),
    ).toBe(false);
    expect(
      campaignPassed(
        successfulInvocations,
        discovery(),
        observation(false),
        successfulInvocations.length,
      ),
    ).toBe(false);
  });

  it("rejects failed promotion or provider evaluation", () => {
    const failed = [...successfulInvocations];
    failed[0] = { success: false, status: 503 };
    expect(
      campaignPassed(failed, discovery(), observation(), failed.length),
    ).toBe(false);
    expect(
      campaignPassed(
        successfulInvocations,
        discovery(),
        observation(true, false),
        successfulInvocations.length,
      ),
    ).toBe(false);
  });
});

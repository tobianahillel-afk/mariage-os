import { describe, expect, it } from "vitest";
import { campaignPassed } from "../../../scripts/private-document-ar006-do-evidence-verdict.mjs";

const COUNT = 10;
const successful = Array.from({ length: COUNT }, () => ({
  success: true,
  status: 200,
  finalized: true,
}));

function query(ok = true) {
  return { apiSuccess: ok, eventPageComplete: ok };
}

function preflight(pass = true) {
  return {
    ingress: query(pass),
    durableObject: query(pass),
    discovery: { pass },
  };
}

function observation(pass = true) {
  return {
    ingress: query(pass),
    durableObject: query(pass),
    evaluation: { pass },
  };
}

function verdict(
  invocations = successful,
  markerPreflight = preflight(),
  provider = observation(),
) {
  return campaignPassed({
    invocations,
    markerPreflight,
    observation: provider,
    expectedCount: COUNT,
  });
}

describe("ADR 0013 exact-size campaign verdict", () => {
  it("accepts only the complete two-surface campaign", () => {
    expect(verdict()).toBe(true);
    expect(verdict(successful, preflight(false))).toBe(false);
    expect(verdict(successful, preflight(), observation(false))).toBe(false);
  });

  it("rejects failed, unfinalized or incomplete promotions", () => {
    const failed = [...successful];
    failed[0] = { success: false, status: 503, finalized: false };
    expect(verdict(failed)).toBe(false);

    const unfinished = [...successful];
    unfinished[0] = { success: true, status: 200, finalized: false };
    expect(verdict(unfinished)).toBe(false);
    expect(verdict(successful.slice(0, COUNT - 1))).toBe(false);
  });
});

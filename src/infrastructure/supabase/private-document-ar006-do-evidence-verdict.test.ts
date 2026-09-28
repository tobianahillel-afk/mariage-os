import { describe, expect, it } from "vitest";
import { campaignPassed } from "../../../scripts/private-document-ar006-do-evidence-verdict.mjs";

const COUNT = 10;
const successful = Array.from({ length: COUNT }, (_, index) => ({
  success: true,
  status: 200,
  finalized: true,
  sizeBytes: 25_000_000,
  sha256: index.toString(16).padStart(64, "0"),
}));

function existing<T>(item: T | undefined): T {
  if (item === undefined) throw new Error("Missing test fixture item.");
  return item;
}

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
    expectedBytes: 25_000_000,
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
    failed[0] = {
      ...existing(failed[0]),
      success: false,
      status: 503,
      finalized: false,
    };
    expect(verdict(failed)).toBe(false);

    const unfinished = [...successful];
    unfinished[0] = { ...existing(unfinished[0]), finalized: false };
    expect(verdict(unfinished)).toBe(false);
    expect(verdict(successful.slice(0, COUNT - 1))).toBe(false);
  });

  it("rejects repeated or missing PDF content hashes", () => {
    const repeated = [...successful];
    repeated[1] = {
      ...existing(repeated[1]),
      sha256: existing(repeated[0]).sha256,
    };
    expect(verdict(repeated)).toBe(false);

    const missing = [...successful];
    missing[1] = { ...existing(missing[1]), sha256: "" };
    expect(verdict(missing)).toBe(false);
  });

  it("rejects a flow whose staged PDF was not exactly 25 MB", () => {
    const wrongSize = [...successful];
    wrongSize[1] = { ...existing(wrongSize[1]), sizeBytes: 24_999_999 };
    expect(verdict(wrongSize)).toBe(false);
  });
});

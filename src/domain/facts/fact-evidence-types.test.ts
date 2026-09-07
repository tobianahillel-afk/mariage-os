import { describe, expect, it } from "vitest";
import {
  FACT_EVIDENCE_LEVELS,
  FACT_OBSERVATION_CONFIDENCE_LEVELS,
  FACT_OBSERVATION_STATUSES,
  FACT_SOURCE_STATUSES,
  FACT_SOURCE_TYPES,
  isFactEvidenceLevel,
  isFactObservationConfidence,
  isFactObservationStatus,
  isFactSourceStatus,
  isFactSourceType,
} from "./fact-evidence-types";

describe("fact evidence vocabulary", () => {
  it("accepts every frozen evidence/confidence/status/source key", () => {
    for (const value of FACT_EVIDENCE_LEVELS) {
      expect(isFactEvidenceLevel(value)).toBe(true);
    }
    for (const value of FACT_OBSERVATION_CONFIDENCE_LEVELS) {
      expect(isFactObservationConfidence(value)).toBe(true);
    }
    for (const value of FACT_OBSERVATION_STATUSES) {
      expect(isFactObservationStatus(value)).toBe(true);
    }
    for (const value of FACT_SOURCE_TYPES) {
      expect(isFactSourceType(value)).toBe(true);
    }
    for (const value of FACT_SOURCE_STATUSES) {
      expect(isFactSourceStatus(value)).toBe(true);
    }
  });

  it("keeps the vocabularies independent and fails closed", () => {
    expect(isFactEvidenceLevel("high")).toBe(false);
    expect(isFactObservationConfidence("contractual")).toBe(false);
    expect(isFactObservationStatus("archived")).toBe(false);
    expect(isFactSourceType("active")).toBe(false);
    expect(isFactSourceStatus("official_website")).toBe(false);
  });
});

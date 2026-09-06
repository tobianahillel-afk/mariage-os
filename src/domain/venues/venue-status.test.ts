import { describe, expect, it } from "vitest";
import {
  isVenueStatus,
  validateVenueTransitionInput,
  venueStatuses,
} from "./venue-status";

describe("venue status", () => {
  it("recognizes every frozen venue status", () => {
    for (const status of venueStatuses) {
      expect(isVenueStatus(status)).toBe(true);
    }
    expect(isVenueStatus("deleted")).toBe(false);
  });

  it("requires a meaningful rejection reason", () => {
    expect(validateVenueTransitionInput("rejected", null)).toEqual({
      ok: false,
      error: "rejection_reason_required",
    });
    expect(validateVenueTransitionInput("rejected", "   ")).toEqual({
      ok: false,
      error: "rejection_reason_required",
    });
  });

  it("normalizes an accepted rejection reason", () => {
    expect(validateVenueTransitionInput("rejected", "  too small  ")).toEqual({
      ok: true,
      status: "rejected",
      rejectionReason: "too small",
    });
  });

  it("rejects an overlong rejection reason", () => {
    expect(validateVenueTransitionInput("rejected", "x".repeat(1_001))).toEqual({
      ok: false,
      error: "rejection_reason_too_long",
    });
  });

  it("does not carry a rejection reason into an active status", () => {
    expect(validateVenueTransitionInput("shortlist", "old reason")).toEqual({
      ok: false,
      error: "rejection_reason_not_allowed",
    });
    expect(validateVenueTransitionInput("shortlist", null)).toEqual({
      ok: true,
      status: "shortlist",
      rejectionReason: null,
    });
  });

  it("fails closed for an unknown status", () => {
    expect(validateVenueTransitionInput("mystery", null)).toEqual({
      ok: false,
      error: "unknown_status",
    });
  });
});

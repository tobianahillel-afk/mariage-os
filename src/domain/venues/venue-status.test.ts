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
    const missing = validateVenueTransitionInput("rejected", null);
    const blank = validateVenueTransitionInput("rejected", "   ");

    expect(missing).toEqual({
      ok: false,
      error: "rejection_reason_required",
    });
    expect(blank).toEqual({
      ok: false,
      error: "rejection_reason_required",
    });
  });

  it("normalizes an accepted rejection reason", () => {
    const result = validateVenueTransitionInput("rejected", "  too small  ");

    expect(result).toEqual({
      ok: true,
      status: "rejected",
      rejectionReason: "too small",
    });
  });

  it("rejects an overlong rejection reason", () => {
    const reason = "x".repeat(1_001);
    const result = validateVenueTransitionInput("rejected", reason);

    expect(result).toEqual({
      ok: false,
      error: "rejection_reason_too_long",
    });
  });

  it("does not carry a rejection reason into an active status", () => {
    const staleReason = validateVenueTransitionInput("shortlist", "old reason");
    const valid = validateVenueTransitionInput("shortlist", null);

    expect(staleReason).toEqual({
      ok: false,
      error: "rejection_reason_not_allowed",
    });
    expect(valid).toEqual({
      ok: true,
      status: "shortlist",
      rejectionReason: null,
    });
  });

  it("fails closed for an unknown status", () => {
    const result = validateVenueTransitionInput("mystery", null);

    expect(result).toEqual({
      ok: false,
      error: "unknown_status",
    });
  });
});

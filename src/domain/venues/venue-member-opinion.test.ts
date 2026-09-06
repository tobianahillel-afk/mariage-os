import { describe, expect, it } from "vitest";
import {
  isVenueRatingDimension,
  normalizeVenueMemberPreference,
  normalizeVenueMemberRating,
  venueRatingDimensions,
} from "./venue-member-opinion";

describe("venue rating dimensions", () => {
  it("accepts only the frozen personal rating keys", () => {
    for (const dimension of venueRatingDimensions) {
      expect(isVenueRatingDimension(dimension)).toBe(true);
    }
    expect(isVenueRatingDimension("typo_score")).toBe(false);
  });
});

describe("normalizeVenueMemberPreference normalization", () => {
  it("normalizes a private member preference", () => {
    expect(
      normalizeVenueMemberPreference({
        favorite: true,
        personalNote: "  my private note  ",
        expectedRevision: 2,
      }),
    ).toEqual({
      ok: true,
      value: {
        favorite: true,
        personalNote: "my private note",
        expectedRevision: 2,
      },
    });
  });

  it("normalizes an omitted personal note to null", () => {
    expect(
      normalizeVenueMemberPreference({
        favorite: false,
        expectedRevision: 0,
      }),
    ).toEqual({
      ok: true,
      value: {
        favorite: false,
        personalNote: null,
        expectedRevision: 0,
      },
    });
  });

  it.each([null, "   "])(
    "normalizes null or blank personal note %# to null",
    (personalNote) => {
      const result = normalizeVenueMemberPreference({
        favorite: false,
        personalNote,
        expectedRevision: 0,
      });
      expect(result).toEqual({
        ok: true,
        value: {
          favorite: false,
          personalNote: null,
          expectedRevision: 0,
        },
      });
    },
  );
});

describe("normalizeVenueMemberPreference validation", () => {
  it("rejects oversized private notes", () => {
    expect(
      normalizeVenueMemberPreference({
        favorite: true,
        personalNote: "x".repeat(5_001),
        expectedRevision: 0,
      }),
    ).toEqual({ ok: false, error: "personal_note_too_long" });
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid preference revision %#",
    (expectedRevision) => {
      expect(
        normalizeVenueMemberPreference({ favorite: true, expectedRevision }),
      ).toEqual({ ok: false, error: "expected_revision_invalid" });
    },
  );
});

describe("normalizeVenueMemberRating", () => {
  it.each(venueRatingDimensions)("accepts %s", (dimensionKey) => {
    expect(
      normalizeVenueMemberRating({
        dimensionKey,
        rating: 8.55,
        expectedRevision: 1,
      }),
    ).toEqual({
      ok: true,
      value: { dimensionKey, rating: 8.55, expectedRevision: 1 },
    });
  });

  it("rejects unknown dimensions", () => {
    expect(
      normalizeVenueMemberRating({
        dimensionKey: "typo_score",
        rating: 5,
        expectedRevision: 0,
      }),
    ).toEqual({ ok: false, error: "rating_dimension_invalid" });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -0.01, 10.01, 4.555])(
    "rejects invalid rating %#",
    (rating) => {
      expect(
        normalizeVenueMemberRating({
          dimensionKey: "love_score",
          rating,
          expectedRevision: 0,
        }),
      ).toEqual({ ok: false, error: "rating_invalid" });
    },
  );

  it.each([-1, 1.25, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid rating revision %#",
    (expectedRevision) => {
      expect(
        normalizeVenueMemberRating({
          dimensionKey: "love_score",
          rating: 5,
          expectedRevision,
        }),
      ).toEqual({ ok: false, error: "expected_revision_invalid" });
    },
  );
});

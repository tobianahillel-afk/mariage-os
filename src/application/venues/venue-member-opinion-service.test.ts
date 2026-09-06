import { describe, expect, it } from "vitest";
import {
  saveVenueMemberPreference,
  saveVenueMemberRating,
  type SaveVenueMemberPreferenceInput,
  type SaveVenueMemberRatingInput,
  type VenueMemberOpinionPort,
  type VenueMemberPreferenceRecord,
  type VenueMemberRatingRecord,
} from "./venue-member-opinion-service";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const venueId = "a1000000-0000-4000-8000-000000000001";
const userId = "a3000000-0000-4000-8000-000000000001";

const preference: VenueMemberPreferenceRecord = {
  id: "a4000000-0000-4000-8000-000000000001",
  projectId,
  userId,
  venueId,
  favorite: true,
  personalNote: "private note",
  revision: 1,
};

const rating: VenueMemberRatingRecord = {
  id: "a5000000-0000-4000-8000-000000000001",
  projectId,
  userId,
  venueId,
  dimensionKey: "love_score",
  rating: 9,
  revision: 1,
};

interface Captures {
  preference: SaveVenueMemberPreferenceInput | null;
  rating: SaveVenueMemberRatingInput | null;
}

function portWith(
  captures: Captures,
  options: {
    readonly failPreference?: boolean;
    readonly failRating?: boolean;
  } = {},
): VenueMemberOpinionPort {
  return {
    async getOwnVenuePreference() {
      return preference;
    },
    async listVenueRatings() {
      return [rating];
    },
    async saveVenuePreference(input) {
      captures.preference = input;
      if (options.failPreference === true) throw new Error("provider detail");
      return { ...preference, ...input, userId };
    },
    async saveVenueRating(input) {
      captures.rating = input;
      if (options.failRating === true) throw new Error("provider detail");
      return { ...rating, ...input, userId };
    },
  };
}

describe("saveVenueMemberPreference", () => {
  it("normalizes and persists only self-scoped opinion fields", async () => {
    const captures: Captures = { preference: null, rating: null };
    const result = await saveVenueMemberPreference(portWith(captures), {
      projectId,
      venueId,
      favorite: true,
      personalNote: "  private note  ",
      expectedRevision: 0,
    });

    expect(result.ok && result.preference.userId).toBe(userId);
    expect(captures.preference).toEqual({
      projectId,
      venueId,
      favorite: true,
      personalNote: "private note",
      expectedRevision: 0,
    });
  });

  it("returns validation errors before persistence", async () => {
    const captures: Captures = { preference: null, rating: null };
    const result = await saveVenueMemberPreference(portWith(captures), {
      projectId,
      venueId,
      favorite: true,
      personalNote: null,
      expectedRevision: -1,
    });

    expect(result).toEqual({ ok: false, error: "expected_revision_invalid" });
    expect(captures.preference).toBeNull();
  });

  it("hides preference provider failures", async () => {
    const captures: Captures = { preference: null, rating: null };
    await expect(
      saveVenueMemberPreference(portWith(captures, { failPreference: true }), {
        projectId,
        venueId,
        favorite: false,
        expectedRevision: 0,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});

describe("saveVenueMemberRating", () => {
  it("persists a validated personal rating without an author field", async () => {
    const captures: Captures = { preference: null, rating: null };
    const result = await saveVenueMemberRating(portWith(captures), {
      projectId,
      venueId,
      dimensionKey: "love_score",
      rating: 9,
      expectedRevision: 0,
    });

    expect(result.ok && result.rating.userId).toBe(userId);
    expect(captures.rating).toEqual({
      projectId,
      venueId,
      dimensionKey: "love_score",
      rating: 9,
      expectedRevision: 0,
    });
  });

  it("returns rating validation errors before persistence", async () => {
    const captures: Captures = { preference: null, rating: null };
    const result = await saveVenueMemberRating(portWith(captures), {
      projectId,
      venueId,
      dimensionKey: "typo_score",
      rating: 5,
      expectedRevision: 0,
    });

    expect(result).toEqual({ ok: false, error: "rating_dimension_invalid" });
    expect(captures.rating).toBeNull();
  });

  it("hides rating provider failures", async () => {
    const captures: Captures = { preference: null, rating: null };
    await expect(
      saveVenueMemberRating(portWith(captures, { failRating: true }), {
        projectId,
        venueId,
        dimensionKey: "love_score",
        rating: 5,
        expectedRevision: 0,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});

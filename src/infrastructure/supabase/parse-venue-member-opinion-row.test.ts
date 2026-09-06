import { describe, expect, it } from "vitest";
import {
  parseVenueMemberPreferenceRow,
  parseVenueMemberRatingRow,
} from "./parse-venue-member-opinion-row";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const venueId = "a1000000-0000-4000-8000-000000000001";
const otherVenueId = "a1000000-0000-4000-8000-000000000002";
const userId = "a3000000-0000-4000-8000-000000000001";

const preferenceRow = {
  id: "a4000000-0000-4000-8000-000000000001",
  project_id: projectId,
  user_id: userId,
  target_type: "venue",
  target_id: venueId,
  favorite: true,
  personal_note: "private note",
  revision: 2,
};
const ratingRow = {
  id: "a5000000-0000-4000-8000-000000000001",
  project_id: projectId,
  user_id: userId,
  target_type: "venue",
  target_id: venueId,
  dimension_key: "love_score",
  rating: 8.5,
  revision: 3,
};

function expectPreferenceRejected(row: unknown): void {
  expect(() => parseVenueMemberPreferenceRow(row, projectId, venueId)).toThrow(
    "Invalid venue member opinion response.",
  );
}
function expectRatingRejected(row: unknown): void {
  expect(() => parseVenueMemberRatingRow(row, projectId, venueId)).toThrow(
    "Invalid venue member opinion response.",
  );
}

describe("parseVenueMemberPreferenceRow", () => {
  it("maps a project/venue-bound private preference", () => {
    expect(
      parseVenueMemberPreferenceRow(preferenceRow, projectId, venueId),
    ).toEqual({
      id: preferenceRow.id,
      projectId,
      userId,
      venueId,
      favorite: true,
      personalNote: "private note",
      revision: 2,
    });
  });

  it("accepts a null personal note", () => {
    const parsed = parseVenueMemberPreferenceRow(
      { ...preferenceRow, personal_note: null },
      projectId,
      venueId,
    );
    expect(parsed.personalNote).toBeNull();
  });

  it("rejects malformed, cross-project and cross-target preference rows", () => {
    for (const row of [
      42,
      null,
      [],
      { ...preferenceRow, project_id: otherProjectId },
      { ...preferenceRow, project_id: "invalid" },
      { ...preferenceRow, target_id: otherVenueId },
      { ...preferenceRow, target_id: "invalid" },
      { ...preferenceRow, target_type: "vendor" },
      { ...preferenceRow, id: "invalid" },
      { ...preferenceRow, user_id: "invalid" },
      { ...preferenceRow, favorite: "yes" },
      { ...preferenceRow, personal_note: 7 },
      { ...preferenceRow, personal_note: "x".repeat(5_001) },
      { ...preferenceRow, revision: 0 },
      { ...preferenceRow, revision: 1.5 },
    ]) {
      expectPreferenceRejected(row);
    }
  });
});

describe("parseVenueMemberRatingRow", () => {
  it("maps a partner-readable rating", () => {
    expect(parseVenueMemberRatingRow(ratingRow, projectId, venueId)).toEqual({
      id: ratingRow.id,
      projectId,
      userId,
      venueId,
      dimensionKey: "love_score",
      rating: 8.5,
      revision: 3,
    });
  });

  it("rejects malformed, cross-project and invalid rating rows", () => {
    for (const row of [
      42,
      null,
      [],
      { ...ratingRow, project_id: otherProjectId },
      { ...ratingRow, target_id: otherVenueId },
      { ...ratingRow, target_type: "vendor" },
      { ...ratingRow, id: "invalid" },
      { ...ratingRow, user_id: "invalid" },
      { ...ratingRow, dimension_key: 7 },
      { ...ratingRow, dimension_key: "typo_score" },
      { ...ratingRow, rating: "8.5" },
      { ...ratingRow, rating: Number.NaN },
      { ...ratingRow, rating: -0.01 },
      { ...ratingRow, rating: 10.01 },
      { ...ratingRow, rating: 4.555 },
      { ...ratingRow, revision: 0 },
    ]) {
      expectRatingRejected(row);
    }
  });
});

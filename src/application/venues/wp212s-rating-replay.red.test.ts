import { expect, it } from "vitest";
import {
  saveVenueMemberRating,
  type SaveVenueMemberRatingInput,
  type VenueMemberOpinionPort,
  type VenueMemberRatingRecord,
} from "./venue-member-opinion-service";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const venueId = "a1000000-0000-4000-8000-000000000001";
const userId = "a3000000-0000-4000-8000-000000000001";
const operationId = "a6000000-0000-4000-8000-000000000001";
const deviceId = "a7000000-0000-4000-8000-000000000001";

const persisted: VenueMemberRatingRecord = {
  id: "a5000000-0000-4000-8000-000000000001",
  projectId,
  userId,
  venueId,
  dimensionKey: "love_score",
  rating: 9,
  revision: 1,
};

it("RED: preserves stable operation/device identity through rating service", async () => {
  let captured: SaveVenueMemberRatingInput | null = null;
  const port: VenueMemberOpinionPort = {
    async getOwnVenuePreference() {
      return null;
    },
    async listVenueRatings() {
      return [];
    },
    async saveVenuePreference() {
      throw new Error("not used");
    },
    async saveVenueRating(input) {
      captured = input;
      return persisted;
    },
  };

  const draft = {
    projectId,
    venueId,
    dimensionKey: "love_score",
    rating: 9,
    expectedRevision: 0,
    operationId,
    deviceId,
  } as unknown as Parameters<typeof saveVenueMemberRating>[1];

  await expect(saveVenueMemberRating(port, draft)).resolves.toMatchObject({
    ok: true,
  });
  expect(captured).toMatchObject({
    projectId,
    venueId,
    dimensionKey: "love_score",
    rating: 9,
    expectedRevision: 0,
    operationId,
    deviceId,
  });
});

import { expect, it } from "vitest";
import {
  SupabaseVenueMemberOpinionAdapter,
  type SupabaseVenueMemberOpinionClientLike,
} from "./supabase-venue-member-opinion-adapter";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const venueId = "a1000000-0000-4000-8000-000000000001";
const userId = "a3000000-0000-4000-8000-000000000001";
const operationId = "a6000000-0000-4000-8000-000000000001";
const deviceId = "a7000000-0000-4000-8000-000000000001";

it("RED: sends operation and device identity to the rating RPC", async () => {
  let rpcArgs: Readonly<Record<string, unknown>> | null = null;
  const client: SupabaseVenueMemberOpinionClientLike = {
    from() {
      throw new Error("not used");
    },
    rpc(_functionName, args) {
      rpcArgs = args;
      return Promise.resolve({
        data: {
          id: "a5000000-0000-4000-8000-000000000001",
          project_id: projectId,
          user_id: userId,
          target_type: "venue",
          target_id: venueId,
          dimension_key: "love_score",
          rating: 9,
          revision: 1,
        },
        error: null,
      });
    },
  };

  const input = {
    projectId,
    venueId,
    dimensionKey: "love_score" as const,
    rating: 9,
    expectedRevision: 0,
    operationId,
    deviceId,
  };

  const adapter = new SupabaseVenueMemberOpinionAdapter(client);
  await adapter.saveVenueRating(input);

  expect(rpcArgs).toMatchObject({
    target_project_id: projectId,
    target_venue_id: venueId,
    target_dimension_key: "love_score",
    target_rating: 9,
    target_expected_revision: 0,
    target_operation_id: operationId,
    target_device_id: deviceId,
  });
});

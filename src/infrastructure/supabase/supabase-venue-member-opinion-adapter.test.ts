import { describe, expect, it } from "vitest";
import {
  SupabaseVenueMemberOpinionAdapter,
  type SupabaseVenueMemberOpinionClientLike,
} from "./supabase-venue-member-opinion-adapter";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const venueId = "a1000000-0000-4000-8000-000000000001";
const userA = "a3000000-0000-4000-8000-000000000001";
const userB = "a3000000-0000-4000-8000-000000000002";

const preferenceRow = {
  id: "a4000000-0000-4000-8000-000000000001",
  project_id: projectId,
  user_id: userA,
  target_type: "venue",
  target_id: venueId,
  favorite: true,
  personal_note: "private",
  revision: 1,
};
const ratingA = {
  id: "a5000000-0000-4000-8000-000000000001",
  project_id: projectId,
  user_id: userA,
  target_type: "venue",
  target_id: venueId,
  dimension_key: "love_score",
  rating: 9,
  revision: 1,
};
const ratingB = {
  ...ratingA,
  id: "a5000000-0000-4000-8000-000000000002",
  user_id: userB,
  rating: 6,
};

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}
interface Results {
  readonly preference: Result;
  readonly ratings: Result;
  readonly savePreference: Result;
  readonly saveRating: Result;
}
interface Captures {
  table: string | null;
  columns: string | null;
  filters: readonly [string, unknown][];
  rpcName: string | null;
  rpc: Readonly<Record<string, unknown>> | null;
}

function emptyCaptures(): Captures {
  return { table: null, columns: null, filters: [], rpcName: null, rpc: null };
}

function clientWith(
  results: Results,
  captures: Captures,
): SupabaseVenueMemberOpinionClientLike {
  return {
    from(table) {
      captures.table = table;
      const result =
        table === "member_entity_preferences"
          ? results.preference
          : results.ratings;
      return {
        select(columns) {
          captures.columns = columns;
          const filters: [string, unknown][] = [];
          const target = Object.assign(Promise.resolve(result), {
            maybeSingle() {
              return Promise.resolve(result);
            },
          });
          const type = {
            eq(column: "target_id", value: string) {
              filters.push([column, value]);
              captures.filters = filters;
              return target;
            },
          };
          const project = {
            eq(column: "target_type", value: "venue") {
              filters.push([column, value]);
              return type;
            },
          };
          return {
            eq(column: "project_id", value: string) {
              filters.push([column, value]);
              return project;
            },
          };
        },
      };
    },
    rpc(functionName, args) {
      captures.rpcName = functionName;
      captures.rpc = args;
      return Promise.resolve(
        functionName === "set_venue_member_preference"
          ? results.savePreference
          : results.saveRating,
      );
    },
  };
}

function resultsWith(overrides: Partial<Results> = {}): Results {
  return {
    preference: { data: preferenceRow, error: null },
    ratings: { data: [ratingA, ratingB], error: null },
    savePreference: { data: preferenceRow, error: null },
    saveRating: { data: ratingA, error: null },
    ...overrides,
  };
}

describe("SupabaseVenueMemberOpinionAdapter reads", () => {
  it("gets only the RLS-visible own preference with project/venue filters", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueMemberOpinionAdapter(
      clientWith(resultsWith(), captures),
    );
    const preference = await adapter.getOwnVenuePreference(projectId, venueId);

    expect(preference?.userId).toBe(userA);
    expect(captures.table).toBe("member_entity_preferences");
    expect(captures.filters).toEqual([
      ["project_id", projectId],
      ["target_type", "venue"],
      ["target_id", venueId],
    ]);
  });

  it("returns null when no own preference row is visible", async () => {
    const adapter = new SupabaseVenueMemberOpinionAdapter(
      clientWith(
        resultsWith({ preference: { data: null, error: null } }),
        emptyCaptures(),
      ),
    );
    await expect(
      adapter.getOwnVenuePreference(projectId, venueId),
    ).resolves.toBeNull();
  });

  it("lists independent partner ratings", async () => {
    const adapter = new SupabaseVenueMemberOpinionAdapter(
      clientWith(resultsWith(), emptyCaptures()),
    );
    const ratings = await adapter.listVenueRatings(projectId, venueId);
    expect(ratings.map((item) => item.rating)).toEqual([9, 6]);
    expect(ratings.map((item) => item.userId)).toEqual([userA, userB]);
  });

  it.each([
    { key: "preference", value: { data: null, error: { message: "denied" } } },
    {
      key: "preference",
      value: {
        data: { ...preferenceRow, project_id: otherProjectId },
        error: null,
      },
    },
    { key: "ratings", value: { data: null, error: null } },
    {
      key: "ratings",
      value: {
        data: [{ ...ratingA, dimension_key: "typo_score" }],
        error: null,
      },
    },
  ] as const)(
    "fails closed for unsafe read response %#",
    async ({ key, value }) => {
      const adapter = new SupabaseVenueMemberOpinionAdapter(
        clientWith(resultsWith({ [key]: value }), emptyCaptures()),
      );
      const operation =
        key === "ratings"
          ? adapter.listVenueRatings(projectId, venueId)
          : adapter.getOwnVenuePreference(projectId, venueId);
      await expect(operation).rejects.toThrow(
        "Venue member opinion query failed.",
      );
    },
  );
});

describe("SupabaseVenueMemberOpinionAdapter writes", () => {
  it("saves preference without accepting an author id", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueMemberOpinionAdapter(
      clientWith(resultsWith(), captures),
    );
    await adapter.saveVenuePreference({
      projectId,
      venueId,
      favorite: true,
      personalNote: "private",
      expectedRevision: 0,
    });
    expect(captures.rpcName).toBe("set_venue_member_preference");
    expect(captures.rpc).toEqual({
      target_project_id: projectId,
      target_venue_id: venueId,
      target_favorite: true,
      target_personal_note: "private",
      target_expected_revision: 0,
    });
    expect(captures.rpc).not.toHaveProperty("user_id");
  });

  it("saves rating through the self-authored RPC", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueMemberOpinionAdapter(
      clientWith(resultsWith(), captures),
    );
    await adapter.saveVenueRating({
      projectId,
      venueId,
      dimensionKey: "love_score",
      rating: 9,
      expectedRevision: 0,
    });
    expect(captures.rpcName).toBe("set_venue_member_rating");
    expect(captures.rpc).toMatchObject({
      target_project_id: projectId,
      target_venue_id: venueId,
      target_dimension_key: "love_score",
      target_rating: 9,
      target_expected_revision: 0,
    });
    expect(captures.rpc).not.toHaveProperty("user_id");
  });

  it.each([
    {
      key: "savePreference",
      value: { data: null, error: { message: "denied" } },
    },
    {
      key: "savePreference",
      value: {
        data: { ...preferenceRow, project_id: otherProjectId },
        error: null,
      },
    },
    {
      key: "saveRating",
      value: { data: { ...ratingA, rating: 4.555 }, error: null },
    },
  ] as const)(
    "fails closed for unsafe mutation response %#",
    async ({ key, value }) => {
      const adapter = new SupabaseVenueMemberOpinionAdapter(
        clientWith(resultsWith({ [key]: value }), emptyCaptures()),
      );
      const operation =
        key === "saveRating"
          ? adapter.saveVenueRating({
              projectId,
              venueId,
              dimensionKey: "love_score",
              rating: 9,
              expectedRevision: 0,
            })
          : adapter.saveVenuePreference({
              projectId,
              venueId,
              favorite: true,
              personalNote: null,
              expectedRevision: 0,
            });
      await expect(operation).rejects.toThrow(
        "Venue member opinion mutation failed.",
      );
    },
  );
});

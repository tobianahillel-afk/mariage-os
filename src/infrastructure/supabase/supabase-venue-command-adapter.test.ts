import { describe, expect, it } from "vitest";
import {
  SupabaseVenueCommandAdapter,
  type SupabaseVenueClientLike,
} from "./supabase-venue-command-adapter";

interface Captures {
  table: string | null;
  insert: Readonly<Record<string, unknown>> | null;
  select: string | null;
  rpc: Readonly<Record<string, unknown>> | null;
}

function clientWith(
  createResult: { readonly data: unknown; readonly error: unknown },
  transitionResult: { readonly data: unknown; readonly error: unknown },
  captures: Captures,
): SupabaseVenueClientLike {
  return {
    from(table) {
      captures.table = table;
      return {
        insert(values) {
          captures.insert = values;
          return {
            select(columns) {
              captures.select = columns;
              return {
                single() {
                  return Promise.resolve(createResult);
                },
              };
            },
          };
        },
      };
    },
    rpc(functionName, args) {
      expect(functionName).toBe("transition_venue_status");
      captures.rpc = args;
      return Promise.resolve(transitionResult);
    },
  };
}

function emptyCaptures(): Captures {
  return { table: null, insert: null, select: null, rpc: null };
}

const createdRow = {
  id: "a1000000-0000-4000-8000-000000000001",
  project_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status: "research",
  revision: 1,
};

describe("SupabaseVenueCommandAdapter", () => {
  it("creates a venue through the safe granted field set", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueCommandAdapter(
      clientWith({ data: createdRow, error: null }, { data: 1, error: null }, captures),
    );

    await expect(
      adapter.createVenue({
        projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Venue Alpha",
        code: "P2",
        websiteUrl: "https://example.invalid",
        city: "Paris",
      }),
    ).resolves.toEqual({
      id: createdRow.id,
      projectId: createdRow.project_id,
      status: "research",
      revision: 1,
    });
    expect(captures).toMatchObject({
      table: "venues",
      insert: {
        project_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Venue Alpha",
        code: "P2",
        website_url: "https://example.invalid",
        city: "Paris",
      },
      select: "id,project_id,status,revision",
    });
  });

  it("does not expose provider creation errors", async () => {
    const adapter = new SupabaseVenueCommandAdapter(
      clientWith(
        { data: null, error: { message: "sensitive provider detail" } },
        { data: 1, error: null },
        emptyCaptures(),
      ),
    );
    await expect(
      adapter.createVenue({
        projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Venue",
        code: null,
        websiteUrl: null,
        city: null,
      }),
    ).rejects.toThrow("Venue creation failed.");
  });

  it.each([
    42,
    null,
    [],
    { ...createdRow, status: 3 },
    { ...createdRow, status: "shortlist" },
    { ...createdRow, id: 3 },
    { ...createdRow, id: "not-a-uuid" },
    { ...createdRow, project_id: "not-a-uuid" },
    { ...createdRow, revision: "1" },
    { ...createdRow, revision: 1.5 },
    { ...createdRow, revision: 0 },
  ])("rejects malformed venue creation response %#", async (data) => {
    const adapter = new SupabaseVenueCommandAdapter(
      clientWith({ data, error: null }, { data: 1, error: null }, emptyCaptures()),
    );
    await expect(
      adapter.createVenue({
        projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Venue",
        code: null,
        websiteUrl: null,
        city: null,
      }),
    ).rejects.toThrow("Venue creation failed.");
  });

  it("calls the protected lifecycle RPC with explicit context", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueCommandAdapter(
      clientWith({ data: createdRow, error: null }, { data: 7, error: null }, captures),
    );

    await expect(
      adapter.transitionVenue({
        projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        venueId: createdRow.id,
        status: "rejected",
        rejectionReason: "Too small",
        operationId: "c1000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toBe(7);
    expect(captures.rpc).toEqual({
      target_project_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      target_venue_id: createdRow.id,
      target_status: "rejected",
      target_rejection_reason: "Too small",
      target_operation_id: "c1000000-0000-4000-8000-000000000001",
    });
  });

  it("does not expose provider transition errors", async () => {
    const adapter = new SupabaseVenueCommandAdapter(
      clientWith(
        { data: createdRow, error: null },
        { data: null, error: { message: "policy detail" } },
        emptyCaptures(),
      ),
    );
    await expect(
      adapter.transitionVenue({
        projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        venueId: createdRow.id,
        status: "shortlist",
        rejectionReason: null,
        operationId: null,
      }),
    ).rejects.toThrow("Venue transition failed.");
  });

  it.each([null, "2", 1.5, 0])(
    "rejects malformed transition revision %#",
    async (data) => {
      const adapter = new SupabaseVenueCommandAdapter(
        clientWith(
          { data: createdRow, error: null },
          { data, error: null },
          emptyCaptures(),
        ),
      );
      await expect(
        adapter.transitionVenue({
          projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          venueId: createdRow.id,
          status: "shortlist",
          rejectionReason: null,
          operationId: null,
        }),
      ).rejects.toThrow("Venue transition failed.");
    },
  );
});

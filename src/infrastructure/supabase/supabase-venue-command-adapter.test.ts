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

type Result = { readonly data: unknown; readonly error: unknown };

const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VENUE_ID = "a1000000-0000-4000-8000-000000000001";

const createdRow = {
  id: VENUE_ID,
  project_id: PROJECT_ID,
  status: "research",
  revision: 1,
};

function emptyCaptures(): Captures {
  return { table: null, insert: null, select: null, rpc: null };
}

function clientWith(
  createResult: Result,
  transitionResult: Result,
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

function adapterWith(
  createResult: Result,
  transitionResult: Result = { data: 1, error: null },
  captures: Captures = emptyCaptures(),
): SupabaseVenueCommandAdapter {
  return new SupabaseVenueCommandAdapter(
    clientWith(createResult, transitionResult, captures),
  );
}

function createInput() {
  return {
    projectId: PROJECT_ID,
    name: "Venue",
    code: null,
    websiteUrl: null,
    city: null,
  } as const;
}

describe("SupabaseVenueCommandAdapter", () => {
  it("creates a venue through the safe granted field set", async () => {
    const captures = emptyCaptures();
    const adapter = adapterWith(
      { data: createdRow, error: null },
      { data: 1, error: null },
      captures,
    );

    await expect(
      adapter.createVenue({
        projectId: PROJECT_ID,
        name: "Venue Alpha",
        code: "P2",
        websiteUrl: "https://example.invalid",
        city: "Paris",
      }),
    ).resolves.toEqual({
      id: VENUE_ID,
      projectId: PROJECT_ID,
      status: "research",
      revision: 1,
    });
    expect(captures).toMatchObject({
      table: "venues",
      insert: {
        project_id: PROJECT_ID,
        name: "Venue Alpha",
        code: "P2",
        website_url: "https://example.invalid",
        city: "Paris",
      },
      select: "id,project_id,status,revision",
    });
  });

  it("does not expose provider creation errors", async () => {
    const providerError = { message: "sensitive provider detail" };
    const adapter = adapterWith({ data: null, error: providerError });

    await expect(adapter.createVenue(createInput())).rejects.toThrow(
      "Venue creation failed.",
    );
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
    const adapter = adapterWith({ data, error: null });

    await expect(adapter.createVenue(createInput())).rejects.toThrow(
      "Venue creation failed.",
    );
  });

  it("calls the protected lifecycle RPC with explicit context", async () => {
    const captures = emptyCaptures();
    const adapter = adapterWith(
      { data: createdRow, error: null },
      { data: 7, error: null },
      captures,
    );

    await expect(
      adapter.transitionVenue({
        projectId: PROJECT_ID,
        venueId: VENUE_ID,
        status: "rejected",
        rejectionReason: "Too small",
        operationId: "c1000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toBe(7);
    expect(captures.rpc).toEqual({
      target_project_id: PROJECT_ID,
      target_venue_id: VENUE_ID,
      target_status: "rejected",
      target_rejection_reason: "Too small",
      target_operation_id: "c1000000-0000-4000-8000-000000000001",
    });
  });

  it("does not expose provider transition errors", async () => {
    const providerError = { message: "policy detail" };
    const adapter = adapterWith(
      { data: createdRow, error: null },
      { data: null, error: providerError },
    );

    await expect(
      adapter.transitionVenue({
        projectId: PROJECT_ID,
        venueId: VENUE_ID,
        status: "shortlist",
        rejectionReason: null,
        operationId: null,
      }),
    ).rejects.toThrow("Venue transition failed.");
  });

  it.each([null, "2", 1.5, 0])(
    "rejects malformed transition revision %#",
    async (data) => {
      const adapter = adapterWith(
        { data: createdRow, error: null },
        { data, error: null },
      );

      await expect(
        adapter.transitionVenue({
          projectId: PROJECT_ID,
          venueId: VENUE_ID,
          status: "shortlist",
          rejectionReason: null,
          operationId: null,
        }),
      ).rejects.toThrow("Venue transition failed.");
    },
  );
});

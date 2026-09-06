import { describe, expect, it } from "vitest";
import {
  SupabaseVenueSpaceAdapter,
  type SupabaseVenueSpaceClientLike,
} from "./supabase-venue-space-adapter";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const venueId = "a1000000-0000-4000-8000-000000000001";
const spaceId = "a2000000-0000-4000-8000-000000000001";

const row = {
  id: spaceId,
  project_id: projectId,
  venue_id: venueId,
  name: "Orangerie",
  space_type: "reception_room",
  indoor: true,
  area_m2: 300,
  length_m: 20,
  width_m: 15,
  height_m: 4,
  capacity_seated: 180,
  capacity_cocktail: 240,
  sort_order: 1,
  notes: null,
  revision: 1,
};

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}
interface Results {
  readonly list: Result;
  readonly create: Result;
  readonly update: Result;
}
interface Captures {
  table: string | null;
  columns: string | null;
  project: string | null;
  venue: string | null;
  rpcName: string | null;
  rpc: Readonly<Record<string, unknown>> | null;
}

function captures(): Captures {
  return {
    table: null,
    columns: null,
    project: null,
    venue: null,
    rpcName: null,
    rpc: null,
  };
}

function clientWith(
  results: Results,
  capture: Captures,
): SupabaseVenueSpaceClientLike {
  return {
    from(table) {
      capture.table = table;
      return {
        select(columns) {
          capture.columns = columns;
          return {
            eq(_projectColumn, projectValue) {
              capture.project = projectValue;
              const promise = Promise.resolve(results.list);
              return Object.assign(promise, {
                eq(_venueColumn: "venue_id", venueValue: string) {
                  capture.venue = venueValue;
                  return Promise.resolve(results.list);
                },
              });
            },
          };
        },
      };
    },
    rpc(functionName, args) {
      capture.rpcName = functionName;
      capture.rpc = args;
      return Promise.resolve(
        functionName === "create_venue_space" ? results.create : results.update,
      );
    },
  };
}

function resultsWith(overrides: Partial<Results> = {}): Results {
  return {
    list: { data: [row], error: null },
    create: { data: row, error: null },
    update: { data: { ...row, revision: 2 }, error: null },
    ...overrides,
  };
}

const normalizedInput = {
  projectId,
  venueId,
  name: "Orangerie",
  spaceType: "reception_room",
  indoor: true,
  areaM2: 300,
  lengthM: 20,
  widthM: 15,
  heightM: 4,
  capacitySeated: 180,
  capacityCocktail: 240,
  sortOrder: 1,
  notes: null,
};

describe("SupabaseVenueSpaceAdapter list", () => {
  it("queries with both project and Venue scope", async () => {
    const capture = captures();
    const adapter = new SupabaseVenueSpaceAdapter(
      clientWith(resultsWith(), capture),
    );
    const spaces = await adapter.listVenueSpaces(projectId, venueId);

    expect(spaces).toHaveLength(1);
    expect(spaces[0]?.id).toBe(spaceId);
    expect(capture).toMatchObject({
      table: "venue_spaces",
      project: projectId,
      venue: venueId,
    });
  });

  it.each([
    { data: null, error: { message: "provider detail" } },
    { data: null, error: null },
    { data: [{ ...row, project_id: otherProjectId }], error: null },
  ])("fails closed for unsafe list response %#", async (list) => {
    const adapter = new SupabaseVenueSpaceAdapter(
      clientWith(resultsWith({ list }), captures()),
    );
    await expect(adapter.listVenueSpaces(projectId, venueId)).rejects.toThrow(
      "Venue space query failed.",
    );
  });
});

describe("SupabaseVenueSpaceAdapter mutations", () => {
  it("creates through the protected RPC with normalized payload", async () => {
    const capture = captures();
    const adapter = new SupabaseVenueSpaceAdapter(
      clientWith(resultsWith(), capture),
    );
    await adapter.createVenueSpace(normalizedInput);

    expect(capture.rpcName).toBe("create_venue_space");
    expect(capture.rpc).toMatchObject({
      target_project_id: projectId,
      target_venue_id: venueId,
      target_name: "Orangerie",
      target_capacity_seated: 180,
    });
  });

  it("updates through the optimistic-locking RPC", async () => {
    const capture = captures();
    const adapter = new SupabaseVenueSpaceAdapter(
      clientWith(resultsWith(), capture),
    );
    await adapter.updateVenueSpace({
      ...normalizedInput,
      spaceId,
      expectedRevision: 1,
    });

    expect(capture.rpcName).toBe("update_venue_space");
    expect(capture.rpc).toMatchObject({
      target_space_id: spaceId,
      target_expected_revision: 1,
    });
  });

  it.each([
    { key: "create", value: { data: null, error: { message: "denied" } } },
    {
      key: "create",
      value: { data: { ...row, project_id: otherProjectId }, error: null },
    },
    { key: "update", value: { data: null, error: { message: "denied" } } },
    { key: "update", value: { data: { ...row, revision: 0 }, error: null } },
  ] as const)(
    "fails closed for unsafe mutation response %#",
    async ({ key, value }) => {
      const adapter = new SupabaseVenueSpaceAdapter(
        clientWith(resultsWith({ [key]: value }), captures()),
      );
      const operation =
        key === "create"
          ? adapter.createVenueSpace(normalizedInput)
          : adapter.updateVenueSpace({
              ...normalizedInput,
              spaceId,
              expectedRevision: 1,
            });
      await expect(operation).rejects.toThrow("Venue space mutation failed.");
    },
  );
});

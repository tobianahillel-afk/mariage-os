import { describe, expect, it } from "vitest";
import {
  SupabaseVenueRepositoryAdapter,
  type SupabaseVenueRepositoryClientLike,
} from "./supabase-venue-repository-adapter";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const venueId = "a1000000-0000-4000-8000-000000000001";
const columns =
  "id,project_id,code,name,status,rejection_reason,website_url,city,revision";

const venueRow = {
  id: venueId,
  project_id: projectId,
  code: "P2",
  name: "Venue Alpha",
  status: "research",
  rejection_reason: null,
  website_url: "https://example.invalid",
  city: "Paris",
  revision: 2,
};

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}

interface Results {
  readonly list: Result;
  readonly get: Result;
  readonly update: Result;
}

interface Captures {
  table: string | null;
  select: string | null;
  projectColumn: string | null;
  projectValue: string | null;
  idColumn: string | null;
  idValue: string | null;
  update: Readonly<Record<string, unknown>> | null;
  updateSelect: string | null;
}

function emptyCaptures(): Captures {
  return {
    table: null,
    select: null,
    projectColumn: null,
    projectValue: null,
    idColumn: null,
    idValue: null,
    update: null,
    updateSelect: null,
  };
}

function selectBuilder(results: Results, captures: Captures) {
  return (selectedColumns: string) => {
    captures.select = selectedColumns;
    return {
      eq(projectColumn: "project_id", projectValue: string) {
        captures.projectColumn = projectColumn;
        captures.projectValue = projectValue;
        const listPromise = Promise.resolve(results.list);
        return Object.assign(listPromise, {
          eq(idColumn: "id", idValue: string) {
            captures.idColumn = idColumn;
            captures.idValue = idValue;
            return {
              maybeSingle() {
                return Promise.resolve(results.get);
              },
            };
          },
        });
      },
    };
  };
}

function updateBuilder(results: Results, captures: Captures) {
  return (values: Readonly<Record<string, unknown>>) => {
    captures.update = values;
    return {
      eq(projectColumn: "project_id", projectValue: string) {
        captures.projectColumn = projectColumn;
        captures.projectValue = projectValue;
        return {
          eq(idColumn: "id", idValue: string) {
            captures.idColumn = idColumn;
            captures.idValue = idValue;
            return {
              select(selectedColumns: string) {
                captures.updateSelect = selectedColumns;
                return {
                  single() {
                    return Promise.resolve(results.update);
                  },
                };
              },
            };
          },
        };
      },
    };
  };
}

function clientWith(
  results: Results,
  captures: Captures,
): SupabaseVenueRepositoryClientLike {
  return {
    from(table) {
      captures.table = table;
      return {
        select: selectBuilder(results, captures),
        update: updateBuilder(results, captures),
      };
    },
  };
}

function resultsWith(overrides: Partial<Results> = {}): Results {
  const success = { data: venueRow, error: null };
  return {
    list: { data: [venueRow], error: null },
    get: success,
    update: success,
    ...overrides,
  };
}

describe("SupabaseVenueRepositoryAdapter list", () => {
  it("lists project-scoped venue rows", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueRepositoryAdapter(
      clientWith(resultsWith(), captures),
    );

    const venues = await adapter.listVenues(projectId);

    expect(venues).toHaveLength(1);
    expect(venues[0]?.id).toBe(venueId);
    expect(captures).toMatchObject({
      table: "venues",
      select: columns,
      projectColumn: "project_id",
      projectValue: projectId,
    });
  });

  it.each([
    { data: null, error: { message: "provider detail" } },
    { data: null, error: null },
    {
      data: [{ ...venueRow, project_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }],
      error: null,
    },
  ])("fails closed for unsafe list response %#", async (list) => {
    const adapter = new SupabaseVenueRepositoryAdapter(
      clientWith(resultsWith({ list }), emptyCaptures()),
    );

    await expect(adapter.listVenues(projectId)).rejects.toThrow(
      "Venue query failed.",
    );
  });
});

describe("SupabaseVenueRepositoryAdapter get", () => {
  it("reads one venue with project and id filters", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueRepositoryAdapter(
      clientWith(resultsWith(), captures),
    );

    await expect(adapter.getVenue(projectId, venueId)).resolves.toMatchObject({
      id: venueId,
      projectId,
      name: "Venue Alpha",
    });
    expect(captures).toMatchObject({
      projectColumn: "project_id",
      projectValue: projectId,
      idColumn: "id",
      idValue: venueId,
    });
  });

  it("returns null when the authorized row does not exist", async () => {
    const adapter = new SupabaseVenueRepositoryAdapter(
      clientWith(
        resultsWith({ get: { data: null, error: null } }),
        emptyCaptures(),
      ),
    );

    await expect(adapter.getVenue(projectId, venueId)).resolves.toBeNull();
  });

  it.each([
    { data: null, error: { message: "provider detail" } },
    { data: { ...venueRow, status: "mystery" }, error: null },
  ])("fails closed for unsafe get response %#", async (get) => {
    const adapter = new SupabaseVenueRepositoryAdapter(
      clientWith(resultsWith({ get }), emptyCaptures()),
    );

    await expect(adapter.getVenue(projectId, venueId)).rejects.toThrow(
      "Venue query failed.",
    );
  });
});

describe("SupabaseVenueRepositoryAdapter update", () => {
  it("updates only ordinary editable venue fields", async () => {
    const captures = emptyCaptures();
    const adapter = new SupabaseVenueRepositoryAdapter(
      clientWith(resultsWith(), captures),
    );

    await adapter.updateVenueCore({
      projectId,
      venueId,
      name: "Venue Alpha",
      code: "P2",
      websiteUrl: "https://example.invalid",
      city: "Paris",
    });

    expect(captures.update).toEqual({
      name: "Venue Alpha",
      code: "P2",
      website_url: "https://example.invalid",
      city: "Paris",
    });
    expect(captures.updateSelect).toBe(columns);
    expect(captures.idValue).toBe(venueId);
  });

  it.each([
    { data: null, error: { message: "policy detail" } },
    { data: { ...venueRow, revision: 0 }, error: null },
  ])("fails closed for unsafe update response %#", async (update) => {
    const adapter = new SupabaseVenueRepositoryAdapter(
      clientWith(resultsWith({ update }), emptyCaptures()),
    );

    await expect(
      adapter.updateVenueCore({
        projectId,
        venueId,
        name: "Venue Alpha",
        code: null,
        websiteUrl: null,
        city: null,
      }),
    ).rejects.toThrow("Venue update failed.");
  });
});

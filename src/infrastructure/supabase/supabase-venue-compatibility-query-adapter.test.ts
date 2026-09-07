import { describe, expect, it } from "vitest";
import {
  SupabaseVenueCompatibilityQueryAdapter,
  type SupabaseVenueCompatibilityClientLike,
} from "./supabase-venue-compatibility-query-adapter";

const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VENUE_ID = "a1000000-0000-4000-8000-000000000001";
const DEFINITION_ID = "a2000000-0000-4000-8000-000000000001";
const FACT_ID = "a3000000-0000-4000-8000-000000000001";
const OBSERVATION_ID = "a4000000-0000-4000-8000-000000000001";

type TableName =
  | "projects"
  | "venues"
  | "fact_definitions"
  | "facts"
  | "fact_observations";

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}

interface QueryCapture {
  readonly table: TableName;
  readonly columns: string;
  readonly filters: Array<readonly [string, string]>;
  inFilter: readonly [string, readonly string[]] | null;
}

interface TestBuilder extends PromiseLike<Result> {
  eq(column: string, value: string): TestBuilder;
  in(column: string, values: readonly string[]): TestBuilder;
  maybeSingle(): PromiseLike<Result>;
}

type Results = Readonly<Record<TableName, Result>>;

function definitionRow() {
  return {
    id: DEFINITION_ID,
    project_id: PROJECT_ID,
    key: "parking",
    label: "Parking",
    entity_type: "venue",
    value_type: "boolean",
    unit: null,
    priority: "important",
    weight: null,
    freshness_policy: null,
    system_defined: false,
    options_json: null,
    evaluation_rule_json: { type: "boolean_equals", expected: true },
    revision: 1,
  };
}

function factRow(retainedObservationId: string | null = OBSERVATION_ID) {
  return {
    id: FACT_ID,
    project_id: PROJECT_ID,
    target_type: "venue",
    target_id: VENUE_ID,
    definition_id: DEFINITION_ID,
    state: "known",
    retained_value: true,
    retained_observation_id: retainedObservationId,
    stale_at: null,
    revision: 1,
  };
}

function successResults(
  overrides: Partial<Record<TableName, Result>> = {},
): Results {
  return {
    projects: {
      data: { id: PROJECT_ID, target_guest_count: 160 },
      error: null,
    },
    venues: { data: { id: VENUE_ID, project_id: PROJECT_ID }, error: null },
    fact_definitions: { data: [definitionRow()], error: null },
    facts: { data: [factRow()], error: null },
    fact_observations: {
      data: [
        {
          id: OBSERVATION_ID,
          project_id: PROJECT_ID,
          fact_id: FACT_ID,
          observation_status: "active",
        },
      ],
      error: null,
    },
    ...overrides,
  };
}

function builder(result: Result, capture: QueryCapture): TestBuilder {
  return Object.assign(Promise.resolve(result), {
    eq(column: string, value: string) {
      capture.filters.push([column, value]);
      return builder(result, capture);
    },
    in(column: string, values: readonly string[]) {
      capture.inFilter = [column, [...values]];
      return builder(result, capture);
    },
    maybeSingle() {
      return Promise.resolve(result);
    },
  });
}

function clientWith(
  results: Results,
  captures: QueryCapture[],
): SupabaseVenueCompatibilityClientLike {
  return {
    from(table) {
      return {
        select(columns) {
          const capture: QueryCapture = {
            table,
            columns,
            filters: [],
            inFilter: null,
          };
          captures.push(capture);
          return builder(results[table], capture);
        },
      };
    },
  };
}

function adapterWith(
  results: Results = successResults(),
  captures: QueryCapture[] = [],
) {
  return new SupabaseVenueCompatibilityQueryAdapter(
    clientWith(results, captures),
  );
}

describe("SupabaseVenueCompatibilityQueryAdapter reads", () => {
  it("loads project-scoped compatibility inputs and retained evidence", async () => {
    const captures: QueryCapture[] = [];
    const result = await adapterWith(
      successResults(),
      captures,
    ).loadVenueCompatibilityInputs(PROJECT_ID, VENUE_ID);
    expect(result).toMatchObject({
      projectId: PROJECT_ID,
      venueId: VENUE_ID,
      projectTargetGuestCount: 160,
    });
    expect(result?.snapshots[0]).toMatchObject({
      state: "known",
      retainedValue: true,
      retainedObservationStatus: "active",
    });
    expect(captures.map((item) => item.table)).toEqual([
      "projects",
      "venues",
      "fact_definitions",
      "facts",
      "fact_observations",
    ]);
    expect(captures[4]?.inFilter).toEqual(["id", [OBSERVATION_ID]]);
  });

  it("skips the observation query when no evidence is retained", async () => {
    const captures: QueryCapture[] = [];
    const results = successResults({
      facts: { data: [factRow(null)], error: null },
    });
    const result = await adapterWith(results, captures)
      .loadVenueCompatibilityInputs(PROJECT_ID, VENUE_ID);
    expect(result?.snapshots[0]?.retainedObservationStatus).toBeNull();
    expect(captures.map((item) => item.table)).not.toContain(
      "fact_observations",
    );
  });
});

describe("SupabaseVenueCompatibilityQueryAdapter absence handling", () => {
  it("returns null when the project is unavailable", async () => {
    const captures: QueryCapture[] = [];
    const results = successResults({
      projects: { data: null, error: null },
    });
    await expect(
      adapterWith(results, captures).loadVenueCompatibilityInputs(
        PROJECT_ID,
        VENUE_ID,
      ),
    ).resolves.toBeNull();
    expect(captures.map((item) => item.table)).toEqual(["projects"]);
  });

  it("returns null when the venue is unavailable", async () => {
    const captures: QueryCapture[] = [];
    const results = successResults({ venues: { data: null, error: null } });
    await expect(
      adapterWith(results, captures).loadVenueCompatibilityInputs(
        PROJECT_ID,
        VENUE_ID,
      ),
    ).resolves.toBeNull();
    expect(captures.map((item) => item.table)).toEqual([
      "projects",
      "venues",
    ]);
  });
});

describe("SupabaseVenueCompatibilityQueryAdapter failures", () => {
  it.each([
    ["project provider error", { projects: { data: null, error: {} } }],
    [
      "non-array definitions",
      { fact_definitions: { data: {}, error: null } },
    ],
    ["fact provider error", { facts: { data: null, error: {} } }],
    [
      "observation provider error",
      { fact_observations: { data: null, error: {} } },
    ],
  ])("fails closed for %s", async (_label, overrides) => {
    const results = successResults(overrides);
    await expect(
      adapterWith(results).loadVenueCompatibilityInputs(PROJECT_ID, VENUE_ID),
    ).rejects.toThrow("Venue compatibility query failed.");
  });

  it("fails closed when the provider throws", async () => {
    const client: SupabaseVenueCompatibilityClientLike = {
      from() {
        throw new Error("provider detail");
      },
    };
    const adapter = new SupabaseVenueCompatibilityQueryAdapter(client);
    await expect(
      adapter.loadVenueCompatibilityInputs(PROJECT_ID, VENUE_ID),
    ).rejects.toThrow("Venue compatibility query failed.");
  });
});

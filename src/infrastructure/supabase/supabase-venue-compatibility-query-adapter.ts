import type {
  VenueCompatibilityInputs,
  VenueCompatibilityQueryPort,
} from "@application/venues/venue-compatibility-query-port";
import {
  parseVenueCompatibilityInputs,
  retainedObservationIds,
} from "./parse-venue-compatibility-inputs";

const PROJECT_COLUMNS = "id,target_guest_count";
const VENUE_COLUMNS = "id,project_id";
const DEFINITION_COLUMNS =
  "id,project_id,key,label,entity_type,value_type,unit,priority,weight,freshness_policy,system_defined,options_json,evaluation_rule_json,revision";
const FACT_COLUMNS =
  "id,project_id,target_type,target_id,definition_id,state,retained_value,retained_observation_id,stale_at,revision";
const OBSERVATION_COLUMNS = "id,project_id,fact_id,observation_status";
const QUERY_FAILED = "Venue compatibility query failed.";

type CompatibilityTableName =
  | "projects"
  | "venues"
  | "fact_definitions"
  | "facts"
  | "fact_observations";

type QueryFilter = readonly [string, string];

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface CompatibilityQueryBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): CompatibilityQueryBuilder;
  in(column: string, values: readonly string[]): CompatibilityQueryBuilder;
  maybeSingle(): PromiseLike<SupabaseResult>;
}

interface CompatibilityTable {
  select(columns: string): CompatibilityQueryBuilder;
}

export interface SupabaseVenueCompatibilityClientLike {
  from(table: CompatibilityTableName): CompatibilityTable;
}

function queryFailure(): never {
  throw new Error(QUERY_FAILED);
}

function filteredQuery(
  client: SupabaseVenueCompatibilityClientLike,
  table: CompatibilityTableName,
  columns: string,
  filters: readonly QueryFilter[],
): CompatibilityQueryBuilder {
  let query = client.from(table).select(columns);
  for (const [column, value] of filters) query = query.eq(column, value);
  return query;
}

async function maybeRow(
  client: SupabaseVenueCompatibilityClientLike,
  table: CompatibilityTableName,
  columns: string,
  filters: readonly QueryFilter[],
): Promise<unknown | null> {
  const { data, error } = await filteredQuery(
    client,
    table,
    columns,
    filters,
  ).maybeSingle();
  if (error !== null) queryFailure();
  return data;
}

async function listRows(
  client: SupabaseVenueCompatibilityClientLike,
  table: CompatibilityTableName,
  columns: string,
  filters: readonly QueryFilter[],
): Promise<readonly unknown[]> {
  const { data, error } = await filteredQuery(client, table, columns, filters);
  if (error !== null || !Array.isArray(data)) queryFailure();
  return data;
}

async function retainedObservations(
  client: SupabaseVenueCompatibilityClientLike,
  projectId: string,
  facts: readonly unknown[],
): Promise<readonly unknown[]> {
  const ids = retainedObservationIds(facts);
  if (ids.length === 0) return [];
  const query = filteredQuery(
    client,
    "fact_observations",
    OBSERVATION_COLUMNS,
    [["project_id", projectId]],
  ).in("id", ids);
  const { data, error } = await query;
  if (error !== null || !Array.isArray(data)) queryFailure();
  return data;
}

export class SupabaseVenueCompatibilityQueryAdapter
  implements VenueCompatibilityQueryPort
{
  constructor(private readonly client: SupabaseVenueCompatibilityClientLike) {}

  async loadVenueCompatibilityInputs(
    projectId: string,
    venueId: string,
  ): Promise<VenueCompatibilityInputs | null> {
    try {
      const project = await maybeRow(this.client, "projects", PROJECT_COLUMNS, [
        ["id", projectId],
      ]);
      if (project === null) return null;
      const venue = await maybeRow(this.client, "venues", VENUE_COLUMNS, [
        ["project_id", projectId],
        ["id", venueId],
      ]);
      if (venue === null) return null;
      const definitions = await listRows(
        this.client,
        "fact_definitions",
        DEFINITION_COLUMNS,
        [
          ["project_id", projectId],
          ["entity_type", "venue"],
        ],
      );
      const facts = await listRows(this.client, "facts", FACT_COLUMNS, [
        ["project_id", projectId],
        ["target_type", "venue"],
        ["target_id", venueId],
      ]);
      const observations = await retainedObservations(
        this.client,
        projectId,
        facts,
      );
      return parseVenueCompatibilityInputs(
        { project, venue, definitions, facts, observations },
        projectId,
        venueId,
      );
    } catch {
      throw new Error(QUERY_FAILED);
    }
  }
}

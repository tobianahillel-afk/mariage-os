import {
  VenueFactPersistenceError,
  type VenueFactPersistenceErrorCode,
} from "@application/facts/venue-fact-persistence-error";
import type {
  CreateVenueFactDefinitionInput,
  RetainedVenueFactRecord,
  SetRetainedVenueFactInput,
  UpdateVenueFactDefinitionInput,
  VenueFactDefinitionRecord,
  VenueFactPort,
} from "@application/facts/venue-fact-service";
import {
  parseRetainedVenueFactRow,
  parseVenueFactDefinitionRow,
} from "./parse-venue-fact-row";

const DEFINITION_COLUMNS =
  "id,project_id,key,label,entity_type,value_type,unit,priority,weight,freshness_policy,system_defined,options_json,evaluation_rule_json,revision";
const DEFINITION_QUERY_FAILED = "Venue fact definition query failed.";
const DEFINITION_MUTATION_FAILED = "Venue fact definition mutation failed.";
const FACT_MUTATION_FAILED = "Venue fact mutation failed.";
const CONFLICT_CODES = new Set(["40001", "23505"]);
const BACKEND_CODES = new Set(["PGRST000", "PGRST001", "PGRST002", "PGRST003"]);

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface DefinitionQueryBuilder {
  eq(column: string, value: string): DefinitionQueryBuilder;
  single(): PromiseLike<SupabaseResult>;
}

interface DefinitionTable {
  select(columns: string): DefinitionQueryBuilder;
}

export interface SupabaseVenueFactClientLike {
  from(table: "fact_definitions"): DefinitionTable;
  rpc(
    functionName:
      | "create_venue_fact_definition"
      | "update_venue_fact_definition"
      | "set_retained_venue_fact",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function providerErrorCode(value: unknown): string {
  const code = (Object(value) as Record<string, unknown>).code;
  return typeof code === "string" ? code : "";
}

function classifyProviderError(error: unknown): VenueFactPersistenceErrorCode {
  const code = providerErrorCode(error);
  if (CONFLICT_CODES.has(code)) return "conflict";
  if (code === "42501") return "authorization_failed";
  if (BACKEND_CODES.has(code)) return "backend_unavailable";
  if (code === "P0001" || code.startsWith("22") || code.startsWith("23")) {
    return "data_integrity_failed";
  }
  return "persistence_failed";
}

function fail(code: VenueFactPersistenceErrorCode, message: string): never {
  throw new VenueFactPersistenceError(code, message);
}

async function providerResult(
  call: () => PromiseLike<SupabaseResult>,
  message: string,
): Promise<SupabaseResult> {
  try {
    return await call();
  } catch {
    fail("backend_unavailable", message);
  }
}

function providerData(result: SupabaseResult, message: string): unknown {
  if (result.error !== null) fail(classifyProviderError(result.error), message);
  return result.data;
}

function definitionData(
  data: unknown,
  projectId: string,
  definitionId: string | undefined,
  message: string,
): VenueFactDefinitionRecord {
  try {
    return parseVenueFactDefinitionRow(data, projectId, definitionId);
  } catch {
    fail("provider_response_invalid", message);
  }
}

function factData(
  data: unknown,
  input: SetRetainedVenueFactInput,
  definition: VenueFactDefinitionRecord,
): RetainedVenueFactRecord {
  try {
    return parseRetainedVenueFactRow(
      data,
      input.projectId,
      input.venueId,
      definition,
    );
  } catch {
    fail("provider_response_invalid", FACT_MUTATION_FAILED);
  }
}

function definitionPayload(
  input: CreateVenueFactDefinitionInput,
): Readonly<Record<string, unknown>> {
  return {
    target_project_id: input.projectId,
    target_key: input.key,
    target_label: input.label,
    target_value_type: input.valueType,
    target_unit: input.unit,
    target_priority: input.priority,
    target_weight: input.weight,
    target_freshness_policy: input.freshnessPolicy,
    target_options_json: input.optionsJson,
    target_evaluation_rule_json: input.evaluationRuleJson,
  };
}

export class SupabaseVenueFactAdapter implements VenueFactPort {
  constructor(private readonly client: SupabaseVenueFactClientLike) {}

  async getDefinition(
    projectId: string,
    definitionId: string,
  ): Promise<VenueFactDefinitionRecord> {
    const result = await providerResult(
      () =>
        this.client
          .from("fact_definitions")
          .select(DEFINITION_COLUMNS)
          .eq("project_id", projectId)
          .eq("id", definitionId)
          .single(),
      DEFINITION_QUERY_FAILED,
    );
    const data = providerData(result, DEFINITION_QUERY_FAILED);
    return definitionData(
      data,
      projectId,
      definitionId,
      DEFINITION_QUERY_FAILED,
    );
  }

  async createDefinition(
    input: CreateVenueFactDefinitionInput,
  ): Promise<VenueFactDefinitionRecord> {
    const result = await providerResult(
      () =>
        this.client.rpc(
          "create_venue_fact_definition",
          definitionPayload(input),
        ),
      DEFINITION_MUTATION_FAILED,
    );
    const data = providerData(result, DEFINITION_MUTATION_FAILED);
    return definitionData(
      data,
      input.projectId,
      undefined,
      DEFINITION_MUTATION_FAILED,
    );
  }

  async updateDefinition(
    input: UpdateVenueFactDefinitionInput,
  ): Promise<VenueFactDefinitionRecord> {
    const result = await providerResult(
      () =>
        this.client.rpc("update_venue_fact_definition", {
          target_project_id: input.projectId,
          target_definition_id: input.definitionId,
          target_expected_revision: input.expectedRevision,
          target_label: input.label,
          target_priority: input.priority,
          target_weight: input.weight,
          target_freshness_policy: input.freshnessPolicy,
          target_options_json: input.optionsJson,
          target_evaluation_rule_json: input.evaluationRuleJson,
        }),
      DEFINITION_MUTATION_FAILED,
    );
    const data = providerData(result, DEFINITION_MUTATION_FAILED);
    return definitionData(
      data,
      input.projectId,
      input.definitionId,
      DEFINITION_MUTATION_FAILED,
    );
  }

  async setRetainedFact(
    input: SetRetainedVenueFactInput,
  ): Promise<RetainedVenueFactRecord> {
    const definition = await this.getDefinition(
      input.projectId,
      input.definitionId,
    );
    const result = await providerResult(
      () =>
        this.client.rpc("set_retained_venue_fact", {
          target_project_id: input.projectId,
          target_venue_id: input.venueId,
          target_definition_id: input.definitionId,
          target_expected_revision: input.expectedRevision,
          target_state: input.state,
          target_retained_value: input.retainedValue,
        }),
      FACT_MUTATION_FAILED,
    );
    return factData(
      providerData(result, FACT_MUTATION_FAILED),
      input,
      definition,
    );
  }
}

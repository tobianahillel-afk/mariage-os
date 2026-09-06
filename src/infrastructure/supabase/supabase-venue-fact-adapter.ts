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

function failure(message: string): never {
  throw new Error(message);
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
    try {
      const { data, error } = await this.client
        .from("fact_definitions")
        .select(DEFINITION_COLUMNS)
        .eq("project_id", projectId)
        .eq("id", definitionId)
        .single();
      if (error !== null) failure("Venue fact definition query failed.");
      return parseVenueFactDefinitionRow(data, projectId);
    } catch {
      throw new Error("Venue fact definition query failed.");
    }
  }

  async createDefinition(
    input: CreateVenueFactDefinitionInput,
  ): Promise<VenueFactDefinitionRecord> {
    try {
      const { data, error } = await this.client.rpc(
        "create_venue_fact_definition",
        definitionPayload(input),
      );
      if (error !== null) failure("Venue fact definition mutation failed.");
      return parseVenueFactDefinitionRow(data, input.projectId);
    } catch {
      throw new Error("Venue fact definition mutation failed.");
    }
  }

  async updateDefinition(
    input: UpdateVenueFactDefinitionInput,
  ): Promise<VenueFactDefinitionRecord> {
    try {
      const { data, error } = await this.client.rpc(
        "update_venue_fact_definition",
        {
          target_project_id: input.projectId,
          target_definition_id: input.definitionId,
          target_expected_revision: input.expectedRevision,
          target_label: input.label,
          target_priority: input.priority,
          target_weight: input.weight,
          target_freshness_policy: input.freshnessPolicy,
          target_options_json: input.optionsJson,
          target_evaluation_rule_json: input.evaluationRuleJson,
        },
      );
      if (error !== null) failure("Venue fact definition mutation failed.");
      return parseVenueFactDefinitionRow(data, input.projectId);
    } catch {
      throw new Error("Venue fact definition mutation failed.");
    }
  }

  async setRetainedFact(
    input: SetRetainedVenueFactInput,
  ): Promise<RetainedVenueFactRecord> {
    try {
      const definition = await this.getDefinition(
        input.projectId,
        input.definitionId,
      );
      const { data, error } = await this.client.rpc("set_retained_venue_fact", {
        target_project_id: input.projectId,
        target_venue_id: input.venueId,
        target_definition_id: input.definitionId,
        target_expected_revision: input.expectedRevision,
        target_state: input.state,
        target_retained_value: input.retainedValue,
      });
      if (error !== null) failure("Venue fact mutation failed.");
      return parseRetainedVenueFactRow(
        data,
        input.projectId,
        input.venueId,
        definition,
      );
    } catch {
      throw new Error("Venue fact mutation failed.");
    }
  }
}

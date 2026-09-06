import { describe, expect, it } from "vitest";
import type {
  CreateVenueFactDefinitionInput,
  SetRetainedVenueFactInput,
  UpdateVenueFactDefinitionInput,
} from "@application/facts/venue-fact-service";
import {
  SupabaseVenueFactAdapter,
  type SupabaseVenueFactClientLike,
} from "./supabase-venue-fact-adapter";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";

const definitionRow = {
  id: definitionId,
  project_id: projectId,
  key: "external_caterer_allowed",
  label: "External caterer allowed",
  entity_type: "venue",
  value_type: "boolean",
  unit: null,
  priority: "blocking",
  weight: 3,
  freshness_policy: null,
  system_defined: false,
  options_json: null,
  evaluation_rule_json: { type: "boolean_equals", expected: true },
  revision: 1,
};

const factRow = {
  id: "84444444-4444-4444-8444-444444444444",
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
  state: "known",
  retained_value: false,
  revision: 1,
};

interface QueryBuilder {
  eq(column: string, value: string): QueryBuilder;
  single(): PromiseLike<{ data: unknown; error: unknown }>;
}

class FakeClient implements SupabaseVenueFactClientLike {
  queryResult: { data: unknown; error: unknown } = { data: definitionRow, error: null };
  rpcResult: { data: unknown; error: unknown } = { data: definitionRow, error: null };
  readonly queryFilters: Array<[string, string]> = [];
  lastRpc: { name: string; args: Readonly<Record<string, unknown>> } | null = null;

  from(_table: "fact_definitions") {
    return {
      select: (_columns: string): QueryBuilder => {
        const builder: QueryBuilder = {
          eq: (column, value) => {
            this.queryFilters.push([column, value]);
            return builder;
          },
          single: () => Promise.resolve(this.queryResult),
        };
        return builder;
      },
    };
  }

  rpc(
    functionName: Parameters<SupabaseVenueFactClientLike["rpc"]>[0],
    args: Readonly<Record<string, unknown>>,
  ) {
    this.lastRpc = { name: functionName, args };
    return Promise.resolve(this.rpcResult);
  }
}

const createInput: CreateVenueFactDefinitionInput = {
  projectId,
  key: "external_caterer_allowed",
  label: "External caterer allowed",
  valueType: "boolean",
  unit: null,
  priority: "blocking",
  weight: 3,
  freshnessPolicy: null,
  optionsJson: null,
  evaluationRuleJson: { type: "boolean_equals", expected: true },
};

const updateInput: UpdateVenueFactDefinitionInput = {
  projectId,
  definitionId,
  expectedRevision: 1,
  label: "External caterer allowed",
  priority: "blocking",
  weight: 3,
  freshnessPolicy: null,
  optionsJson: null,
  evaluationRuleJson: { type: "boolean_equals", expected: true },
};

const factInput: SetRetainedVenueFactInput = {
  projectId,
  venueId,
  definitionId,
  expectedRevision: null,
  state: "known",
  retainedValue: false,
};

describe("SupabaseVenueFactAdapter definitions", () => {
  it("queries one project-scoped definition and parses the response", async () => {
    const client = new FakeClient();
    const adapter = new SupabaseVenueFactAdapter(client);
    const result = await adapter.getDefinition(projectId, definitionId);
    expect(result.id).toBe(definitionId);
    expect(client.queryFilters).toEqual([
      ["project_id", projectId],
      ["id", definitionId],
    ]);
  });

  it("creates a definition through the narrow RPC", async () => {
    const client = new FakeClient();
    const adapter = new SupabaseVenueFactAdapter(client);
    await expect(adapter.createDefinition(createInput)).resolves.toMatchObject({
      id: definitionId,
      key: "external_caterer_allowed",
    });
    expect(client.lastRpc).toEqual({
      name: "create_venue_fact_definition",
      args: {
        target_project_id: projectId,
        target_key: "external_caterer_allowed",
        target_label: "External caterer allowed",
        target_value_type: "boolean",
        target_unit: null,
        target_priority: "blocking",
        target_weight: 3,
        target_freshness_policy: null,
        target_options_json: null,
        target_evaluation_rule_json: { type: "boolean_equals", expected: true },
      },
    });
  });

  it("updates only mutable definition fields through the narrow RPC", async () => {
    const client = new FakeClient();
    client.rpcResult = { data: { ...definitionRow, revision: 2 }, error: null };
    const adapter = new SupabaseVenueFactAdapter(client);
    await expect(adapter.updateDefinition(updateInput)).resolves.toMatchObject({
      id: definitionId,
      revision: 2,
    });
    expect(client.lastRpc?.name).toBe("update_venue_fact_definition");
    expect(client.lastRpc?.args).not.toHaveProperty("target_key");
    expect(client.lastRpc?.args).not.toHaveProperty("target_value_type");
    expect(client.lastRpc?.args).not.toHaveProperty("target_unit");
  });

  it("fails closed on query, mutation and malformed provider responses", async () => {
    const queryClient = new FakeClient();
    queryClient.queryResult = { data: null, error: { message: "hidden" } };
    await expect(
      new SupabaseVenueFactAdapter(queryClient).getDefinition(projectId, definitionId),
    ).rejects.toThrow("Venue fact definition query failed.");

    const createClient = new FakeClient();
    createClient.rpcResult = { data: null, error: { message: "hidden" } };
    await expect(
      new SupabaseVenueFactAdapter(createClient).createDefinition(createInput),
    ).rejects.toThrow("Venue fact definition mutation failed.");

    const updateClient = new FakeClient();
    updateClient.rpcResult = { data: { ...definitionRow, id: "bad" }, error: null };
    await expect(
      new SupabaseVenueFactAdapter(updateClient).updateDefinition(updateInput),
    ).rejects.toThrow("Venue fact definition mutation failed.");
  });
});

describe("SupabaseVenueFactAdapter retained facts", () => {
  it("revalidates the definition and retained fact provider response", async () => {
    const client = new FakeClient();
    client.rpcResult = { data: factRow, error: null };
    const adapter = new SupabaseVenueFactAdapter(client);
    await expect(adapter.setRetainedFact(factInput)).resolves.toMatchObject({
      projectId,
      venueId,
      definitionId,
      retainedValue: false,
    });
    expect(client.lastRpc).toEqual({
      name: "set_retained_venue_fact",
      args: {
        target_project_id: projectId,
        target_venue_id: venueId,
        target_definition_id: definitionId,
        target_expected_revision: null,
        target_state: "known",
        target_retained_value: false,
      },
    });
  });

  it("fails closed on retained-fact RPC and provider-shape errors", async () => {
    const rpcClient = new FakeClient();
    rpcClient.rpcResult = { data: null, error: { message: "hidden" } };
    await expect(
      new SupabaseVenueFactAdapter(rpcClient).setRetainedFact(factInput),
    ).rejects.toThrow("Venue fact mutation failed.");

    const parseClient = new FakeClient();
    parseClient.rpcResult = {
      data: { ...factRow, retained_value: "false" },
      error: null,
    };
    await expect(
      new SupabaseVenueFactAdapter(parseClient).setRetainedFact(factInput),
    ).rejects.toThrow("Venue fact mutation failed.");

    const definitionClient = new FakeClient();
    definitionClient.queryResult = { data: null, error: { message: "hidden" } };
    await expect(
      new SupabaseVenueFactAdapter(definitionClient).setRetainedFact(factInput),
    ).rejects.toThrow("Venue fact mutation failed.");
  });
});

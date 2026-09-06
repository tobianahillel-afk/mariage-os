import { describe, expect, it } from "vitest";
import type {
  CreateVenueFactDefinitionInput,
  SetRetainedVenueFactInput,
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

const factInput: SetRetainedVenueFactInput = {
  projectId,
  venueId,
  definitionId,
  expectedRevision: null,
  state: "known",
  retainedValue: false,
};

function rpcErrorClient(error: unknown): SupabaseVenueFactClientLike {
  return {
    from: () => {
      throw new Error("query not used");
    },
    rpc: () => Promise.resolve({ data: null, error }),
  };
}

function rpcRejectionClient(): SupabaseVenueFactClientLike {
  return {
    from: () => {
      throw new Error("query not used");
    },
    rpc: () => Promise.reject(new Error("secret transport detail")),
  };
}

interface QueryBuilder {
  eq(column: string, value: string): QueryBuilder;
  single(): PromiseLike<{ data: unknown; error: unknown }>;
}

function retainedConflictClient(): SupabaseVenueFactClientLike {
  const query: QueryBuilder = {
    eq: () => query,
    single: () => Promise.resolve({ data: definitionRow, error: null }),
  };
  return {
    from: () => ({ select: () => query }),
    rpc: () =>
      Promise.resolve({
        data: null,
        error: { code: "23505", message: "secret constraint detail" },
      }),
  };
}

describe("Supabase Venue fact provider error mapping", () => {
  it.each([
    [{ code: "40001", message: "secret" }, "conflict"],
    [{ code: "23505", message: "secret" }, "conflict"],
    [{ code: "42501", message: "secret" }, "authorization_failed"],
    [{ code: "PGRST001", message: "secret" }, "backend_unavailable"],
    [{ code: "P0001", message: "secret" }, "data_integrity_failed"],
    [{ code: "22000", message: "secret" }, "data_integrity_failed"],
    [{ code: "23503", message: "secret" }, "data_integrity_failed"],
    [{ message: "secret" }, "persistence_failed"],
  ] as const)("maps provider failure %# to %s", async (error, code) => {
    const adapter = new SupabaseVenueFactAdapter(rpcErrorClient(error));
    await expect(adapter.createDefinition(createInput)).rejects.toMatchObject({
      name: "VenueFactPersistenceError",
      code,
      message: "Venue fact definition mutation failed.",
    });
  });

  it("maps transport rejection without leaking provider detail", async () => {
    const adapter = new SupabaseVenueFactAdapter(rpcRejectionClient());
    await expect(adapter.createDefinition(createInput)).rejects.toMatchObject({
      code: "backend_unavailable",
      message: "Venue fact definition mutation failed.",
    });
  });

  it("maps malformed successful responses as provider response failures", async () => {
    const adapter = new SupabaseVenueFactAdapter(
      rpcErrorClient(null),
    );
    await expect(adapter.createDefinition(createInput)).rejects.toMatchObject({
      code: "provider_response_invalid",
      message: "Venue fact definition mutation failed.",
    });
  });

  it("normalizes retained-fact first-create uniqueness races", async () => {
    const adapter = new SupabaseVenueFactAdapter(retainedConflictClient());
    await expect(adapter.setRetainedFact(factInput)).rejects.toMatchObject({
      code: "conflict",
      message: "Venue fact mutation failed.",
    });
  });
});

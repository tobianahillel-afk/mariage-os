import { describe, expect, it } from "vitest";
import type {
  AppendVenueFactObservationInput,
  CreateVenueFactSourceInput,
} from "@application/facts/venue-fact-evidence-service";
import {
  SupabaseVenueFactEvidenceAdapter,
  type SupabaseVenueFactEvidenceClientLike,
} from "./supabase-venue-fact-evidence-adapter";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";

const factRow = {
  id: factId,
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
};

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

const sourceInput: CreateVenueFactSourceInput = {
  projectId,
  sourceType: "written_confirmation",
  title: "Venue email",
  url: "https://venue.example/confirmation",
  evidenceLevel: "confirmed_for_event",
  observedAt: "2026-09-07T06:20:00.000Z",
  notes: null,
  status: "active",
};

const appendInput: AppendVenueFactObservationInput = {
  projectId,
  factId,
  value: false,
  rawValueText: "No",
  evidenceLevel: "confirmed_for_event",
  confidence: "high",
  observedAt: "2026-09-07T06:30:00.000Z",
  note: null,
  supersedesObservationId: null,
};

function rpcErrorClient(error: unknown): SupabaseVenueFactEvidenceClientLike {
  return {
    from: () => {
      throw new Error("query not used");
    },
    rpc: () => Promise.resolve({ data: null, error }),
  };
}

function rpcRejectionClient(): SupabaseVenueFactEvidenceClientLike {
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

function queryClient(
  factData: unknown,
  definitionData: unknown = definitionRow,
  rpcData: unknown = null,
): SupabaseVenueFactEvidenceClientLike {
  return {
    from: (table) => ({
      select: () => {
        const query: QueryBuilder = {
          eq: () => query,
          single: () =>
            Promise.resolve({
              data: table === "facts" ? factData : definitionData,
              error: null,
            }),
        };
        return query;
      },
    }),
    rpc: () => Promise.resolve({ data: rpcData, error: null }),
  };
}

describe("Supabase venue fact evidence provider failures", () => {
  it.each([
    [{ code: "40001", message: "secret" }, "conflict"],
    [{ code: "23505", message: "secret" }, "conflict"],
    [{ code: "42501", message: "secret" }, "authorization_failed"],
    [{ code: "PGRST001", message: "secret" }, "backend_unavailable"],
    [{ code: "P0001", message: "secret" }, "data_integrity_failed"],
    [{ code: "22023", message: "secret" }, "data_integrity_failed"],
    [{ code: "23503", message: "secret" }, "data_integrity_failed"],
    [{ message: "secret" }, "persistence_failed"],
  ] as const)("maps provider failure %# to %s", async (error, code) => {
    const adapter = new SupabaseVenueFactEvidenceAdapter(rpcErrorClient(error));
    await expect(adapter.createSource(sourceInput)).rejects.toMatchObject({
      name: "VenueFactPersistenceError",
      code,
      message: "Venue fact source mutation failed.",
    });
  });

  it("maps transport rejection without leaking provider detail", async () => {
    const adapter = new SupabaseVenueFactEvidenceAdapter(rpcRejectionClient());
    await expect(adapter.createSource(sourceInput)).rejects.toMatchObject({
      code: "backend_unavailable",
      message: "Venue fact source mutation failed.",
    });
  });

  it("rejects malformed successful source responses", async () => {
    const adapter = new SupabaseVenueFactEvidenceAdapter(rpcErrorClient(null));
    await expect(adapter.createSource(sourceInput)).rejects.toMatchObject({
      code: "provider_response_invalid",
      message: "Venue fact source mutation failed.",
    });
  });

  it("rejects cross-project fact context responses", async () => {
    const adapter = new SupabaseVenueFactEvidenceAdapter(
      queryClient({ ...factRow, project_id: definitionId }),
    );
    await expect(adapter.getFactContext(projectId, factId)).rejects.toMatchObject({
      code: "provider_response_invalid",
      message: "Venue fact evidence context query failed.",
    });
  });

  it("rejects malformed observation success after a valid context lookup", async () => {
    const adapter = new SupabaseVenueFactEvidenceAdapter(
      queryClient(factRow, definitionRow, { malformed: true }),
    );
    await expect(adapter.appendObservation(appendInput)).rejects.toMatchObject({
      code: "provider_response_invalid",
      message: "Venue fact observation mutation failed.",
    });
  });
});

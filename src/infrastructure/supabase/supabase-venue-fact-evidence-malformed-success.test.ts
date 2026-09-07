import { expect, it } from "vitest";
import {
  SupabaseVenueFactEvidenceAdapter,
  type SupabaseVenueFactEvidenceClientLike,
} from "./supabase-venue-fact-evidence-adapter";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";
const sourceId = "85555555-5555-4555-8555-555555555555";
const observationId = "86666666-6666-4666-8666-666666666666";

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

interface QueryBuilder {
  eq(column: string, value: string): QueryBuilder;
  single(): PromiseLike<{ data: unknown; error: unknown }>;
}

function client(
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
              data: table === "facts" ? factRow : definitionData,
              error: null,
            }),
        };
        return query;
      },
    }),
    rpc: () => Promise.resolve({ data: rpcData, error: null }),
  };
}

it("rejects a malformed successful definition response", async () => {
  const adapter = new SupabaseVenueFactEvidenceAdapter(
    client({ ...definitionRow, id: factId }),
  );
  await expect(adapter.getFactContext(projectId, factId)).rejects.toMatchObject({
    code: "provider_response_invalid",
    message: "Venue fact evidence context query failed.",
  });
});

it("rejects a malformed successful evidence-link response", async () => {
  const adapter = new SupabaseVenueFactEvidenceAdapter(client(undefined, {}));
  await expect(
    adapter.linkObservationSource({
      projectId,
      observationId,
      sourceId,
      isPrimary: true,
    }),
  ).rejects.toMatchObject({
    code: "provider_response_invalid",
    message: "Venue fact evidence link mutation failed.",
  });
});

it("rejects a malformed successful retained-resolution response", async () => {
  const adapter = new SupabaseVenueFactEvidenceAdapter(client(undefined, {}));
  await expect(
    adapter.resolveFromObservation({
      projectId,
      factId,
      observationId,
      expectedRevision: 1,
      state: "known",
      resolutionNote: null,
    }),
  ).rejects.toMatchObject({
    code: "provider_response_invalid",
    message: "Venue fact resolution mutation failed.",
  });
});

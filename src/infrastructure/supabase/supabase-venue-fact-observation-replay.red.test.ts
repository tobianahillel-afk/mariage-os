import { expect, it } from "vitest";
import type { AppendVenueFactObservationInput } from "@application/facts/venue-fact-evidence-service";
import {
  SupabaseVenueFactEvidenceAdapter,
  type SupabaseVenueFactEvidenceClientLike,
} from "./supabase-venue-fact-evidence-adapter";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";
const observationId = "86666666-6666-4666-8666-666666666666";
const actorId = "87777777-7777-4777-8777-777777777777";

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
  key: "visit_measurement_confirmed",
  label: "Visit measurement confirmed",
  entity_type: "venue",
  value_type: "boolean",
  unit: null,
  priority: "important",
  weight: 1,
  freshness_policy: null,
  system_defined: false,
  options_json: null,
  evaluation_rule_json: null,
  revision: 1,
};

const observationRow = {
  id: observationId,
  project_id: projectId,
  fact_id: factId,
  value: true,
  raw_value_text: "measured during visit",
  evidence_level: "observed",
  confidence: "high",
  observation_status: "active",
  superseded_by_observation_id: null,
  observed_at: "2026-10-05T09:00:00.000Z",
  note: "visit measurement",
  created_by: actorId,
};

it("sends the stable client observation id to the fact append RPC", async () => {
  const recorded: Array<Readonly<Record<string, unknown>>> = [];
  const client: SupabaseVenueFactEvidenceClientLike = {
    from: (table) => ({
      select: () => {
        const query = {
          eq: () => query,
          single: () =>
            Promise.resolve({
              data: table === "facts" ? factRow : definitionRow,
              error: null,
            }),
        };
        return query;
      },
    }),
    rpc: (_name, args) => {
      recorded.push(args);
      return Promise.resolve({ data: observationRow, error: null });
    },
  };
  const adapter = new SupabaseVenueFactEvidenceAdapter(client);
  const input = {
    projectId,
    factId,
    observationId,
    value: true,
    rawValueText: "measured during visit",
    evidenceLevel: "observed",
    confidence: "high",
    observedAt: "2026-10-05T09:00:00.000Z",
    note: "visit measurement",
    supersedesObservationId: null,
  } as AppendVenueFactObservationInput & { readonly observationId: string };

  await expect(adapter.appendObservation(input)).resolves.toMatchObject({
    id: observationId,
  });
  expect(recorded).toHaveLength(1);
  expect(recorded[0]).toMatchObject({
    target_project_id: projectId,
    target_fact_id: factId,
    target_observation_id: observationId,
  });
});

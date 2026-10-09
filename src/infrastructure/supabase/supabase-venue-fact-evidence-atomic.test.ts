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
const sourceId = "85555555-5555-4555-8555-555555555555";
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

const observationRow = {
  id: observationId,
  project_id: projectId,
  fact_id: factId,
  value: false,
  raw_value_text: "No",
  evidence_level: "confirmed_for_event",
  confidence: "high",
  observation_status: "active",
  superseded_by_observation_id: null,
  supersedes_observation_id: null,
  observed_at: "2026-09-07T06:30:00.000Z",
  note: null,
  created_by: actorId,
};

interface RecordedRpc {
  readonly name: string;
  readonly args: Readonly<Record<string, unknown>>;
}

function makeClient(
  rpcResult: (name: string) => unknown,
  recordedRpcs: RecordedRpc[] = [],
): SupabaseVenueFactEvidenceClientLike {
  return {
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
    rpc: (name, args) => {
      recordedRpcs.push({ name, args });
      return Promise.resolve({ data: rpcResult(name), error: null });
    },
  };
}

const appendInput: AppendVenueFactObservationInput = {
  projectId,
  factId,
  observationId,
  value: false,
  rawValueText: "No",
  evidenceLevel: "confirmed_for_event",
  confidence: "high",
  observedAt: "2026-09-07T06:30:00.000Z",
  note: null,
  supersedesObservationId: null,
};

type AtomicInput = Parameters<
  SupabaseVenueFactEvidenceAdapter["appendAtomicVisitObservation"]
>[0];

const atomicInput: AtomicInput = {
  ...appendInput,
  sourceId,
  expectedSourceRevision: 1,
  actorId,
};

const atomicReceipt = {
  observation: observationRow,
  link: {
    project_id: projectId,
    observation_id: observationId,
    source_id: sourceId,
    is_primary: true,
  },
  checkedSource: {
    projectId,
    sourceId,
    sourceType: "in_person_visit",
    checkedRevision: 1,
    checkedBy: actorId,
  },
};

it("maps one atomic RPC and verifies its receipt", async () => {
  const calls: RecordedRpc[] = [];
  const adapter = new SupabaseVenueFactEvidenceAdapter(
    makeClient(
      (name) =>
        name === "append_venue_fact_observation_visit_atomic"
          ? atomicReceipt
          : null,
      calls,
    ),
  );

  await expect(
    adapter.appendAtomicVisitObservation(atomicInput),
  ).resolves.toMatchObject({
    observation: { id: observationId, createdBy: actorId },
    link: { sourceId, isPrimary: true },
    checkedSource: { checkedRevision: 1, checkedBy: actorId },
  });
  expect(calls).toEqual([
    {
      name: "append_venue_fact_observation_visit_atomic",
      args: {
        target_project_id: projectId,
        target_fact_id: factId,
        target_observation_id: observationId,
        target_value: false,
        target_raw_value_text: "No",
        target_evidence_level: "confirmed_for_event",
        target_confidence: "high",
        target_observed_at: "2026-09-07T06:30:00.000Z",
        target_note: null,
        target_supersedes_observation_id: null,
        target_source_id: sourceId,
        target_expected_source_revision: 1,
      },
    },
  ]);
});

it("canonicalizes atomic replay observation identity", async () => {
  const calls: RecordedRpc[] = [];
  const adapter = new SupabaseVenueFactEvidenceAdapter(
    makeClient(() => atomicReceipt, calls),
  );
  await expect(
    adapter.appendAtomicVisitObservation({
      ...atomicInput,
      observationId: observationId.toUpperCase(),
    }),
  ).resolves.toMatchObject({ observation: { id: observationId } });
  expect(calls[0]?.args.target_observation_id).toBe(observationId);
});

it("does not ACK a malformed successful atomic payload", async () => {
  const adapter = new SupabaseVenueFactEvidenceAdapter(makeClient(() => null));
  await expect(
    adapter.appendAtomicVisitObservation(atomicInput),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("propagates atomic source-revision PT412 conflicts", async () => {
  const client: SupabaseVenueFactEvidenceClientLike = {
    ...makeClient(() => null),
    rpc: () =>
      Promise.resolve({
        data: null,
        error: { code: "PT412", message: "stale" },
      }),
  };
  const adapter = new SupabaseVenueFactEvidenceAdapter(client);
  await expect(
    adapter.appendAtomicVisitObservation(atomicInput),
  ).rejects.toMatchObject({ code: "conflict" });
});

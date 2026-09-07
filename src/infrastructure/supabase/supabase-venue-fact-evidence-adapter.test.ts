import { describe, expect, it } from "vitest";
import type {
  AppendVenueFactObservationInput,
  CreateVenueFactSourceInput,
  LinkObservationSourceInput,
  ResolveVenueFactObservationInput,
  UpdateVenueFactSourceInput,
} from "@application/facts/venue-fact-evidence-service";
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

const sourceRow = {
  id: sourceId,
  project_id: projectId,
  source_type: "written_confirmation",
  title: "Venue email",
  url: "https://venue.example/confirmation",
  evidence_level: "confirmed_for_event",
  observed_at: "2026-09-07T06:20:00.000Z",
  notes: null,
  status: "active",
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
  observed_at: "2026-09-07T06:30:00.000Z",
  note: null,
  created_by: actorId,
};

const resolvedRow = {
  id: factId,
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
  state: "known",
  retained_value: false,
  retained_observation_id: observationId,
  resolution_note: null,
  resolved_by: actorId,
  resolved_at: "2026-09-07T06:40:00.000Z",
  last_verified_at: null,
  stale_at: null,
  revision: 2,
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

const createSourceInput: CreateVenueFactSourceInput = {
  projectId,
  sourceType: "written_confirmation",
  title: "Venue email",
  url: "https://venue.example/confirmation",
  evidenceLevel: "confirmed_for_event",
  observedAt: "2026-09-07T06:20:00.000Z",
  notes: null,
  status: "active",
};

const updateSourceInput: UpdateVenueFactSourceInput = {
  ...createSourceInput,
  sourceId,
  expectedRevision: 1,
  status: "broken",
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

const linkInput: LinkObservationSourceInput = {
  projectId,
  observationId,
  sourceId,
  isPrimary: true,
};

const resolveInput: ResolveVenueFactObservationInput = {
  projectId,
  factId,
  observationId,
  expectedRevision: 1,
  state: "known",
  resolutionNote: null,
};

describe("Supabase venue fact evidence adapter", () => {
  it("loads a project-scoped fact context and definition", async () => {
    const adapter = new SupabaseVenueFactEvidenceAdapter(
      makeClient(() => null),
    );
    await expect(
      adapter.getFactContext(projectId, factId),
    ).resolves.toMatchObject({
      factId,
      projectId,
      venueId,
      definition: { id: definitionId, valueType: "boolean" },
    });
  });

  it("maps source create and optimistic update RPCs exactly", async () => {
    const calls: RecordedRpc[] = [];
    const adapter = new SupabaseVenueFactEvidenceAdapter(
      makeClient(
        (name) => ({
          ...sourceRow,
          status: name === "update_venue_fact_source" ? "broken" : "active",
          revision: name === "update_venue_fact_source" ? 2 : 1,
        }),
        calls,
      ),
    );
    await expect(
      adapter.createSource(createSourceInput),
    ).resolves.toMatchObject({
      id: sourceId,
      status: "active",
      revision: 1,
    });
    await expect(
      adapter.updateSource(updateSourceInput),
    ).resolves.toMatchObject({
      id: sourceId,
      status: "broken",
      revision: 2,
    });
    expect(calls[0]).toEqual({
      name: "create_venue_fact_source",
      args: {
        target_project_id: projectId,
        target_source_type: "written_confirmation",
        target_title: "Venue email",
        target_url: "https://venue.example/confirmation",
        target_evidence_level: "confirmed_for_event",
        target_observed_at: "2026-09-07T06:20:00.000Z",
        target_notes: null,
        target_status: "active",
      },
    });
    expect(calls[1]).toMatchObject({
      name: "update_venue_fact_source",
      args: {
        target_source_id: sourceId,
        target_expected_revision: 1,
        target_status: "broken",
      },
    });
  });

  it("maps append without mutating retained truth implicitly", async () => {
    const calls: RecordedRpc[] = [];
    const adapter = new SupabaseVenueFactEvidenceAdapter(
      makeClient(
        (name) =>
          name === "append_venue_fact_observation" ? observationRow : null,
        calls,
      ),
    );
    await expect(adapter.appendObservation(appendInput)).resolves.toMatchObject(
      {
        id: observationId,
        value: false,
        confidence: "high",
      },
    );
    expect(calls).toEqual([
      {
        name: "append_venue_fact_observation",
        args: {
          target_project_id: projectId,
          target_fact_id: factId,
          target_value: false,
          target_raw_value_text: "No",
          target_evidence_level: "confirmed_for_event",
          target_confidence: "high",
          target_observed_at: "2026-09-07T06:30:00.000Z",
          target_note: null,
          target_supersedes_observation_id: null,
        },
      },
    ]);
  });

  it("maps same-project source links and explicit retained resolution", async () => {
    const calls: RecordedRpc[] = [];
    const adapter = new SupabaseVenueFactEvidenceAdapter(
      makeClient((name) => {
        if (name === "link_venue_fact_observation_source") {
          return {
            project_id: projectId,
            observation_id: observationId,
            source_id: sourceId,
            is_primary: true,
          };
        }
        if (name === "resolve_venue_fact_from_observation") return resolvedRow;
        return null;
      }, calls),
    );
    await expect(adapter.linkObservationSource(linkInput)).resolves.toEqual({
      projectId,
      observationId,
      sourceId,
      isPrimary: true,
    });
    await expect(
      adapter.resolveFromObservation(resolveInput),
    ).resolves.toMatchObject({
      id: factId,
      retainedObservationId: observationId,
      retainedValue: false,
      revision: 2,
    });
    expect(calls[0]).toEqual({
      name: "link_venue_fact_observation_source",
      args: {
        target_project_id: projectId,
        target_observation_id: observationId,
        target_source_id: sourceId,
        target_is_primary: true,
      },
    });
    expect(calls[1]).toEqual({
      name: "resolve_venue_fact_from_observation",
      args: {
        target_project_id: projectId,
        target_fact_id: factId,
        target_observation_id: observationId,
        target_expected_revision: 1,
        target_state: "known",
        target_resolution_note: null,
      },
    });
  });
});

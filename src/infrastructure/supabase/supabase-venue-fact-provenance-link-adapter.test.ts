import { expect, it } from "vitest";
import type { CheckedLinkObservationSourceInput } from "@application/facts/venue-fact-evidence-service";
import {
  SupabaseVenueFactEvidenceAdapter,
  type SupabaseVenueFactEvidenceClientLike,
} from "./supabase-venue-fact-evidence-adapter";

const projectId = "a1000000-0000-4000-8000-000000000001";
const observationId = "a1000000-0000-4000-8000-000000000041";
const sourceId = "a1000000-0000-4000-8000-000000000051";

const input: CheckedLinkObservationSourceInput = {
  projectId,
  observationId,
  sourceId,
  isPrimary: true,
  expectedSourceType: "in_person_visit",
  expectedSourceRevision: 3,
};

interface RecordedRpc {
  readonly name: string;
  readonly args: Readonly<Record<string, unknown>>;
}

function client(
  result: {
    readonly data: unknown;
    readonly error: unknown;
  },
  calls: RecordedRpc[],
): SupabaseVenueFactEvidenceClientLike {
  return {
    from: () => {
      throw new Error("not used");
    },
    rpc: (name, args) => {
      calls.push({ name, args });
      return Promise.resolve(result);
    },
  };
}

function linkRow(isPrimary = true) {
  return {
    project_id: projectId,
    observation_id: observationId,
    source_id: sourceId,
    is_primary: isPrimary,
  };
}

it("maps the checked visit-source link RPC with exact provenance identity", async () => {
  const calls: RecordedRpc[] = [];
  const adapter = new SupabaseVenueFactEvidenceAdapter(
    client({ data: linkRow(), error: null }, calls),
  );

  await expect(adapter.linkObservationSourceChecked(input)).resolves.toEqual({
    projectId,
    observationId,
    sourceId,
    isPrimary: true,
  });
  expect(calls).toEqual([
    {
      name: "link_venue_fact_observation_source_checked",
      args: {
        target_project_id: projectId,
        target_observation_id: observationId,
        target_source_id: sourceId,
        target_is_primary: true,
        target_expected_source_type: "in_person_visit",
        target_expected_source_revision: 3,
      },
    },
  ]);
});

it("fails closed when the checked link receipt substitutes primary identity", async () => {
  const adapter = new SupabaseVenueFactEvidenceAdapter(
    client({ data: linkRow(false), error: null }, []),
  );

  await expect(adapter.linkObservationSourceChecked(input)).rejects.toMatchObject({
    code: "provider_response_invalid",
  });
});

it("maps stale checked provenance to a conflict", async () => {
  const adapter = new SupabaseVenueFactEvidenceAdapter(
    client({ data: null, error: { code: "40001" } }, []),
  );

  await expect(adapter.linkObservationSourceChecked(input)).rejects.toMatchObject({
    code: "conflict",
  });
});

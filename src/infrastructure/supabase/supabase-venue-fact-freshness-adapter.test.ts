import { describe, expect, it } from "vitest";
import type { SetVenueFactFreshnessInput } from "@application/facts/venue-fact-freshness-service";
import {
  SupabaseVenueFactFreshnessAdapter,
  type SupabaseVenueFactFreshnessClientLike,
} from "./supabase-venue-fact-freshness-adapter";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "82222222-2222-4222-8222-222222222222";
const definitionId = "83333333-3333-4333-8333-333333333333";
const factId = "84444444-4444-4444-8444-444444444444";

const input: SetVenueFactFreshnessInput = {
  projectId,
  factId,
  expectedRevision: 1,
  lastVerifiedAt: "2026-09-07T08:00:00.000Z",
  staleAt: "2026-10-07T08:00:00.000Z",
};

const row = {
  id: factId,
  project_id: projectId,
  target_type: "venue",
  target_id: venueId,
  definition_id: definitionId,
  last_verified_at: "2026-09-07T08:00:00.000Z",
  stale_at: "2026-10-07T08:00:00.000Z",
  revision: 2,
};

function clientReturning(
  data: unknown,
  error: unknown = null,
): SupabaseVenueFactFreshnessClientLike {
  return { rpc: () => Promise.resolve({ data, error }) };
}

describe("Supabase venue fact freshness adapter", () => {
  it("maps explicit freshness RPC arguments exactly", async () => {
    let received: unknown;
    const client: SupabaseVenueFactFreshnessClientLike = {
      rpc: (name, args) => {
        received = { name, args };
        return Promise.resolve({ data: row, error: null });
      },
    };
    const adapter = new SupabaseVenueFactFreshnessAdapter(client);
    await expect(adapter.setFreshness(input)).resolves.toEqual({
      id: factId,
      projectId,
      venueId,
      definitionId,
      lastVerifiedAt: "2026-09-07T08:00:00.000Z",
      staleAt: "2026-10-07T08:00:00.000Z",
      revision: 2,
    });
    expect(received).toEqual({
      name: "set_venue_fact_freshness",
      args: {
        target_project_id: projectId,
        target_fact_id: factId,
        target_expected_revision: 1,
        target_last_verified_at: "2026-09-07T08:00:00.000Z",
        target_stale_at: "2026-10-07T08:00:00.000Z",
      },
    });
  });

  it.each([
    [{ code: "40001" }, "conflict"],
    [{ code: "42501" }, "authorization_failed"],
    [{ code: "PGRST001" }, "backend_unavailable"],
    [{ code: "22023" }, "data_integrity_failed"],
    [{ message: "hidden" }, "persistence_failed"],
  ] as const)("maps provider error %# to %s", async (error, code) => {
    const adapter = new SupabaseVenueFactFreshnessAdapter(
      clientReturning(null, error),
    );
    await expect(adapter.setFreshness(input)).rejects.toMatchObject({
      name: "VenueFactPersistenceError",
      code,
      message: "Venue fact freshness mutation failed.",
    });
  });

  it("maps transport rejection without leaking details", async () => {
    const adapter = new SupabaseVenueFactFreshnessAdapter({
      rpc: () => Promise.reject(new Error("secret transport detail")),
    });
    await expect(adapter.setFreshness(input)).rejects.toMatchObject({
      code: "backend_unavailable",
      message: "Venue fact freshness mutation failed.",
    });
  });

  it("rejects malformed successful responses", async () => {
    const adapter = new SupabaseVenueFactFreshnessAdapter(
      clientReturning({ ...row, project_id: definitionId }),
    );
    await expect(adapter.setFreshness(input)).rejects.toMatchObject({
      code: "provider_response_invalid",
      message: "Venue fact freshness mutation failed.",
    });
  });
});

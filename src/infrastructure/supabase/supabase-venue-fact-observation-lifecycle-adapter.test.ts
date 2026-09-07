import { expect, it } from "vitest";
import type { WithdrawVenueFactObservationInput } from "@application/facts/venue-fact-observation-lifecycle-service";
import {
  SupabaseVenueFactObservationLifecycleAdapter,
  type SupabaseVenueFactObservationLifecycleClientLike,
} from "./supabase-venue-fact-observation-lifecycle-adapter";

const projectId = "81111111-1111-4111-8111-111111111111";
const factId = "84444444-4444-4444-8444-444444444444";
const observationId = "86666666-6666-4666-8666-666666666666";

const input: WithdrawVenueFactObservationInput = {
  projectId,
  factId,
  observationId,
};

const row = {
  id: observationId,
  project_id: projectId,
  fact_id: factId,
  observation_status: "withdrawn",
  superseded_by_observation_id: null,
};

function clientReturning(
  data: unknown,
  error: unknown = null,
): SupabaseVenueFactObservationLifecycleClientLike {
  return { rpc: () => Promise.resolve({ data, error }) };
}

it("maps the venue fact observation withdrawal RPC exactly", async () => {
  let received: unknown;
  const adapter = new SupabaseVenueFactObservationLifecycleAdapter({
    rpc: (name, args) => {
      received = { name, args };
      return Promise.resolve({ data: row, error: null });
    },
  });
  await expect(adapter.withdrawObservation(input)).resolves.toEqual({
    id: observationId,
    projectId,
    factId,
    status: "withdrawn",
    supersededByObservationId: null,
  });
  expect(received).toEqual({
    name: "withdraw_venue_fact_observation",
    args: {
      target_project_id: projectId,
      target_fact_id: factId,
      target_observation_id: observationId,
    },
  });
});

it.each([
  [{ code: "40001" }, "conflict"],
  [{ code: "42501" }, "authorization_failed"],
  [{ code: "PGRST001" }, "backend_unavailable"],
  [{ code: "22023" }, "data_integrity_failed"],
  [{ message: "hidden" }, "persistence_failed"],
] as const)("maps lifecycle provider error %# to %s", async (error, code) => {
  const adapter = new SupabaseVenueFactObservationLifecycleAdapter(
    clientReturning(null, error),
  );
  await expect(adapter.withdrawObservation(input)).rejects.toMatchObject({
    name: "VenueFactPersistenceError",
    code,
    message: "Venue fact observation withdrawal failed.",
  });
});

it("maps observation withdrawal transport rejection without leaking details", async () => {
  const adapter = new SupabaseVenueFactObservationLifecycleAdapter({
    rpc: () => Promise.reject(new Error("secret transport detail")),
  });
  await expect(adapter.withdrawObservation(input)).rejects.toMatchObject({
    code: "backend_unavailable",
    message: "Venue fact observation withdrawal failed.",
  });
});

it("rejects malformed successful observation lifecycle responses", async () => {
  for (const candidate of [
    { ...row, project_id: factId },
    { ...row, observation_status: "active" },
    { ...row, superseded_by_observation_id: observationId },
  ]) {
    const adapter = new SupabaseVenueFactObservationLifecycleAdapter(
      clientReturning(candidate),
    );
    await expect(adapter.withdrawObservation(input)).rejects.toMatchObject({
      code: "provider_response_invalid",
      message: "Venue fact observation withdrawal failed.",
    });
  }
});

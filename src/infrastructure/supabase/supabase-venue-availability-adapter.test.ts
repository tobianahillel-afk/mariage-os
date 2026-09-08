import { expect, it } from "vitest";
import type { NormalizedAppendVenueAvailabilityInput } from "@application/venues/venue-availability-service";
import {
  SupabaseVenueAvailabilityAdapter,
  type SupabaseVenueAvailabilityClientLike,
} from "./supabase-venue-availability-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const availabilityId = "33333333-3333-4333-8333-333333333333";
const actorId = "44444444-4444-4444-8444-444444444444";

type Result = { readonly data: unknown; readonly error: unknown };
type OrderCall = { readonly column: string; readonly ascending: boolean };

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: availabilityId,
    project_id: projectId,
    venue_id: venueId,
    date_option_id: null,
    event_date: "2027-06-12",
    status: "available",
    option_expires_at: null,
    observed_at: "2026-09-08T10:00:00.000Z",
    source_id: null,
    notes: "checked",
    created_at: "2026-09-08T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-09-08T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

const command: NormalizedAppendVenueAvailabilityInput = {
  projectId,
  venueId,
  availabilityId,
  dateOptionId: null,
  eventDate: "2027-06-12",
  status: "available",
  optionExpiresAt: null,
  observedAt: "2026-09-08T10:00:00.000Z",
  sourceId: null,
  notes: "checked",
};

class QueryBuilder implements PromiseLike<Result> {
  constructor(
    private readonly result: Result,
    private readonly orderCalls: OrderCall[],
  ) {}
  eq(): QueryBuilder {
    return this;
  }
  order(
    column: string,
    options: Readonly<{ ascending: boolean }>,
  ): QueryBuilder {
    this.orderCalls.push({ column, ascending: options.ascending });
    return this;
  }
  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class FakeClient implements SupabaseVenueAvailabilityClientLike {
  queryResult: Result = { data: [row()], error: null };
  rpcResult: Result = { data: row(), error: null };
  lastRpc: { name: string; args: Readonly<Record<string, unknown>> } | null =
    null;
  readonly orderCalls: OrderCall[] = [];

  from() {
    return {
      select: () => new QueryBuilder(this.queryResult, this.orderCalls),
    };
  }

  rpc(
    functionName: "append_venue_availability",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    this.lastRpc = { name: functionName, args };
    return Promise.resolve(this.rpcResult);
  }
}

it("appends canonical evidence and validates the returned request identity", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAvailabilityAdapter(client);
  await expect(adapter.appendVenueAvailability(command)).resolves.toMatchObject(
    {
      id: availabilityId,
      projectId,
      venueId,
      status: "available",
    },
  );
  expect(client.lastRpc).toEqual({
    name: "append_venue_availability",
    args: {
      target_project_id: projectId,
      target_venue_id: venueId,
      target_availability_id: availabilityId,
      target_date_option_id: null,
      target_event_date: "2027-06-12",
      target_status: "available",
      target_option_expires_at: null,
      target_observed_at: "2026-09-08T10:00:00.000Z",
      target_source_id: null,
      target_notes: "checked",
    },
  });
});

it("maps unique replay conflicts and generic RPC failures", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAvailabilityAdapter(client);

  client.rpcResult = { data: null, error: { code: "23505" } };
  await expect(adapter.appendVenueAvailability(command)).rejects.toMatchObject({
    code: "conflict",
  });

  client.rpcResult = { data: null, error: { code: 23505 } };
  await expect(adapter.appendVenueAvailability(command)).rejects.toMatchObject({
    code: "persistence_failed",
  });

  client.rpcResult = { data: null, error: "down" };
  await expect(adapter.appendVenueAvailability(command)).rejects.toMatchObject({
    code: "persistence_failed",
  });
});

it("fails closed on malformed or substituted append receipts", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAvailabilityAdapter(client);

  client.rpcResult = { data: { nope: true }, error: null };
  await expect(adapter.appendVenueAvailability(command)).rejects.toMatchObject({
    code: "provider_response_invalid",
  });

  for (const overrides of [
    { id: "55555555-5555-4555-8555-555555555555" },
    { project_id: "55555555-5555-4555-8555-555555555555" },
    { venue_id: "55555555-5555-4555-8555-555555555555" },
    { event_date: "2027-06-13" },
    { status: "unknown" },
    { notes: "different" },
  ]) {
    client.rpcResult = { data: row(overrides), error: null };
    await expect(
      adapter.appendVenueAvailability(command),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
  }
});

it("lists, validates, de-duplicates and requests canonical history order", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAvailabilityAdapter(client);
  const earlierId = "66666666-6666-4666-8666-666666666666";
  const laterId = "55555555-5555-4555-8555-555555555555";
  client.queryResult = {
    data: [
      row({ id: laterId, observed_at: "2026-09-08T11:00:00.000Z" }),
      row({ id: earlierId, observed_at: "2026-09-08T09:00:00.000Z" }),
    ],
    error: null,
  };
  await expect(
    adapter.listVenueAvailabilityHistory(projectId, venueId),
  ).resolves.toMatchObject([{ id: laterId }, { id: earlierId }]);
  expect(client.orderCalls).toEqual([
    { column: "observed_at", ascending: false },
    { column: "created_at", ascending: false },
    { column: "id", ascending: true },
  ]);

  client.queryResult = { data: [row(), row()], error: null };
  await expect(
    adapter.listVenueAvailabilityHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("fails closed on query transport, shape and row errors", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAvailabilityAdapter(client);

  client.queryResult = { data: [], error: { code: "500" } };
  await expect(
    adapter.listVenueAvailabilityHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  client.queryResult = { data: null, error: null };
  await expect(
    adapter.listVenueAvailabilityHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  client.queryResult = { data: [row({ event_date: "bad" })], error: null };
  await expect(
    adapter.listVenueAvailabilityHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

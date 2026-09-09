import { expect, it } from "vitest";
import type { NormalizedAppendVenueAccessRouteInput } from "@application/venues/venue-access-service";
import {
  SupabaseVenueAccessAdapter,
  type SupabaseVenueAccessClientLike,
} from "./supabase-venue-access-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const routeId = "33333333-3333-4333-8333-333333333333";
const originId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";

type Result = { readonly data: unknown; readonly error: unknown };
type OrderCall = { readonly column: string; readonly ascending: boolean };
type EqCall = { readonly column: string; readonly value: string | boolean };

function routeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: routeId,
    project_id: projectId,
    venue_id: venueId,
    reference_origin_id: originId,
    route_type: "reference_to_venue",
    origin_label: "Paris",
    destination_label: "Venue",
    mode: "car",
    duration_minutes: 95,
    distance_meters: 123_000,
    transfers_count: 0,
    observed_at: "2026-09-09T10:00:00.000Z",
    source_id: null,
    notes: "checked",
    reference_origin_address_snapshot: "Paris address",
    reference_origin_latitude_snapshot: 48.8566,
    reference_origin_longitude_snapshot: 2.3522,
    created_at: "2026-09-09T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-09-09T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

function originRow(overrides: Record<string, unknown> = {}) {
  return {
    id: originId,
    project_id: projectId,
    label: "Paris",
    address_text: "Paris address",
    latitude: 48.8566,
    longitude: 2.3522,
    is_default: true,
    ...overrides,
  };
}

const command: NormalizedAppendVenueAccessRouteInput = {
  projectId,
  venueId,
  routeId,
  referenceOriginId: originId,
  routeType: "reference_to_venue",
  originLabel: null,
  destinationLabel: "Venue",
  mode: "car",
  durationMinutes: 95,
  distanceMeters: 123_000,
  transfersCount: 0,
  observedAt: "2026-09-09T10:00:00.000Z",
  sourceId: null,
  notes: "checked",
};

class QueryBuilder implements PromiseLike<Result> {
  constructor(
    private readonly result: Result,
    private readonly eqCalls: EqCall[],
    private readonly orderCalls: OrderCall[],
  ) {}

  eq(column: string, value: string | boolean): QueryBuilder {
    this.eqCalls.push({ column, value });
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

class FakeClient implements SupabaseVenueAccessClientLike {
  routeQueryResult: Result = { data: [routeRow()], error: null };
  originQueryResult: Result = { data: [originRow()], error: null };
  rpcResult: Result = { data: routeRow(), error: null };
  lastRpc: { name: string; args: Readonly<Record<string, unknown>> } | null =
    null;
  lastTable: string | null = null;
  readonly eqCalls: EqCall[] = [];
  readonly orderCalls: OrderCall[] = [];

  from(table: "venue_access_routes" | "project_reference_origins") {
    this.lastTable = table;
    const result =
      table === "venue_access_routes"
        ? this.routeQueryResult
        : this.originQueryResult;
    return {
      select: () => new QueryBuilder(result, this.eqCalls, this.orderCalls),
    };
  }

  rpc(
    functionName: "append_venue_access_route",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    this.lastRpc = { name: functionName, args };
    return Promise.resolve(this.rpcResult);
  }
}

it("appends canonical route evidence and validates the returned caller payload", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAccessAdapter(client);
  await expect(adapter.appendVenueAccessRoute(command)).resolves.toMatchObject({
    id: routeId,
    projectId,
    venueId,
    referenceOriginId: originId,
  });
  expect(client.lastRpc).toEqual({
    name: "append_venue_access_route",
    args: {
      target_project_id: projectId,
      target_venue_id: venueId,
      target_route_id: routeId,
      target_reference_origin_id: originId,
      target_route_type: "reference_to_venue",
      target_origin_label: null,
      target_destination_label: "Venue",
      target_mode: "car",
      target_duration_minutes: 95,
      target_distance_meters: 123_000,
      target_transfers_count: 0,
      target_observed_at: "2026-09-09T10:00:00.000Z",
      target_source_id: null,
      target_notes: "checked",
    },
  });
});

it("allows server snapshots to differ on replay but rejects caller-payload substitution", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAccessAdapter(client);
  client.rpcResult = {
    data: routeRow({
      origin_label: "Historical Paris",
      reference_origin_address_snapshot: "Old Paris address",
      reference_origin_latitude_snapshot: 48,
      reference_origin_longitude_snapshot: 2,
    }),
    error: null,
  };
  await expect(adapter.appendVenueAccessRoute(command)).resolves.toMatchObject({
    originLabel: "Historical Paris",
    referenceOriginAddressSnapshot: "Old Paris address",
  });

  for (const overrides of [
    { id: "66666666-6666-4666-8666-666666666666" },
    { project_id: "66666666-6666-4666-8666-666666666666" },
    { venue_id: "66666666-6666-4666-8666-666666666666" },
    { destination_label: "Other" },
    { mode: "train" },
    { notes: "different" },
  ]) {
    client.rpcResult = { data: routeRow(overrides), error: null };
    await expect(adapter.appendVenueAccessRoute(command)).rejects.toMatchObject({
      code: "provider_response_invalid",
    });
  }
});

it("maps replay conflicts and all other RPC failures safely", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAccessAdapter(client);

  client.rpcResult = { data: null, error: { code: "23505" } };
  await expect(adapter.appendVenueAccessRoute(command)).rejects.toMatchObject({
    code: "conflict",
  });

  for (const error of [{ code: 23505 }, "down", null]) {
    client.rpcResult =
      error === null
        ? { data: { malformed: true }, error: null }
        : { data: null, error };
    await expect(adapter.appendVenueAccessRoute(command)).rejects.toMatchObject({
      code:
        error === null ? "provider_response_invalid" : "persistence_failed",
    });
  }
});

it("lists provider history in database order and rejects duplicates", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAccessAdapter(client);
  const newestId = "77777777-7777-4777-8777-777777777777";
  const olderId = "66666666-6666-4666-8666-666666666666";
  client.routeQueryResult = {
    data: [
      routeRow({ id: newestId }),
      routeRow({ id: olderId, observed_at: "2026-09-09T09:00:00.000Z" }),
    ],
    error: null,
  };
  await expect(
    adapter.listVenueAccessRouteHistory(projectId, venueId),
  ).resolves.toMatchObject([{ id: newestId }, { id: olderId }]);
  expect(client.lastTable).toBe("venue_access_routes");
  expect(client.orderCalls).toEqual([
    { column: "observed_at", ascending: false },
    { column: "created_at", ascending: false },
    { column: "id", ascending: true },
  ]);

  client.routeQueryResult = { data: [routeRow(), routeRow()], error: null };
  await expect(
    adapter.listVenueAccessRouteHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("fails closed on route query transport, shape and row errors", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAccessAdapter(client);

  client.routeQueryResult = { data: [], error: { code: "500" } };
  await expect(
    adapter.listVenueAccessRouteHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  client.routeQueryResult = { data: null, error: null };
  await expect(
    adapter.listVenueAccessRouteHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  client.routeQueryResult = {
    data: [routeRow({ observed_at: "bad" })],
    error: null,
  };
  await expect(
    adapter.listVenueAccessRouteHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("returns exactly one canonical default origin and handles missing safely", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAccessAdapter(client);
  await expect(adapter.getDefaultReferenceOrigin(projectId)).resolves.toEqual({
    id: originId,
    projectId,
    label: "Paris",
    addressText: "Paris address",
    latitude: 48.8566,
    longitude: 2.3522,
    isDefault: true,
  });
  expect(client.lastTable).toBe("project_reference_origins");
  expect(client.eqCalls).toContainEqual({ column: "is_default", value: true });

  client.originQueryResult = { data: [], error: null };
  await expect(adapter.getDefaultReferenceOrigin(projectId)).resolves.toBeNull();
});

it("fails closed on invalid default-origin query responses", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueAccessAdapter(client);

  client.originQueryResult = { data: [], error: { code: "500" } };
  await expect(adapter.getDefaultReferenceOrigin(projectId)).rejects.toMatchObject({
    code: "persistence_failed",
  });

  client.originQueryResult = { data: null, error: null };
  await expect(adapter.getDefaultReferenceOrigin(projectId)).rejects.toMatchObject({
    code: "persistence_failed",
  });

  client.originQueryResult = { data: [originRow(), originRow()], error: null };
  await expect(adapter.getDefaultReferenceOrigin(projectId)).rejects.toMatchObject({
    code: "provider_response_invalid",
  });

  client.originQueryResult = {
    data: [originRow({ is_default: false })],
    error: null,
  };
  await expect(adapter.getDefaultReferenceOrigin(projectId)).rejects.toMatchObject({
    code: "provider_response_invalid",
  });
});

import { expect, it } from "vitest";
import type { NormalizedAppendVenueInteractionInput } from "@application/venues/venue-interaction-service";
import {
  SupabaseVenueInteractionAdapter,
  type SupabaseVenueInteractionClientLike,
} from "./supabase-venue-interaction-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const interactionId = "33333333-3333-4333-8333-333333333333";
const contactId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";
const actorId = "66666666-6666-4666-8666-666666666666";

type Result = { readonly data: unknown; readonly error: unknown };
type OrderCall = { readonly column: string; readonly ascending: boolean };

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: interactionId,
    project_id: projectId,
    parent_type: "venue",
    parent_id: venueId,
    contact_id: contactId,
    interaction_type: "phone_call",
    occurred_at: "2026-09-08T10:00:00.000Z",
    summary: "Quote confirmed.",
    next_follow_up_at: null,
    source_id: sourceId,
    created_at: "2026-09-08T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-09-08T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

const command: NormalizedAppendVenueInteractionInput = {
  projectId,
  venueId,
  interactionId,
  contactId,
  interactionType: "phone_call",
  occurredAt: "2026-09-08T10:00:00.000Z",
  summary: "Quote confirmed.",
  nextFollowUpAt: null,
  sourceId,
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

class FakeClient implements SupabaseVenueInteractionClientLike {
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
    functionName: "append_venue_interaction",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    this.lastRpc = { name: functionName, args };
    return Promise.resolve(this.rpcResult);
  }
}

it("appends canonical interaction history and validates the returned request identity", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueInteractionAdapter(client);
  await expect(adapter.appendVenueInteraction(command)).resolves.toMatchObject({
    id: interactionId,
    projectId,
    venueId,
    interactionType: "phone_call",
  });
  expect(client.lastRpc).toEqual({
    name: "append_venue_interaction",
    args: {
      target_project_id: projectId,
      target_venue_id: venueId,
      target_interaction_id: interactionId,
      target_contact_id: contactId,
      target_interaction_type: "phone_call",
      target_occurred_at: "2026-09-08T10:00:00.000Z",
      target_summary: "Quote confirmed.",
      target_next_follow_up_at: null,
      target_source_id: sourceId,
    },
  });
});

it("maps unique replay conflicts and generic RPC failures", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueInteractionAdapter(client);

  client.rpcResult = { data: null, error: { code: "23505" } };
  await expect(adapter.appendVenueInteraction(command)).rejects.toMatchObject({
    code: "conflict",
  });

  client.rpcResult = { data: null, error: { code: 23505 } };
  await expect(adapter.appendVenueInteraction(command)).rejects.toMatchObject({
    code: "persistence_failed",
  });

  client.rpcResult = { data: null, error: "down" };
  await expect(adapter.appendVenueInteraction(command)).rejects.toMatchObject({
    code: "persistence_failed",
  });
});

it("fails closed on malformed or substituted append receipts", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueInteractionAdapter(client);

  client.rpcResult = { data: { nope: true }, error: null };
  await expect(adapter.appendVenueInteraction(command)).rejects.toMatchObject({
    code: "provider_response_invalid",
  });

  for (const overrides of [
    { id: "77777777-7777-4777-8777-777777777777" },
    { project_id: "77777777-7777-4777-8777-777777777777" },
    { parent_id: "77777777-7777-4777-8777-777777777777" },
    { contact_id: null },
    { interaction_type: "email" },
    { summary: "different" },
    { source_id: null },
  ]) {
    client.rpcResult = { data: row(overrides), error: null };
    await expect(adapter.appendVenueInteraction(command)).rejects.toMatchObject(
      {
        code: "provider_response_invalid",
      },
    );
  }
});

it("lists, validates, de-duplicates and requests canonical history order", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueInteractionAdapter(client);
  const newestId = "77777777-7777-4777-8777-777777777777";
  const olderId = "88888888-8888-4888-8888-888888888888";
  client.queryResult = {
    data: [
      row({ id: newestId, occurred_at: "2026-09-08T11:00:00.000Z" }),
      row({ id: olderId, occurred_at: "2026-09-08T09:00:00.000Z" }),
    ],
    error: null,
  };
  await expect(
    adapter.listVenueInteractionHistory(projectId, venueId),
  ).resolves.toMatchObject([{ id: newestId }, { id: olderId }]);
  expect(client.orderCalls).toEqual([
    { column: "occurred_at", ascending: false },
    { column: "created_at", ascending: false },
    { column: "id", ascending: true },
  ]);

  client.queryResult = { data: [row(), row()], error: null };
  await expect(
    adapter.listVenueInteractionHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("preserves provider order when microseconds collapse during parsing", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueInteractionAdapter(client);
  const providerWinner = "99999999-9999-4999-8999-999999999999";
  const lowerUuid = "11111111-1111-4111-8111-111111111111";
  client.queryResult = {
    data: [
      row({
        id: providerWinner,
        occurred_at: "2026-09-08T10:00:00.000999Z",
        created_at: "2026-09-08T10:01:00.000999Z",
      }),
      row({
        id: lowerUuid,
        occurred_at: "2026-09-08T10:00:00.000001Z",
        created_at: "2026-09-08T10:01:00.000001Z",
      }),
    ],
    error: null,
  };
  await expect(
    adapter.listVenueInteractionHistory(projectId, venueId),
  ).resolves.toMatchObject([
    { id: providerWinner, occurredAt: "2026-09-08T10:00:00.000Z" },
    { id: lowerUuid, occurredAt: "2026-09-08T10:00:00.000Z" },
  ]);
});

it("fails closed on query transport, shape and row errors", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueInteractionAdapter(client);

  client.queryResult = { data: [], error: { code: "500" } };
  await expect(
    adapter.listVenueInteractionHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  client.queryResult = { data: null, error: null };
  await expect(
    adapter.listVenueInteractionHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  client.queryResult = { data: [row({ summary: "" })], error: null };
  await expect(
    adapter.listVenueInteractionHistory(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

import { expect, it, vi } from "vitest";
import { VenueContactPersistenceError } from "@application/venues/venue-contact-persistence-error";
import {
  SupabaseVenueContactAdapter,
  type SupabaseVenueContactClientLike,
} from "./supabase-venue-contact-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const contactId = "33333333-3333-4333-8333-333333333333";
const input = {
  projectId,
  venueId,
  contactId,
  expectedRevision: null,
  name: "Alice",
  roleLabel: null,
  email: null,
  phone: "+33123456789",
  preferredChannel: null,
  notes: null,
} as const;

interface QueryResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface QueryFilter extends PromiseLike<QueryResult> {
  eq(column: string, value: string): QueryFilter;
}

interface QueryTable {
  select(columns: string): QueryFilter;
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: contactId,
    project_id: projectId,
    parent_type: "venue",
    parent_id: venueId,
    name: "Alice",
    role_label: null,
    email: null,
    phone: "+33123456789",
    preferred_channel: null,
    notes: null,
    revision: 1,
    ...overrides,
  };
}

function queryTable(data: unknown, error: unknown = null): QueryTable {
  const result: QueryResult = { data, error };
  const eq = vi.fn();
  const filter = {
    eq,
    then: (resolve: (value: QueryResult) => unknown) =>
      Promise.resolve(result).then(resolve),
  } as unknown as QueryFilter;
  eq.mockReturnValue(filter);
  return { select: vi.fn(() => filter) };
}

it("saves through one RPC and validates the exact returned payload/revision", async () => {
  const rpc = vi.fn(async () => ({ data: row(), error: null }));
  const client = {
    rpc,
    from: vi.fn(() => queryTable([])),
  } as unknown as SupabaseVenueContactClientLike;
  const adapter = new SupabaseVenueContactAdapter(client);
  await expect(adapter.saveVenueContact(input)).resolves.toMatchObject({
    id: contactId,
    revision: 1,
  });
  expect(rpc).toHaveBeenCalledWith(
    "save_venue_contact",
    expect.objectContaining({
      target_project_id: projectId,
      target_venue_id: venueId,
      target_contact_id: contactId,
      target_expected_revision: null,
      target_phone: "+33123456789",
    }),
  );

  const updateClient = {
    rpc: vi.fn(async () => ({ data: row({ revision: 5 }), error: null })),
    from: vi.fn(() => queryTable([])),
  } as unknown as SupabaseVenueContactClientLike;
  await expect(
    new SupabaseVenueContactAdapter(updateClient).saveVenueContact({
      ...input,
      expectedRevision: 4,
    }),
  ).resolves.toMatchObject({ revision: 5 });
});

it("maps server conflicts and rejects malformed save responses", async () => {
  for (const code of ["23505", "40001"]) {
    const client = {
      rpc: vi.fn(async () => ({ data: null, error: { code } })),
      from: vi.fn(() => queryTable([])),
    } as unknown as SupabaseVenueContactClientLike;
    await expect(
      new SupabaseVenueContactAdapter(client).saveVenueContact(input),
    ).rejects.toMatchObject({ code: "conflict" });
  }
  const generic = {
    rpc: vi.fn(async () => ({ data: null, error: { code: "42501" } })),
    from: vi.fn(() => queryTable([])),
  } as unknown as SupabaseVenueContactClientLike;
  await expect(
    new SupabaseVenueContactAdapter(generic).saveVenueContact(input),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  const malformed = {
    rpc: vi.fn(async () => ({ data: row({ phone: "bad" }), error: null })),
    from: vi.fn(() => queryTable([])),
  } as unknown as SupabaseVenueContactClientLike;
  await expect(
    new SupabaseVenueContactAdapter(malformed).saveVenueContact(input),
  ).rejects.toBeInstanceOf(VenueContactPersistenceError);
});

it("lists same-parent canonical rows and fails closed on duplicates/provider errors", async () => {
  const client = {
    rpc: vi.fn(),
    from: vi.fn(() => queryTable([row()])),
  } as unknown as SupabaseVenueContactClientLike;
  await expect(
    new SupabaseVenueContactAdapter(client).listVenueContacts(
      projectId,
      venueId,
    ),
  ).resolves.toHaveLength(1);

  const duplicate = {
    rpc: vi.fn(),
    from: vi.fn(() => queryTable([row(), row()])),
  } as unknown as SupabaseVenueContactClientLike;
  await expect(
    new SupabaseVenueContactAdapter(duplicate).listVenueContacts(
      projectId,
      venueId,
    ),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });

  const failed = {
    rpc: vi.fn(),
    from: vi.fn(() => queryTable(null, { code: "x" })),
  } as unknown as SupabaseVenueContactClientLike;
  await expect(
    new SupabaseVenueContactAdapter(failed).listVenueContacts(
      projectId,
      venueId,
    ),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

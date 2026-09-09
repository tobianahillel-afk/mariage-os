import { expect, it } from "vitest";
import type { NormalizedCreateVenueRemoteMediaInput } from "@application/documents/media-service";
import {
  SupabaseMediaAdapter,
  type SupabaseMediaClientLike,
} from "./supabase-media-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const otherMediaId = "66666666-6666-4666-8666-666666666666";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";

function media(overrides: Record<string, unknown> = {}) {
  return {
    id: mediaId,
    project_id: projectId,
    media_type: "image",
    category: "exterior",
    storage_path: null,
    remote_url: "https://example.com/photo.jpg",
    source_page_url: "https://example.com/venue",
    original_filename: null,
    mime_type: null,
    size_bytes: null,
    sha256: null,
    width_px: null,
    height_px: null,
    derivative_of_id: null,
    is_original: true,
    upload_status: "ready",
    caption: "Exterior",
    created_at: "2026-09-09T20:00:00Z",
    created_by: actorId,
    updated_at: "2026-09-09T20:00:00Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: linkId,
    project_id: projectId,
    media_id: mediaId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: "gallery",
    created_at: "2026-09-09T20:00:00Z",
    created_by: actorId,
    ...overrides,
  };
}

const input: NormalizedCreateVenueRemoteMediaInput = {
  projectId,
  venueId,
  mediaId,
  linkId,
  category: "exterior",
  remoteUrl: "https://example.com/photo.jpg",
  sourcePageUrl: "https://example.com/venue",
  caption: "Exterior",
};

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}

class Builder implements PromiseLike<Result> {
  readonly filters: [string, string][] = [];
  readonly orders: [string, boolean][] = [];

  constructor(private readonly result: Result) {}

  select(columns: string): Builder {
    void columns;
    return this;
  }

  eq(column: string, value: string): Builder {
    this.filters.push([column, value]);
    return this;
  }

  order(column: string, options: Readonly<{ ascending: boolean }>): Builder {
    this.orders.push([column, options.ascending]);
    return this;
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class Client implements SupabaseMediaClientLike {
  readonly builder: Builder;
  rpcResult: Result;
  rpcArgs: Readonly<Record<string, unknown>> | null = null;

  constructor(listResult: Result, rpcResult: Result) {
    this.builder = new Builder(listResult);
    this.rpcResult = rpcResult;
  }

  from(table: "media_links"): Builder {
    void table;
    return this.builder;
  }

  rpc(
    functionName: "create_venue_remote_media",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    void functionName;
    this.rpcArgs = args;
    return Promise.resolve(this.rpcResult);
  }
}

it("calls the protected RPC and validates its exact semantic receipt", async () => {
  const client = new Client(
    { data: [], error: null },
    { data: { media: media(), link: link() }, error: null },
  );
  const adapter = new SupabaseMediaAdapter(client);
  const result = await adapter.createVenueRemoteMedia(input);
  expect(result.media.id).toBe(mediaId);
  expect(client.rpcArgs).toEqual({
    target_project_id: projectId,
    target_venue_id: venueId,
    target_media_id: mediaId,
    target_link_id: linkId,
    target_category: "exterior",
    target_remote_url: "https://example.com/photo.jpg",
    target_source_page_url: "https://example.com/venue",
    target_caption: "Exterior",
  });
});

it("maps provider conflict and rejects substituted success receipts", async () => {
  const conflictClient = new Client(
    { data: [], error: null },
    { data: null, error: { code: "23505" } },
  );
  await expect(
    new SupabaseMediaAdapter(conflictClient).createVenueRemoteMedia(input),
  ).rejects.toMatchObject({ code: "conflict" });

  const malformedClient = new Client(
    { data: [], error: null },
    {
      data: {
        media: media({ remote_url: "https://example.com/other.jpg" }),
        link: link(),
      },
      error: null,
    },
  );
  await expect(
    new SupabaseMediaAdapter(malformedClient).createVenueRemoteMedia(input),
  ).rejects.toMatchObject({
    code: "provider_response_invalid",
  });
});

it.each(["provider-down", { code: 500 }])(
  "maps non-conflict provider failure %#",
  async (error) => {
    const client = new Client({ data: [], error: null }, { data: null, error });
    await expect(
      new SupabaseMediaAdapter(client).createVenueRemoteMedia(input),
    ).rejects.toMatchObject({ code: "persistence_failed" });
  },
);

it("fails closed when a successful RPC returns an invalid shape", async () => {
  const client = new Client(
    { data: [], error: null },
    { data: null, error: null },
  );
  await expect(
    new SupabaseMediaAdapter(client).createVenueRemoteMedia(input),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("lists only the requested Venue gallery relationship in provider order", async () => {
  const client = new Client(
    { data: [{ ...link(), media: media() }], error: null },
    { data: null, error: null },
  );
  const rows = await new SupabaseMediaAdapter(client).listVenueRemoteMedia(
    projectId,
    venueId,
  );
  expect(rows).toHaveLength(1);
  expect(client.builder.filters).toEqual([
    ["project_id", projectId],
    ["target_type", "venue"],
    ["target_id", venueId],
    ["relationship_type", "gallery"],
  ]);
  expect(client.builder.orders).toEqual([
    ["created_at", false],
    ["id", true],
  ]);
});

it("fails closed on duplicate media list rows", async () => {
  const duplicated = { ...link(), media: media() };
  const client = new Client(
    { data: [duplicated, duplicated], error: null },
    { data: null, error: null },
  );
  await expect(
    new SupabaseMediaAdapter(client).listVenueRemoteMedia(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("fails closed on duplicate link identity with distinct media", async () => {
  const first = { ...link(), media: media() };
  const second = {
    ...link({ media_id: otherMediaId }),
    media: media({ id: otherMediaId }),
  };
  const client = new Client(
    { data: [first, second], error: null },
    { data: null, error: null },
  );
  await expect(
    new SupabaseMediaAdapter(client).listVenueRemoteMedia(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("maps provider and non-array list failures", async () => {
  const providerFailure = new Client(
    { data: [], error: "provider-down" },
    { data: null, error: null },
  );
  await expect(
    new SupabaseMediaAdapter(providerFailure).listVenueRemoteMedia(
      projectId,
      venueId,
    ),
  ).rejects.toMatchObject({ code: "persistence_failed" });

  const nonArray = new Client(
    { data: null, error: null },
    { data: null, error: null },
  );
  await expect(
    new SupabaseMediaAdapter(nonArray).listVenueRemoteMedia(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("maps malformed list rows to provider response invalid", async () => {
  const client = new Client(
    { data: [null], error: null },
    { data: null, error: null },
  );
  await expect(
    new SupabaseMediaAdapter(client).listVenueRemoteMedia(projectId, venueId),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

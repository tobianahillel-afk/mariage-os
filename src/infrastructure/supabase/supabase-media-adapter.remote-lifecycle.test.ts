import { expect, it } from "vitest";
import type { NormalizedTransitionVenueRemoteMediaLifecycleRequest } from "@application/documents/media-service";
import {
  SupabaseMediaAdapter,
  type SupabaseMediaClientLike,
} from "./supabase-media-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";
const deletedAt = "2026-09-11T16:30:00Z";

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}

function lifecycleReceipt(overrides: Record<string, unknown> = {}) {
  return {
    action: "soft_delete",
    replayed: false,
    media: {
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
      derivative_kind: null,
      derivative_version: null,
      is_original: true,
      upload_status: "ready",
      caption: "Exterior",
      deleted_at: deletedAt,
      created_at: "2026-09-09T20:00:00Z",
      created_by: actorId,
      updated_at: deletedAt,
      updated_by: actorId,
      revision: 2,
    },
    link: {
      id: linkId,
      project_id: projectId,
      media_id: mediaId,
      target_type: "venue",
      target_id: venueId,
      relationship_type: "gallery",
      created_at: "2026-09-09T20:00:00Z",
      created_by: actorId,
    },
    ...overrides,
  };
}

class LifecycleClient implements SupabaseMediaClientLike {
  rpcName: string | null = null;
  rpcArgs: Readonly<Record<string, unknown>> | null = null;

  constructor(private readonly result: Result) {}

  from(): never {
    throw new Error("unused");
  }

  rpc(
    functionName: string,
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    this.rpcName = functionName;
    this.rpcArgs = args;
    return Promise.resolve(this.result);
  }
}

const input: NormalizedTransitionVenueRemoteMediaLifecycleRequest = {
  projectId,
  mediaId,
  action: "soft_delete",
  expectedRevision: 1,
};

it("calls the protected lifecycle RPC and validates its typed receipt", async () => {
  const client = new LifecycleClient({ data: lifecycleReceipt(), error: null });
  const result = await new SupabaseMediaAdapter(
    client,
  ).transitionVenueRemoteMediaLifecycle(input);

  expect(result.media.id).toBe(mediaId);
  expect(result.media.deletedAt).toBe("2026-09-11T16:30:00.000Z");
  expect(result.media.revision).toBe(2);
  expect(client.rpcName).toBe("transition_venue_remote_media_lifecycle");
  expect(client.rpcArgs).toEqual({
    target_project_id: projectId,
    target_media_id: mediaId,
    target_action: "soft_delete",
    target_expected_revision: 1,
  });
});

it.each(["23505", "40001"])(
  "maps lifecycle provider conflict %s to the existing conflict boundary",
  async (code) => {
    const client = new LifecycleClient({ data: null, error: { code } });
    await expect(
      new SupabaseMediaAdapter(client).transitionVenueRemoteMediaLifecycle(
        input,
      ),
    ).rejects.toMatchObject({ code: "conflict" });
  },
);

it("maps non-conflict lifecycle provider failure generically", async () => {
  const client = new LifecycleClient({ data: null, error: { code: "42501" } });
  await expect(
    new SupabaseMediaAdapter(client).transitionVenueRemoteMediaLifecycle(input),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("fails closed on a substituted lifecycle success receipt", async () => {
  const client = new LifecycleClient({
    data: lifecycleReceipt({
      media: {
        ...lifecycleReceipt().media,
        project_id: venueId,
      },
    }),
    error: null,
  });
  await expect(
    new SupabaseMediaAdapter(client).transitionVenueRemoteMediaLifecycle(input),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

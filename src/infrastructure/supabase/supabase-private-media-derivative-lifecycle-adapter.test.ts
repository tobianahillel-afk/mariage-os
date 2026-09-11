import { expect, it } from "vitest";
import { SupabasePrivateMediaLifecycleAdapter } from "./supabase-private-media-lifecycle-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const parentMediaId = "99999999-9999-4999-8999-999999999999";
const mediaId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const reserveOperationId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const finalizeOperationId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const abandonOperationId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const actorId = "66666666-6666-4666-8666-666666666666";
const sha256 = "b".repeat(64);
const storagePath = `${projectId}/media/${mediaId}/thumbnail-v1`;

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}

class Client {
  rpcName: string | null = null;
  rpcArgs: Readonly<Record<string, unknown>> | null = null;

  constructor(private readonly result: Result) {}

  rpc(
    functionName: string,
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    this.rpcName = functionName;
    this.rpcArgs = args;
    return Promise.resolve(this.result);
  }
}

function derivativeMedia(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    id: mediaId,
    project_id: projectId,
    media_type: "image",
    category: null,
    storage_path: storagePath,
    remote_url: null,
    source_page_url: null,
    original_filename: null,
    mime_type: "image/jpeg",
    size_bytes: 3,
    sha256,
    width_px: 320,
    height_px: 180,
    derivative_of_id: parentMediaId,
    is_original: false,
    upload_status: "pending",
    caption: null,
    created_at: "2026-09-11T01:00:00Z",
    created_by: actorId,
    updated_at: "2026-09-11T01:00:00Z",
    updated_by: actorId,
    revision: 1,
    derivative_kind: "thumbnail",
    derivative_version: 1,
    ...overrides,
  };
}

const reserveInput = {
  operationId: reserveOperationId,
  projectId,
  mediaId,
  parentMediaId,
  derivativeKind: "thumbnail" as const,
  derivativeVersion: 1,
  mimeType: "image/jpeg" as const,
  sizeBytes: 3,
  sha256,
  widthPx: 320,
  heightPx: 180,
};

const finalizeInput = {
  operationId: finalizeOperationId,
  projectId,
  mediaId,
  parentMediaId,
  derivativeKind: "thumbnail" as const,
  derivativeVersion: 1,
};

const abandonInput = {
  operationId: abandonOperationId,
  projectId,
  mediaId,
};

it("reserves a private derivative through the lifecycle RPC", async () => {
  const client = new Client({
    data: {
      action: "reserve_derivative",
      replayed: false,
      media: derivativeMedia(),
    },
    error: null,
  });
  const adapter = new SupabasePrivateMediaLifecycleAdapter(client);

  const receipt = await adapter.reserveDerivative(reserveInput);

  expect(receipt).toEqual({ storagePath, replayed: false });
  expect(client.rpcName).toBe("manage_venue_private_media");
  expect(client.rpcArgs).toEqual({
    target_action: "reserve_derivative",
    target_operation_id: reserveOperationId,
    target_project_id: projectId,
    target_media_id: mediaId,
    target_venue_id: null,
    target_link_id: null,
    target_category: null,
    target_caption: null,
    target_original_filename: null,
    target_mime_type: "image/jpeg",
    target_size_bytes: 3,
    target_sha256: sha256,
    target_width_px: 320,
    target_height_px: 180,
    target_derivative_of_id: parentMediaId,
    target_derivative_kind: "thumbnail",
    target_derivative_version: 1,
  });

  const substitutedClient = new Client({
    data: {
      action: "reserve_derivative",
      replayed: false,
      media: derivativeMedia({ storage_path: `${storagePath}-substituted` }),
    },
    error: null,
  });
  await expect(
    new SupabasePrivateMediaLifecycleAdapter(
      substitutedClient,
    ).reserveDerivative(reserveInput),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("finalizes a private derivative and rejects substituted ready receipts", async () => {
  const validClient = new Client({
    data: {
      action: "finalize_derivative",
      replayed: false,
      media: derivativeMedia({ upload_status: "ready", revision: 2 }),
    },
    error: null,
  });

  await expect(
    new SupabasePrivateMediaLifecycleAdapter(validClient).finalizeDerivative(
      finalizeInput,
    ),
  ).resolves.toEqual({ storagePath, replayed: false });

  const substitutedClient = new Client({
    data: {
      action: "finalize_derivative",
      replayed: false,
      media: derivativeMedia({
        upload_status: "ready",
        derivative_of_id: reserveOperationId,
      }),
    },
    error: null,
  });

  await expect(
    new SupabasePrivateMediaLifecycleAdapter(
      substitutedClient,
    ).finalizeDerivative(finalizeInput),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("abandons only the exact pending derivative receipt", async () => {
  const client = new Client({
    data: {
      action: "abandon_derivative",
      replayed: false,
      projectId,
      mediaId,
      linkId: null,
      absent: true,
    },
    error: null,
  });
  const adapter = new SupabasePrivateMediaLifecycleAdapter(client);

  await expect(adapter.abandonDerivative(abandonInput)).resolves.toEqual({
    replayed: false,
    absent: true,
  });
  expect(client.rpcArgs).toEqual({
    target_action: "abandon_derivative",
    target_operation_id: abandonOperationId,
    target_project_id: projectId,
    target_media_id: mediaId,
    target_venue_id: null,
    target_link_id: null,
    target_category: null,
    target_caption: null,
    target_original_filename: null,
    target_mime_type: null,
    target_size_bytes: null,
    target_sha256: null,
    target_width_px: null,
    target_height_px: null,
    target_derivative_of_id: null,
    target_derivative_kind: null,
    target_derivative_version: null,
  });

  const invalidClient = new Client({
    data: {
      action: "abandon_derivative",
      replayed: false,
      projectId,
      mediaId,
      linkId: reserveOperationId,
      absent: true,
    },
    error: null,
  });
  await expect(
    new SupabasePrivateMediaLifecycleAdapter(invalidClient).abandonDerivative(
      abandonInput,
    ),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

import { expect, it } from "vitest";
import { SupabasePrivateMediaLifecycleAdapter } from "./supabase-private-media-lifecycle-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const linkId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";
const finalizeOperationId = "77777777-7777-4777-8777-777777777777";
const actorId = "66666666-6666-4666-8666-666666666666";
const sha256 = "a".repeat(64);
const storagePath = `${projectId}/media/${mediaId}/original`;

interface Result {
  readonly data: unknown;
  readonly error: unknown;
}

class Client {
  rpcName: string | null = null;
  rpcArgs: Readonly<Record<string, unknown>> | null = null;

  constructor(
    private readonly result: Result,
    private readonly thrown: unknown = null,
  ) {}

  rpc(
    functionName: string,
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    this.rpcName = functionName;
    this.rpcArgs = args;
    if (this.thrown !== null) return Promise.reject(this.thrown);
    return Promise.resolve(this.result);
  }
}

function media(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    id: mediaId,
    project_id: projectId,
    media_type: "image",
    category: "exterior",
    storage_path: storagePath,
    remote_url: null,
    source_page_url: null,
    original_filename: "venue.jpg",
    mime_type: "image/jpeg",
    size_bytes: 4,
    sha256,
    width_px: 1,
    height_px: 1,
    derivative_of_id: null,
    is_original: true,
    upload_status: "pending",
    caption: "Exterior",
    created_at: "2026-09-10T16:00:00Z",
    created_by: actorId,
    updated_at: "2026-09-10T16:00:00Z",
    updated_by: actorId,
    revision: 1,
    derivative_kind: null,
    derivative_version: null,
    ...overrides,
  };
}

function link(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    id: linkId,
    project_id: projectId,
    media_id: mediaId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: "gallery",
    created_at: "2026-09-10T16:00:00Z",
    created_by: actorId,
    ...overrides,
  };
}

const input = {
  operationId,
  projectId,
  venueId,
  mediaId,
  linkId,
  category: "exterior" as const,
  caption: "Exterior",
  originalFilename: "venue.jpg",
  mimeType: "image/jpeg" as const,
  sizeBytes: 4,
  sha256,
  widthPx: 1,
  heightPx: 1,
};

const finalizeInput = {
  operationId: finalizeOperationId,
  projectId,
  mediaId,
};

function finalizationReceipt(
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    action: "finalize_original",
    replayed: false,
    media: media({ upload_status: "ready", revision: 2 }),
    link: link(),
    ...overrides,
  };
}

it("reserves an original through the lifecycle RPC", async () => {
  const client = new Client({
    data: {
      action: "reserve_original",
      replayed: false,
      media: media(),
      link: link(),
    },
    error: null,
  });
  const adapter = new SupabasePrivateMediaLifecycleAdapter(client);

  const receipt = await adapter.reserveOriginal(input);

  expect(receipt.storagePath).toBe(storagePath);
  expect(receipt.replayed).toBe(false);
  expect(client.rpcName).toBe("manage_venue_private_media");
  expect(client.rpcArgs).toEqual({
    target_action: "reserve_original",
    target_operation_id: operationId,
    target_project_id: projectId,
    target_media_id: mediaId,
    target_venue_id: venueId,
    target_link_id: linkId,
    target_category: "exterior",
    target_caption: "Exterior",
    target_original_filename: "venue.jpg",
    target_mime_type: "image/jpeg",
    target_size_bytes: 4,
    target_sha256: sha256,
    target_width_px: 1,
    target_height_px: 1,
    target_derivative_of_id: null,
    target_derivative_kind: null,
    target_derivative_version: null,
  });
});

it("finalizes an original through the minimal lifecycle command", async () => {
  const client = new Client({
    data: finalizationReceipt(),
    error: null,
  });
  const adapter = new SupabasePrivateMediaLifecycleAdapter(client);

  const receipt = await adapter.finalizeOriginal(finalizeInput);

  expect(receipt.storagePath).toBe(storagePath);
  expect(receipt.replayed).toBe(false);
  expect(client.rpcName).toBe("manage_venue_private_media");
  expect(client.rpcArgs).toEqual({
    target_action: "finalize_original",
    target_operation_id: finalizeOperationId,
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
});

it("accepts a replayed finalization receipt", async () => {
  const client = new Client({
    data: finalizationReceipt({ replayed: true }),
    error: null,
  });

  await expect(
    new SupabasePrivateMediaLifecycleAdapter(client).finalizeOriginal(
      finalizeInput,
    ),
  ).resolves.toEqual({ storagePath, replayed: true });
});

it("maps finalization provider failures to stable lifecycle errors", async () => {
  const conflict = new Client({ data: null, error: { code: "23505" } });
  await expect(
    new SupabasePrivateMediaLifecycleAdapter(conflict).finalizeOriginal(
      finalizeInput,
    ),
  ).rejects.toMatchObject({ code: "conflict" });

  const unavailable = new Client({ data: null, error: { code: "55000" } });
  await expect(
    new SupabasePrivateMediaLifecycleAdapter(unavailable).finalizeOriginal(
      finalizeInput,
    ),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("rejects substituted or non-ready finalization receipts", async () => {
  const invalidReceipts = [
    finalizationReceipt({
      media: media({
        upload_status: "ready",
        storage_path: `${storagePath}-other`,
      }),
    }),
    finalizationReceipt({ media: media({ upload_status: "pending" }) }),
    finalizationReceipt({ link: link({ media_id: operationId }) }),
  ];

  for (const data of invalidReceipts) {
    const client = new Client({ data, error: null });
    await expect(
      new SupabasePrivateMediaLifecycleAdapter(client).finalizeOriginal(
        finalizeInput,
      ),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
  }
});

it("contains rejected finalization transport errors", async () => {
  const providerError = new Error("provider down");
  const client = new Client({ data: null, error: null }, providerError);

  try {
    await new SupabasePrivateMediaLifecycleAdapter(client).finalizeOriginal(
      finalizeInput,
    );
    throw new Error("expected finalize failure");
  } catch (error) {
    expect(error).toMatchObject({ code: "persistence_failed" });
    expect(error).not.toBe(providerError);
  }
});

it("maps provider failures and rejects a substituted path", async () => {
  const conflict = new Client({ data: null, error: { code: "23505" } });
  await expect(
    new SupabasePrivateMediaLifecycleAdapter(conflict).reserveOriginal(input),
  ).rejects.toMatchObject({ code: "conflict" });

  const genericFailure = new Client({ data: null, error: "provider-down" });
  const genericAdapter = new SupabasePrivateMediaLifecycleAdapter(
    genericFailure,
  );
  await expect(genericAdapter.reserveOriginal(input)).rejects.toMatchObject({
    code: "persistence_failed",
  });

  const substituted = new Client({
    data: {
      action: "reserve_original",
      replayed: false,
      media: media({ storage_path: `${storagePath}-other` }),
      link: link(),
    },
    error: null,
  });
  await expect(
    new SupabasePrivateMediaLifecycleAdapter(substituted).reserveOriginal(
      input,
    ),
  ).rejects.toMatchObject({ code: "provider_response_invalid" });
});

it("contains a rejected provider call behind a stable error", async () => {
  const providerError = new Error("provider down");
  const client = new Client({ data: null, error: null }, providerError);

  try {
    await new SupabasePrivateMediaLifecycleAdapter(client).reserveOriginal(
      input,
    );
    throw new Error("expected reserve failure");
  } catch (error) {
    expect(error).toMatchObject({ code: "persistence_failed" });
    expect(error).not.toBe(providerError);
  }
});

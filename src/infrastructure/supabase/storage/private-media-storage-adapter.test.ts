import { expect, it } from "vitest";
import { SupabasePrivateMediaStorageAdapter } from "./private-media-storage-adapter";

const storagePath =
  "11111111-1111-4111-8111-111111111111/media/33333333-3333-4333-8333-333333333333/original";
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb]);

interface UploadResult {
  readonly data: unknown;
  readonly error: unknown;
}

class Bucket {
  uploadPath: string | null = null;
  uploadBody: Uint8Array | null = null;
  uploadOptions: Readonly<Record<string, unknown>> | null = null;

  constructor(private readonly result: UploadResult) {}

  upload(
    path: string,
    body: Uint8Array,
    options: Readonly<Record<string, unknown>>,
  ): PromiseLike<UploadResult> {
    this.uploadPath = path;
    this.uploadBody = body;
    this.uploadOptions = options;
    return Promise.resolve(this.result);
  }
}

class Client {
  readonly bucket: Bucket;
  selectedBucket: string | null = null;

  constructor(result: UploadResult) {
    this.bucket = new Bucket(result);
  }

  readonly storage = {
    from: (bucket: string): Bucket => {
      this.selectedBucket = bucket;
      return this.bucket;
    },
  };
}

it("uploads only to project-private at the exact reserved path without upsert", async () => {
  const client = new Client({ data: { path: storagePath }, error: null });
  const adapter = new SupabasePrivateMediaStorageAdapter(client);

  const receipt = await adapter.uploadReservedObject({
    path: storagePath,
    bytes,
    mimeType: "image/jpeg",
  });

  expect(receipt).toEqual({
    bucket: "project-private",
    path: storagePath,
  });
  expect(client.selectedBucket).toBe("project-private");
  expect(client.bucket.uploadPath).toBe(storagePath);
  expect(client.bucket.uploadBody).toBe(bytes);
  expect(client.bucket.uploadOptions).toMatchObject({
    contentType: "image/jpeg",
    upsert: false,
  });
});

it("fails closed when Supabase substitutes or omits the reserved path", async () => {
  for (const data of [
    { path: `${storagePath}-substituted` },
    {},
    null,
  ]) {
    const client = new Client({ data, error: null });
    const adapter = new SupabasePrivateMediaStorageAdapter(client);

    await expect(
      adapter.uploadReservedObject({
        path: storagePath,
        bytes,
        mimeType: "image/jpeg",
      }),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
  }
});

it("contains raw provider failures behind a stable retryable Storage error", async () => {
  const providerError = { message: "storage unavailable", statusCode: "503" };
  const client = new Client({ data: null, error: providerError });
  const adapter = new SupabasePrivateMediaStorageAdapter(client);

  try {
    await adapter.uploadReservedObject({
      path: storagePath,
      bytes,
      mimeType: "image/jpeg",
    });
    throw new Error("expected upload failure");
  } catch (error) {
    expect(error).toMatchObject({ code: "storage_retryable" });
    expect(error).not.toBe(providerError);
  }
});

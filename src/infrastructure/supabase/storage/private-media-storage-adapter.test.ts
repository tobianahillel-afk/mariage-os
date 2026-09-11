import { expect, it } from "vitest";
import { SupabasePrivateMediaStorageAdapter } from "./private-media-storage-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const mediaId = "33333333-3333-4333-8333-333333333333";
const storagePath = `${projectId}/media/${mediaId}/original`;
const storageFolder = `${projectId}/media/${mediaId}`;
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb]);

interface StorageResult {
  readonly data: unknown;
  readonly error: unknown;
}

class Bucket {
  listPath: string | null = null;
  listOptions: Readonly<Record<string, unknown>> | null = null;
  listResult: StorageResult = { data: [], error: null };
  listThrown: unknown = null;
  uploadPath: string | null = null;
  uploadBody: Uint8Array | null = null;
  uploadOptions: Readonly<Record<string, unknown>> | null = null;
  removePaths: readonly string[] | null = null;
  removeResult: StorageResult = { data: [], error: null };
  removeThrown: unknown = null;

  constructor(
    private readonly result: StorageResult,
    private readonly thrown: unknown = null,
  ) {}

  list(
    path: string,
    options: Readonly<Record<string, unknown>>,
  ): PromiseLike<StorageResult> {
    this.listPath = path;
    this.listOptions = options;
    if (this.listThrown !== null) return Promise.reject(this.listThrown);
    return Promise.resolve(this.listResult);
  }

  upload(
    path: string,
    body: Uint8Array,
    options: Readonly<Record<string, unknown>>,
  ): PromiseLike<StorageResult> {
    this.uploadPath = path;
    this.uploadBody = body;
    this.uploadOptions = options;
    if (this.thrown !== null) return Promise.reject(this.thrown);
    return Promise.resolve(this.result);
  }

  remove(paths: readonly string[]): PromiseLike<StorageResult> {
    this.removePaths = paths;
    if (this.removeThrown !== null) return Promise.reject(this.removeThrown);
    return Promise.resolve(this.removeResult);
  }
}

class Client {
  readonly bucket: Bucket;
  selectedBucket: string | null = null;

  constructor(result: StorageResult, thrown: unknown = null) {
    this.bucket = new Bucket(result, thrown);
  }

  readonly storage = {
    from: (bucket: string): Bucket => {
      this.selectedBucket = bucket;
      return this.bucket;
    },
  };
}

it("inspects the exact reserved object in its canonical folder", async () => {
  const client = new Client({ data: null, error: null });
  client.bucket.listResult = { data: [{ name: "original" }], error: null };
  const adapter = new SupabasePrivateMediaStorageAdapter(client);

  await expect(adapter.inspectReservedObject(storagePath)).resolves.toEqual({
    bucket: "project-private",
    path: storagePath,
    present: true,
  });
  expect(client.selectedBucket).toBe("project-private");
  expect(client.bucket.listPath).toBe(storageFolder);
  expect(client.bucket.listOptions).toEqual({ search: "original", limit: 2 });
});

it("reports absent unless the listed object name matches exactly", async () => {
  const client = new Client({ data: null, error: null });
  client.bucket.listResult = {
    data: [{ name: "original-copy" }],
    error: null,
  };
  const adapter = new SupabasePrivateMediaStorageAdapter(client);

  await expect(adapter.inspectReservedObject(storagePath)).resolves.toEqual({
    bucket: "project-private",
    path: storagePath,
    present: false,
  });

  client.bucket.listResult = { data: [], error: null };
  await expect(adapter.inspectReservedObject(storagePath)).resolves.toEqual({
    bucket: "project-private",
    path: storagePath,
    present: false,
  });
});

it("rejects invalid Storage inspection receipts and paths", async () => {
  const client = new Client({ data: null, error: null });
  const adapter = new SupabasePrivateMediaStorageAdapter(client);

  for (const data of [null, {}, [null], [{}], [{ name: 42 }]]) {
    client.bucket.listResult = { data, error: null };
    await expect(
      adapter.inspectReservedObject(storagePath),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
  }

  for (const path of ["original", "folder/"]) {
    await expect(adapter.inspectReservedObject(path)).rejects.toMatchObject({
      code: "provider_response_invalid",
    });
  }
});

it("contains returned and thrown Storage inspection failures", async () => {
  const client = new Client({ data: null, error: null });
  const adapter = new SupabasePrivateMediaStorageAdapter(client);

  client.bucket.listResult = {
    data: null,
    error: { message: "storage unavailable" },
  };
  await expect(
    adapter.inspectReservedObject(storagePath),
  ).rejects.toMatchObject({
    code: "storage_retryable",
  });

  client.bucket.listResult = { data: [], error: null };
  client.bucket.listThrown = new Error("network failure");
  await expect(
    adapter.inspectReservedObject(storagePath),
  ).rejects.toMatchObject({
    code: "storage_retryable",
  });
});

it("uploads a reserved private object without upsert", async () => {
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

it("rejects an invalid Storage receipt path", async () => {
  const invalidData = [{ path: `${storagePath}-substituted` }, {}, null];

  for (const data of invalidData) {
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

it("contains returned Storage failures behind a stable error", async () => {
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

it("contains thrown Storage failures behind a stable error", async () => {
  const providerError = new Error("network failure");
  const client = new Client({ data: null, error: null }, providerError);
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

it("deletes only the exact reserved object path", async () => {
  const client = new Client({ data: null, error: null });
  client.bucket.removeResult = {
    data: [{ name: storagePath }],
    error: null,
  };
  const adapter = new SupabasePrivateMediaStorageAdapter(client);
  const deletion = adapter.deleteReservedObject(storagePath);

  await expect(deletion).resolves.toEqual({
    bucket: "project-private",
    path: storagePath,
    absent: true,
  });
  expect(client.selectedBucket).toBe("project-private");
  expect(client.bucket.removePaths).toEqual([storagePath]);
});

it("accepts an already-absent object", async () => {
  const client = new Client({ data: null, error: null });
  const adapter = new SupabasePrivateMediaStorageAdapter(client);
  const deletion = adapter.deleteReservedObject(storagePath);

  await expect(deletion).resolves.toEqual({
    bucket: "project-private",
    path: storagePath,
    absent: true,
  });
});

it("rejects invalid Storage delete receipts", async () => {
  const invalidData = [
    [{ name: `${storagePath}-other` }],
    [{ name: storagePath }, { name: `${storagePath}-other` }],
    [{}],
    null,
  ];

  for (const data of invalidData) {
    const client = new Client({ data: null, error: null });
    client.bucket.removeResult = { data, error: null };
    const adapter = new SupabasePrivateMediaStorageAdapter(client);
    const deletion = adapter.deleteReservedObject(storagePath);

    await expect(deletion).rejects.toMatchObject({
      code: "provider_response_invalid",
    });
  }
});

it("contains returned Storage delete failures", async () => {
  const providerError = { message: "storage unavailable", statusCode: "503" };
  const client = new Client({ data: null, error: null });
  client.bucket.removeResult = { data: null, error: providerError };
  const adapter = new SupabasePrivateMediaStorageAdapter(client);
  const deletion = adapter.deleteReservedObject(storagePath);

  await expect(deletion).rejects.toMatchObject({
    code: "storage_retryable",
  });
});

it("contains thrown Storage delete failures", async () => {
  const providerError = new Error("network failure");
  const client = new Client({ data: null, error: null });
  client.bucket.removeThrown = providerError;
  const adapter = new SupabasePrivateMediaStorageAdapter(client);

  try {
    await adapter.deleteReservedObject(storagePath);
    throw new Error("expected delete failure");
  } catch (error) {
    expect(error).toMatchObject({ code: "storage_retryable" });
    expect(error).not.toBe(providerError);
  }
});

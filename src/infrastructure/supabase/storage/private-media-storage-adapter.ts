import { MediaPersistenceError } from "@application/documents/media-persistence-error";

const PRIVATE_MEDIA_BUCKET = "project-private" as const;

interface StorageResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface StorageBucketLike {
  upload(
    path: string,
    body: Uint8Array,
    options: Readonly<Record<string, unknown>>,
  ): PromiseLike<StorageResult>;
  remove(paths: readonly string[]): PromiseLike<StorageResult>;
}

export interface SupabasePrivateMediaStorageClientLike {
  readonly storage: {
    from(bucket: string): StorageBucketLike;
  };
}

export interface UploadReservedMediaObjectInput {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}

export interface UploadReservedMediaObjectReceipt {
  readonly bucket: typeof PRIVATE_MEDIA_BUCKET;
  readonly path: string;
}

export interface DeleteReservedMediaObjectReceipt {
  readonly bucket: typeof PRIVATE_MEDIA_BUCKET;
  readonly path: string;
  readonly absent: true;
}

function isExactPathReceipt(
  value: unknown,
  expectedPath: string,
): value is Readonly<{ path: string }> {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    (value as { path?: unknown }).path === expectedPath
  );
}

function isExactDeleteReceipt(value: unknown, expectedPath: string): boolean {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  if (value.length !== 1) return false;

  const deleted = value[0];
  return (
    typeof deleted === "object" &&
    deleted !== null &&
    "name" in deleted &&
    (deleted as { name?: unknown }).name === expectedPath
  );
}

export class SupabasePrivateMediaStorageAdapter {
  constructor(private readonly client: SupabasePrivateMediaStorageClientLike) {}

  async uploadReservedObject(
    input: UploadReservedMediaObjectInput,
  ): Promise<UploadReservedMediaObjectReceipt> {
    let result: StorageResult;

    try {
      result = await this.client.storage
        .from(PRIVATE_MEDIA_BUCKET)
        .upload(input.path, input.bytes, {
          contentType: input.mimeType,
          upsert: false,
        });
    } catch {
      throw new MediaPersistenceError(
        "storage_retryable",
        "Private media Storage upload failed",
      );
    }

    if (result.error !== null) {
      throw new MediaPersistenceError(
        "storage_retryable",
        "Private media Storage upload failed",
      );
    }

    if (!isExactPathReceipt(result.data, input.path)) {
      throw new MediaPersistenceError(
        "provider_response_invalid",
        "Private media Storage returned an invalid upload receipt",
      );
    }

    return {
      bucket: PRIVATE_MEDIA_BUCKET,
      path: input.path,
    };
  }

  async deleteReservedObject(
    path: string,
  ): Promise<DeleteReservedMediaObjectReceipt> {
    let result: StorageResult;

    try {
      result = await this.client.storage
        .from(PRIVATE_MEDIA_BUCKET)
        .remove([path]);
    } catch {
      throw new MediaPersistenceError(
        "storage_retryable",
        "Private media Storage cleanup failed",
      );
    }

    if (result.error !== null) {
      throw new MediaPersistenceError(
        "storage_retryable",
        "Private media Storage cleanup failed",
      );
    }

    if (!isExactDeleteReceipt(result.data, path)) {
      throw new MediaPersistenceError(
        "provider_response_invalid",
        "Private media Storage returned an invalid cleanup receipt",
      );
    }

    return {
      bucket: PRIVATE_MEDIA_BUCKET,
      path,
      absent: true,
    };
  }
}

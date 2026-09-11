import { MediaPersistenceError } from "@application/documents/media-persistence-error";
import type {
  DeleteReservedMediaObjectReceipt,
  InspectReservedMediaObjectReceipt,
  PrivateMediaStoragePort,
  UploadReservedMediaObjectInput,
  UploadReservedMediaObjectReceipt,
} from "@application/documents/private-media-storage-port";

const PRIVATE_MEDIA_BUCKET = "project-private" as const;

interface StorageResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface StorageBucketLike {
  list(
    path: string,
    options: Readonly<Record<string, unknown>>,
  ): PromiseLike<StorageResult>;
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

function reservedObjectLocation(
  path: string,
): Readonly<{ folder: string; name: string }> | null {
  const separator = path.lastIndexOf("/");
  if (separator <= 0 || separator === path.length - 1) return null;
  return { folder: path.slice(0, separator), name: path.slice(separator + 1) };
}

function isStorageListData(
  value: unknown,
): value is readonly Readonly<{ name: string }>[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        typeof (entry as { name?: unknown }).name === "string",
    )
  );
}

export class SupabasePrivateMediaStorageAdapter implements PrivateMediaStoragePort {
  constructor(private readonly client: SupabasePrivateMediaStorageClientLike) {}

  async inspectReservedObject(
    path: string,
  ): Promise<InspectReservedMediaObjectReceipt> {
    const location = reservedObjectLocation(path);
    if (location === null) {
      throw new MediaPersistenceError(
        "provider_response_invalid",
        "Private media Storage inspection path is invalid",
      );
    }

    let result: StorageResult;
    try {
      result = await this.client.storage
        .from(PRIVATE_MEDIA_BUCKET)
        .list(location.folder, { search: location.name, limit: 2 });
    } catch {
      throw new MediaPersistenceError(
        "storage_retryable",
        "Private media Storage inspection failed",
      );
    }

    if (result.error !== null) {
      throw new MediaPersistenceError(
        "storage_retryable",
        "Private media Storage inspection failed",
      );
    }
    if (!isStorageListData(result.data)) {
      throw new MediaPersistenceError(
        "provider_response_invalid",
        "Private media Storage returned an invalid inspection receipt",
      );
    }

    return {
      bucket: PRIVATE_MEDIA_BUCKET,
      path,
      present: result.data.some((entry) => entry.name === location.name),
    };
  }

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

import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import type {
  TrustedPrivateDocumentIngestInput,
  TrustedPrivateDocumentIngestPort,
} from "@application/documents/private-document-ingest-port";

const DOCUMENT_INGEST_STAGING_BUCKET = "document-ingest-staging" as const;

interface SupabaseFunctionResponse {
  readonly data: unknown;
  readonly error: unknown;
}

interface SupabaseInvokeOptions {
  readonly headers: Readonly<Record<string, string>>;
}

interface SupabaseStorageResponse {
  readonly data: unknown;
  readonly error: unknown;
}

interface SupabaseStagingBucketLike {
  upload(
    path: string,
    body: Uint8Array,
    options: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseStorageResponse>;
}

export interface SupabasePrivateDocumentFunctionsClientLike {
  invoke(
    functionName: "private-document-ingest",
    options: SupabaseInvokeOptions,
  ): PromiseLike<SupabaseFunctionResponse>;
}

export interface SupabasePrivateDocumentStagingClientLike {
  readonly storage: {
    from(bucket: string): SupabaseStagingBucketLike;
  };
}

function isTrustedIngestReceipt(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).ok === true
  );
}

function providerStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;

  const directStatus = (error as { readonly status?: unknown }).status;
  if (typeof directStatus === "number" && Number.isInteger(directStatus)) {
    return directStatus;
  }

  const statusCode = (error as { readonly statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number" && Number.isInteger(statusCode)) {
    return statusCode;
  }
  if (typeof statusCode === "string" && /^\d{3}$/.test(statusCode)) {
    return Number(statusCode);
  }

  const context = (error as { readonly context?: unknown }).context;
  if (typeof context !== "object" || context === null) return null;
  const status = (context as { readonly status?: unknown }).status;
  return typeof status === "number" && Number.isInteger(status) ? status : null;
}

function persistenceCode(error: unknown) {
  const status = providerStatus(error);
  return status === null || status >= 500
    ? ("storage_retryable" as const)
    : ("persistence_failed" as const);
}

function stagingPath(input: TrustedPrivateDocumentIngestInput): string {
  return `${input.projectId}/documents/${input.documentId}/original`;
}

function isExactPathReceipt(value: unknown, expectedPath: string): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    (value as { readonly path?: unknown }).path === expectedPath
  );
}

export class SupabasePrivateDocumentIngestAdapter implements TrustedPrivateDocumentIngestPort {
  constructor(
    private readonly functions: SupabasePrivateDocumentFunctionsClientLike,
    private readonly staging: SupabasePrivateDocumentStagingClientLike,
  ) {}

  async ingest(input: TrustedPrivateDocumentIngestInput): Promise<void> {
    const path = stagingPath(input);
    let uploadResult: SupabaseStorageResponse;

    try {
      uploadResult = await this.staging.storage
        .from(DOCUMENT_INGEST_STAGING_BUCKET)
        .upload(path, input.bytes, {
          contentType: input.mimeType,
          upsert: false,
        });
    } catch {
      throw new DocumentPersistenceError(
        "storage_retryable",
        "Private document staging upload failed.",
      );
    }

    if (uploadResult.error !== null) {
      // A pre-existing object is not accepted as proof of success. A 409 is
      // deliberately forwarded to trusted promotion, which revalidates the
      // authoritative staged bytes against the pending reservation.
      if (providerStatus(uploadResult.error) !== 409) {
        throw new DocumentPersistenceError(
          persistenceCode(uploadResult.error),
          "Private document staging upload failed.",
        );
      }
    } else if (!isExactPathReceipt(uploadResult.data, path)) {
      throw new DocumentPersistenceError(
        "provider_response_invalid",
        "Private document staging returned an invalid upload response.",
      );
    }

    let result: SupabaseFunctionResponse;
    try {
      result = await this.functions.invoke("private-document-ingest", {
        headers: {
          "x-project-id": input.projectId,
          "x-document-id": input.documentId,
        },
      });
    } catch {
      throw new DocumentPersistenceError(
        "storage_retryable",
        "Trusted private document promotion failed.",
      );
    }

    if (result.error !== null) {
      throw new DocumentPersistenceError(
        persistenceCode(result.error),
        "Trusted private document promotion failed.",
      );
    }
    if (!isTrustedIngestReceipt(result.data)) {
      throw new DocumentPersistenceError(
        "provider_response_invalid",
        "Trusted private document promotion returned an invalid response.",
      );
    }
  }
}

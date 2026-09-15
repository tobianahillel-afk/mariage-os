import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import type {
  TrustedPrivateDocumentAbandonInput,
  TrustedPrivateDocumentIngestInput,
  TrustedPrivateDocumentIngestPort,
} from "@application/documents/private-document-ingest-port";

const DOCUMENT_INGEST_STAGING_BUCKET = "document-ingest-staging" as const;
const PROMOTION_URL = "/api/private-document-promote" as const;

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

interface SupabaseSessionResult {
  readonly data: {
    readonly session: {
      readonly access_token: unknown;
    } | null;
  };
  readonly error: unknown;
}

export interface SupabasePrivateDocumentStagingClientLike {
  readonly storage: {
    from(bucket: string): SupabaseStagingBucketLike;
  };
  readonly auth: {
    getSession(): PromiseLike<SupabaseSessionResult>;
  };
}

export type PrivateDocumentPromotionFetch = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

function isTrustedIngestReceipt(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).ok === true
  );
}

function isTrustedAbandonReceipt(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).ok === true &&
    (value as Record<string, unknown>).absent === true
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function parseProviderStatus(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  return null;
}

function providerStatus(error: unknown): number | null {
  if (!isRecord(error)) return null;
  return (
    parseProviderStatus(error.statusCode) ?? parseProviderStatus(error.status)
  );
}

function persistenceCodeFromStatus(status: number | null) {
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

function promotionToken(result: SupabaseSessionResult): string | null {
  if (result.error !== null || result.data.session === null) return null;
  const token = result.data.session.access_token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function stageDocument(
  staging: SupabasePrivateDocumentStagingClientLike,
  input: TrustedPrivateDocumentIngestInput,
  path: string,
): Promise<void> {
  let uploadResult: SupabaseStorageResponse;
  try {
    uploadResult = await staging.storage
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
    const status = providerStatus(uploadResult.error);
    if (status !== 409) {
      throw new DocumentPersistenceError(
        persistenceCodeFromStatus(status),
        "Private document staging upload failed.",
      );
    }
    return;
  }
  if (!isExactPathReceipt(uploadResult.data, path)) {
    throw new DocumentPersistenceError(
      "provider_response_invalid",
      "Private document staging returned an invalid upload response.",
    );
  }
}

async function promotionAccessToken(
  staging: SupabasePrivateDocumentStagingClientLike,
): Promise<string> {
  let sessionResult: SupabaseSessionResult;
  try {
    sessionResult = await staging.auth.getSession();
  } catch {
    throw new DocumentPersistenceError(
      "storage_retryable",
      "Private document promotion session lookup failed.",
    );
  }
  const token = promotionToken(sessionResult);
  if (token === null) {
    throw new DocumentPersistenceError(
      "persistence_failed",
      "Private document promotion requires an authenticated session.",
    );
  }
  return token;
}

async function trustedRequest(
  promotionFetch: PrivateDocumentPromotionFetch,
  method: "POST" | "DELETE",
  headers: Readonly<Record<string, string>>,
): Promise<unknown> {
  let response: Response;
  try {
    response = await promotionFetch(PROMOTION_URL, {
      method,
      cache: "no-store",
      headers,
    });
  } catch {
    throw new DocumentPersistenceError(
      "storage_retryable",
      "Trusted private document request failed.",
    );
  }
  if (!response.ok) {
    throw new DocumentPersistenceError(
      persistenceCodeFromStatus(response.status),
      "Trusted private document request failed.",
    );
  }
  return responsePayload(response);
}

function trustedHeaders(
  token: string,
  projectId: string,
  documentId: string,
): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    "x-project-id": projectId,
    "x-document-id": documentId,
  };
}

async function promoteDocument(
  promotionFetch: PrivateDocumentPromotionFetch,
  input: TrustedPrivateDocumentIngestInput,
  token: string,
): Promise<void> {
  const payload = await trustedRequest(
    promotionFetch,
    "POST",
    trustedHeaders(token, input.projectId, input.documentId),
  );
  if (!isTrustedIngestReceipt(payload)) {
    throw new DocumentPersistenceError(
      "provider_response_invalid",
      "Trusted private document promotion returned an invalid response.",
    );
  }
}

async function abandonDocument(
  promotionFetch: PrivateDocumentPromotionFetch,
  input: TrustedPrivateDocumentAbandonInput,
  token: string,
): Promise<void> {
  const payload = await trustedRequest(promotionFetch, "DELETE", {
    ...trustedHeaders(token, input.projectId, input.documentId),
    "x-operation-id": input.operationId,
  });
  if (!isTrustedAbandonReceipt(payload)) {
    throw new DocumentPersistenceError(
      "provider_response_invalid",
      "Trusted private document abandon returned an invalid response.",
    );
  }
}

export class SupabasePrivateDocumentIngestAdapter implements TrustedPrivateDocumentIngestPort {
  constructor(
    private readonly staging: SupabasePrivateDocumentStagingClientLike,
    private readonly promotionFetch: PrivateDocumentPromotionFetch = (
      input,
      init,
    ) => globalThis.fetch(input, init),
  ) {}

  async ingest(input: TrustedPrivateDocumentIngestInput): Promise<void> {
    const path = stagingPath(input);
    await stageDocument(this.staging, input, path);
    const token = await promotionAccessToken(this.staging);
    await promoteDocument(this.promotionFetch, input, token);
  }

  async abandon(input: TrustedPrivateDocumentAbandonInput): Promise<void> {
    const token = await promotionAccessToken(this.staging);
    await abandonDocument(this.promotionFetch, input, token);
  }
}

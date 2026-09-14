import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import type { PrivateDocumentState } from "@application/documents/private-document-lifecycle-port";
import type {
  PrivateDocumentDownloadPort,
  PrivateDocumentQueryPort,
} from "@application/documents/private-document-read-port";
import {
  parseActivePrivateDocumentRow,
  parseVenuePrivateDocumentLinkIds,
} from "./parse-private-document-read-row";

const PRIVATE_DOCUMENT_BUCKET = "project-private" as const;
const DOCUMENT_COLUMNS =
  "id,project_id,document_type,title,storage_path,original_filename,mime_type,size_bytes,sha256,classification,upload_status,source_id,deleted_at,revision";
const LINK_COLUMNS =
  "project_id,document_id,target_type,target_id,relationship_type";
const UUID_SOURCE =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";
const DOCUMENT_PATH_PATTERN = new RegExp(
  `^${UUID_SOURCE}/documents/${UUID_SOURCE}/original$`,
);

type PrivateDocumentTableName = "documents" | "document_links";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface PrivateDocumentQueryBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): PrivateDocumentQueryBuilder;
  in(column: string, values: readonly string[]): PrivateDocumentQueryBuilder;
  is(column: string, value: null): PrivateDocumentQueryBuilder;
  maybeSingle(): PromiseLike<SupabaseResult>;
}

interface PrivateDocumentTableLike {
  select(columns: string): PrivateDocumentQueryBuilder;
}

interface PrivateDocumentStorageBucketLike {
  download(path: string): PromiseLike<SupabaseResult>;
}

export interface SupabasePrivateDocumentReadClientLike {
  from(table: PrivateDocumentTableName): PrivateDocumentTableLike;
  readonly storage: {
    from(bucket: string): PrivateDocumentStorageBucketLike;
  };
}

function persistenceFailed(): never {
  throw new DocumentPersistenceError(
    "persistence_failed",
    "Private document read persistence failed.",
  );
}

function invalidResponse(): never {
  throw new DocumentPersistenceError(
    "provider_response_invalid",
    "Invalid private document read provider response.",
  );
}

function storageRetryable(): never {
  throw new DocumentPersistenceError(
    "storage_retryable",
    "Private document download failed.",
  );
}

async function providerResult(
  operation: PromiseLike<SupabaseResult>,
): Promise<SupabaseResult> {
  try {
    const result = await operation;
    if (result.error !== null) persistenceFailed();
    return result;
  } catch (error) {
    if (error instanceof DocumentPersistenceError) throw error;
    persistenceFailed();
  }
}

function documentQuery(
  client: SupabasePrivateDocumentReadClientLike,
  projectId: string,
): PrivateDocumentQueryBuilder {
  return client
    .from("documents")
    .select(DOCUMENT_COLUMNS)
    .eq("project_id", projectId);
}

function activeDocumentListQuery(
  client: SupabasePrivateDocumentReadClientLike,
  projectId: string,
): PrivateDocumentQueryBuilder {
  return documentQuery(client, projectId)
    .eq("upload_status", "ready")
    .is("deleted_at", null);
}

function parsedDocumentRows(
  value: unknown,
  projectId: string,
  allowedDocumentIds: ReadonlySet<string>,
): readonly PrivateDocumentState[] {
  if (!Array.isArray(value)) invalidResponse();
  return value.map((row) => {
    const document = parseActivePrivateDocumentRow(row, projectId);
    if (!allowedDocumentIds.has(document.id)) invalidResponse();
    return document;
  });
}

function hasArrayBuffer(
  value: unknown,
): value is { arrayBuffer(): Promise<ArrayBuffer> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
}

export class SupabasePrivateDocumentReadAdapter
  implements PrivateDocumentQueryPort, PrivateDocumentDownloadPort
{
  constructor(private readonly client: SupabasePrivateDocumentReadClientLike) {}

  async listVenueDocuments(
    projectId: string,
    venueId: string,
  ): Promise<readonly PrivateDocumentState[]> {
    const links = await providerResult(
      this.client
        .from("document_links")
        .select(LINK_COLUMNS)
        .eq("project_id", projectId)
        .eq("target_type", "venue")
        .eq("target_id", venueId),
    );
    const documentIds = parseVenuePrivateDocumentLinkIds(
      links.data,
      projectId,
      venueId,
    );
    if (documentIds.length === 0) return [];

    const documents = await providerResult(
      activeDocumentListQuery(this.client, projectId).in("id", documentIds),
    );
    return parsedDocumentRows(
      documents.data,
      projectId,
      new Set(documentIds),
    );
  }

  async getActiveDocument(
    projectId: string,
    documentId: string,
  ): Promise<PrivateDocumentState | null> {
    const result = await providerResult(
      documentQuery(this.client, projectId)
        .eq("id", documentId)
        .eq("upload_status", "ready")
        .is("deleted_at", null)
        .maybeSingle(),
    );
    if (result.data === null) return null;
    return parseActivePrivateDocumentRow(result.data, projectId, documentId);
  }

  async download(path: string): Promise<Uint8Array> {
    if (!DOCUMENT_PATH_PATTERN.test(path)) invalidResponse();

    let result: SupabaseResult;
    try {
      result = await this.client.storage
        .from(PRIVATE_DOCUMENT_BUCKET)
        .download(path);
    } catch {
      storageRetryable();
    }
    if (result.error !== null) storageRetryable();
    if (!hasArrayBuffer(result.data)) invalidResponse();

    let buffer: ArrayBuffer;
    try {
      buffer = await result.data.arrayBuffer();
    } catch {
      storageRetryable();
    }
    if (!(buffer instanceof ArrayBuffer)) invalidResponse();
    return new Uint8Array(buffer);
  }
}

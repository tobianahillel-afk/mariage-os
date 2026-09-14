import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import type {
  TrustedPrivateDocumentIngestInput,
  TrustedPrivateDocumentIngestPort,
} from "@application/documents/private-document-ingest-port";

interface SupabaseFunctionResponse {
  readonly data: unknown;
  readonly error: unknown;
}

interface SupabaseInvokeOptions {
  readonly body: ArrayBuffer;
  readonly headers: Readonly<Record<string, string>>;
}

export interface SupabasePrivateDocumentFunctionsClientLike {
  invoke(
    functionName: "private-document-ingest",
    options: SupabaseInvokeOptions,
  ): PromiseLike<SupabaseFunctionResponse>;
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

export class SupabasePrivateDocumentIngestAdapter implements TrustedPrivateDocumentIngestPort {
  constructor(
    private readonly functions: SupabasePrivateDocumentFunctionsClientLike,
  ) {}

  async ingest(input: TrustedPrivateDocumentIngestInput): Promise<void> {
    let result: SupabaseFunctionResponse;
    try {
      result = await this.functions.invoke("private-document-ingest", {
        body: input.bytes.slice().buffer,
        headers: {
          "x-project-id": input.projectId,
          "x-document-id": input.documentId,
          "x-document-mime-type": input.mimeType,
        },
      });
    } catch {
      throw new DocumentPersistenceError(
        "storage_retryable",
        "Trusted private document ingestion failed.",
      );
    }

    if (result.error !== null) {
      throw new DocumentPersistenceError(
        persistenceCode(result.error),
        "Trusted private document ingestion failed.",
      );
    }
    if (!isTrustedIngestReceipt(result.data)) {
      throw new DocumentPersistenceError(
        "provider_response_invalid",
        "Trusted private document ingestion returned an invalid response.",
      );
    }
  }
}

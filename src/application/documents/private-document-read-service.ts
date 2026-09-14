import { validateVenuePrivatePdf } from "@domain/documents/venue-private-document";
import {
  DocumentPersistenceError,
  documentPersistenceErrorCode,
  type DocumentPersistenceErrorCode,
} from "./document-persistence-error";
import type { PrivateDocumentState } from "./private-document-lifecycle-port";
import type {
  PrivateDocumentDownload,
  PrivateDocumentDownloadPort,
  PrivateDocumentQueryPort,
} from "./private-document-read-port";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface PrivateDocumentReadPorts {
  readonly query: PrivateDocumentQueryPort;
  readonly download: PrivateDocumentDownloadPort;
}

type PrivateDocumentReadError = "invalid_identity" | DocumentPersistenceErrorCode;

export type PrivateDocumentReadResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: PrivateDocumentReadError };

function identity(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function canonicalPath(projectId: string, documentId: string): string {
  return `${projectId}/documents/${documentId}/original`;
}

function activeDocumentMatches(
  document: PrivateDocumentState,
  projectId: string,
  documentId?: string,
): boolean {
  return (
    document.projectId === projectId &&
    (documentId === undefined || document.id === documentId) &&
    document.uploadStatus === "ready" &&
    document.deletedAt === null &&
    document.storagePath === canonicalPath(projectId, document.id)
  );
}

function invalidProviderResponse(): never {
  throw new DocumentPersistenceError(
    "provider_response_invalid",
    "Invalid private document read provider response.",
  );
}

async function executeRead<T>(
  identities: readonly unknown[],
  run: (validated: readonly string[]) => Promise<T>,
): Promise<PrivateDocumentReadResult<T>> {
  if (!identities.every(identity)) {
    return { ok: false, error: "invalid_identity" };
  }

  try {
    return { ok: true, value: await run(identities) };
  } catch (error) {
    return {
      ok: false,
      error: documentPersistenceErrorCode(error) ?? "persistence_failed",
    };
  }
}

export class PrivateDocumentReadService {
  constructor(private readonly ports: PrivateDocumentReadPorts) {}

  listVenueDocuments(
    projectId: unknown,
    venueId: unknown,
  ): Promise<PrivateDocumentReadResult<readonly PrivateDocumentState[]>> {
    return executeRead([projectId, venueId], async ([project, venue]) => {
      const documents = await this.ports.query.listVenueDocuments(
        project as string,
        venue as string,
      );
      if (
        !documents.every((document) =>
          activeDocumentMatches(document, project as string),
        )
      ) {
        invalidProviderResponse();
      }
      return documents;
    });
  }

  getActiveDocument(
    projectId: unknown,
    documentId: unknown,
  ): Promise<PrivateDocumentReadResult<PrivateDocumentState | null>> {
    return executeRead([projectId, documentId], ([project, document]) =>
      this.resolveActiveDocument(project as string, document as string),
    );
  }

  downloadActiveDocument(
    projectId: unknown,
    documentId: unknown,
  ): Promise<PrivateDocumentReadResult<PrivateDocumentDownload | null>> {
    return executeRead([projectId, documentId], async ([project, document]) => {
      const active = await this.resolveActiveDocument(
        project as string,
        document as string,
      );
      if (active === null) return null;

      const bytes = await this.ports.download.download(active.storagePath);
      const validated = validateVenuePrivatePdf({
        originalFilename: active.originalFilename,
        declaredMimeType: active.mimeType,
        bytes,
      });
      if (!validated.ok || validated.value.sizeBytes !== active.sizeBytes) {
        invalidProviderResponse();
      }

      return {
        document: active,
        bytes,
        disposition: "attachment",
        filename: active.originalFilename,
        mimeType: active.mimeType,
      };
    });
  }

  private async resolveActiveDocument(
    projectId: string,
    documentId: string,
  ): Promise<PrivateDocumentState | null> {
    const document = await this.ports.query.getActiveDocument(
      projectId,
      documentId,
    );
    if (document === null) return null;
    if (!activeDocumentMatches(document, projectId, documentId)) {
      invalidProviderResponse();
    }
    return document;
  }
}

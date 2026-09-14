import type { PrivateDocumentState } from "./private-document-lifecycle-port";

export interface PrivateDocumentQueryPort {
  listVenueDocuments(
    projectId: string,
    venueId: string,
  ): Promise<readonly PrivateDocumentState[]>;
  getActiveDocument(
    projectId: string,
    documentId: string,
  ): Promise<PrivateDocumentState | null>;
}

export interface PrivateDocumentDownloadPort {
  download(path: string): Promise<Uint8Array>;
}

export interface PrivateDocumentDownload {
  readonly document: PrivateDocumentState;
  readonly bytes: Uint8Array;
  readonly disposition: "attachment";
  readonly filename: string;
  readonly mimeType: "application/pdf";
}

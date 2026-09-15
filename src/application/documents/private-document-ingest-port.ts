export interface TrustedPrivateDocumentIngestInput {
  readonly projectId: string;
  readonly documentId: string;
  readonly bytes: Uint8Array;
  readonly mimeType: "application/pdf";
}

export interface TrustedPrivateDocumentAbandonInput {
  readonly operationId: string;
  readonly projectId: string;
  readonly documentId: string;
}

export interface TrustedPrivateDocumentIngestPort {
  ingest(input: TrustedPrivateDocumentIngestInput): Promise<void>;
  abandon(input: TrustedPrivateDocumentAbandonInput): Promise<void>;
}

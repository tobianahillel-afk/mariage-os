export interface TrustedPrivateDocumentIngestInput {
  readonly projectId: string;
  readonly documentId: string;
  readonly bytes: Uint8Array;
  readonly mimeType: "application/pdf";
}

export interface TrustedPrivateDocumentIngestPort {
  ingest(input: TrustedPrivateDocumentIngestInput): Promise<void>;
}

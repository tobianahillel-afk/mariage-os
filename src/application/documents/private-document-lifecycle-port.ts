export interface PrivateDocumentState {
  readonly id: string;
  readonly projectId: string;
  readonly documentType: string;
  readonly title: string;
  readonly storagePath: string;
  readonly originalFilename: string;
  readonly mimeType: "application/pdf";
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly classification: "private";
  readonly uploadStatus: "pending" | "ready";
  readonly sourceId: string | null;
  readonly deletedAt: string | null;
  readonly revision: number;
}

export interface PrivateDocumentLinkState {
  readonly id: string;
  readonly projectId: string;
  readonly documentId: string;
  readonly venueId: string;
}

export interface ReservePrivateDocumentInput {
  readonly operationId: string;
  readonly projectId: string;
  readonly documentId: string;
  readonly documentType: string;
  readonly title: string;
  readonly originalFilename: string;
  readonly mimeType: "application/pdf";
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly sourceId: string | null;
}

export interface PrivateDocumentIdentityInput {
  readonly operationId: string;
  readonly projectId: string;
  readonly documentId: string;
}

export interface LinkPrivateDocumentVenueInput extends PrivateDocumentIdentityInput {
  readonly venueId: string;
  readonly linkId: string;
  readonly expectedRevision: number;
}

export interface TransitionPrivateDocumentInput extends PrivateDocumentIdentityInput {
  readonly expectedRevision: number;
}

export interface PrivateDocumentReceipt {
  readonly replayed: boolean;
  readonly document: PrivateDocumentState;
}

export interface PrivateDocumentLinkReceipt extends PrivateDocumentReceipt {
  readonly link: PrivateDocumentLinkState;
}

export interface PrivateDocumentUnlinkReceipt extends PrivateDocumentReceipt {
  readonly linkId: string;
  readonly absent: true;
}

export interface PrivateDocumentAbandonReceipt {
  readonly replayed: boolean;
  readonly projectId: string;
  readonly documentId: string;
  readonly absent: true;
}

export interface PrivateDocumentLifecyclePort {
  reserveUpload(
    input: ReservePrivateDocumentInput,
  ): Promise<PrivateDocumentReceipt>;
  finalizeUpload(
    input: PrivateDocumentIdentityInput,
  ): Promise<PrivateDocumentReceipt>;
  abandonUpload(
    input: PrivateDocumentIdentityInput,
  ): Promise<PrivateDocumentAbandonReceipt>;
  linkVenue(
    input: LinkPrivateDocumentVenueInput,
  ): Promise<PrivateDocumentLinkReceipt>;
  unlinkVenue(
    input: LinkPrivateDocumentVenueInput,
  ): Promise<PrivateDocumentUnlinkReceipt>;
  softDelete(
    input: TransitionPrivateDocumentInput,
  ): Promise<PrivateDocumentReceipt>;
  restore(
    input: TransitionPrivateDocumentInput,
  ): Promise<PrivateDocumentReceipt>;
}

export interface PrivateDocumentSha256Port {
  hash(bytes: Uint8Array): Promise<string>;
}

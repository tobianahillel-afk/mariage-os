export interface UploadReservedDocumentObjectInput {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly mimeType: "application/pdf";
}

export interface InspectReservedDocumentObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
  readonly present: boolean;
}

export interface UploadReservedDocumentObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
}

export interface DeleteReservedDocumentObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
  readonly absent: true;
}

export interface PrivateDocumentStoragePort {
  inspectReservedObject(
    path: string,
  ): Promise<InspectReservedDocumentObjectReceipt>;
  uploadReservedObject(
    input: UploadReservedDocumentObjectInput,
  ): Promise<UploadReservedDocumentObjectReceipt>;
  deleteReservedObject(
    path: string,
  ): Promise<DeleteReservedDocumentObjectReceipt>;
}

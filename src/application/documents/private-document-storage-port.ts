interface InspectReservedDocumentObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
  readonly present: boolean;
}

interface DeleteReservedDocumentObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
  readonly absent: true;
}

export interface PrivateDocumentStoragePort {
  inspectReservedObject(
    path: string,
  ): Promise<InspectReservedDocumentObjectReceipt>;
  deleteReservedObject(
    path: string,
  ): Promise<DeleteReservedDocumentObjectReceipt>;
}

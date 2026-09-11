export interface UploadReservedMediaObjectInput {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}

export interface UploadReservedMediaObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
}

export interface InspectReservedMediaObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
  readonly present: boolean;
}

export interface DeleteReservedMediaObjectReceipt {
  readonly bucket: "project-private";
  readonly path: string;
  readonly absent: true;
}

export interface PrivateMediaStoragePort {
  inspectReservedObject(
    path: string,
  ): Promise<InspectReservedMediaObjectReceipt>;
  uploadReservedObject(
    input: UploadReservedMediaObjectInput,
  ): Promise<UploadReservedMediaObjectReceipt>;
  deleteReservedObject(path: string): Promise<DeleteReservedMediaObjectReceipt>;
}

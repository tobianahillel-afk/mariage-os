interface PrivateMediaImageInspection {
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface PrivateMediaImageInspectorPort {
  inspect(bytes: Uint8Array): Promise<PrivateMediaImageInspection>;
}

export class PrivateMediaImageInspectionError extends Error {
  readonly code = "decode_failed" as const;

  constructor(message: string) {
    super(message);
    this.name = "PrivateMediaImageInspectionError";
  }
}

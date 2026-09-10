import {
  PrivateMediaImageInspectionError,
  type PrivateMediaImageInspectorPort,
} from "@application/documents/private-media-image-inspector-port";

interface DecodedImage {
  readonly width: number;
  readonly height: number;
  close(): void;
}

type DecodeImage = (
  source: Blob,
  options?: ImageBitmapOptions,
) => Promise<DecodedImage>;

export class BrowserPrivateMediaImageInspector implements PrivateMediaImageInspectorPort {
  constructor(private readonly decode: DecodeImage) {}

  async inspect(bytes: Uint8Array): Promise<{
    readonly widthPx: number;
    readonly heightPx: number;
  }> {
    let image: DecodedImage;
    try {
      image = await this.decode(new Blob([Uint8Array.from(bytes)]), {
        imageOrientation: "from-image",
      });
    } catch {
      throw new PrivateMediaImageInspectionError(
        "Private image bytes could not be decoded.",
      );
    }

    try {
      return { widthPx: image.width, heightPx: image.height };
    } finally {
      image.close();
    }
  }
}

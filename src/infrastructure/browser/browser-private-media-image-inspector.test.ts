import { expect, it } from "vitest";
import {
  BrowserPrivateMediaImageInspector,
} from "@infra/browser/browser-private-media-image-inspector";

it("decodes exact private image bytes and closes the bitmap", async () => {
  let closed = false;
  const calls: Array<{
    source: Blob;
    options: ImageBitmapOptions | undefined;
  }> = [];
  const decode = async (source: Blob, options?: ImageBitmapOptions) => {
    calls.push({ source, options });
    return {
      width: 640,
      height: 480,
      close() {
        closed = true;
      },
    };
  };
  const inspector = new BrowserPrivateMediaImageInspector(decode);
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);

  await expect(inspector.inspect(bytes)).resolves.toEqual({
    widthPx: 640,
    heightPx: 480,
  });
  expect(calls).toHaveLength(1);
  expect(calls[0]?.source).toBeInstanceOf(Blob);
  expect(calls[0]?.options).toEqual({ imageOrientation: "from-image" });
  expect(closed).toBe(true);
});

it("maps browser decode rejection to a stable typed failure", async () => {
  const decode = async () => {
    throw new Error("decoder rejected malformed bytes");
  };
  const inspector = new BrowserPrivateMediaImageInspector(decode);

  await expect(
    inspector.inspect(new Uint8Array([0x00])),
  ).rejects.toMatchObject({
    name: "PrivateMediaImageInspectionError",
    code: "decode_failed",
  });
});

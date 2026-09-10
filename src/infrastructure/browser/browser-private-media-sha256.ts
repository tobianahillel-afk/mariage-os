import {
  PrivateMediaSha256Error,
  type PrivateMediaSha256Port,
} from "@application/documents/private-media-sha256-port";

type Digest = (algorithm: string, bytes: Uint8Array) => Promise<ArrayBuffer>;

const browserDigest: Digest = (algorithm, bytes) =>
  globalThis.crypto.subtle.digest(algorithm, Uint8Array.from(bytes));

export class BrowserPrivateMediaSha256 implements PrivateMediaSha256Port {
  constructor(private readonly digest: Digest = browserDigest) {}

  async hashExactBytes(bytes: Uint8Array): Promise<string> {
    try {
      const digest = new Uint8Array(
        await this.digest("SHA-256", Uint8Array.from(bytes)),
      );
      if (digest.byteLength !== 32) {
        throw new Error("Unexpected SHA-256 digest length.");
      }
      return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(
        "",
      );
    } catch {
      throw new PrivateMediaSha256Error(
        "Private media bytes could not be hashed.",
      );
    }
  }
}

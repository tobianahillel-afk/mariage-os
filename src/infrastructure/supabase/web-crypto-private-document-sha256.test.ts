import { describe, expect, it } from "vitest";
import { WebCryptoPrivateDocumentSha256 } from "./web-crypto-private-document-sha256";

describe("WebCryptoPrivateDocumentSha256", () => {
  it("hashes the exact byte sequence as lowercase SHA-256 hex", async () => {
    const adapter = new WebCryptoPrivateDocumentSha256();
    const bytes = new Uint8Array([0x61, 0x62, 0x63]);

    await expect(adapter.hash(bytes)).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

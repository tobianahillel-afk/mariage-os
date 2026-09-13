import type { PrivateDocumentSha256Port } from "@application/documents/private-document-lifecycle-port";

export class WebCryptoPrivateDocumentSha256 implements PrivateDocumentSha256Port {
  async hash(bytes: Uint8Array): Promise<string> {
    const copy = Uint8Array.from(bytes);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", copy);
    return Array.from(new Uint8Array(digest), (value) =>
      value.toString(16).padStart(2, "0"),
    ).join("");
  }
}

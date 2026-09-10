export interface PrivateMediaSha256Port {
  hashExactBytes(bytes: Uint8Array): Promise<string>;
}

export class PrivateMediaSha256Error extends Error {
  readonly code = "hash_failed" as const;

  constructor(message: string) {
    super(message);
    this.name = "PrivateMediaSha256Error";
  }
}

import { expect, it } from "vitest";
import { BrowserPrivateMediaSha256 } from "./browser-private-media-sha256";

const canonicalDigest = Uint8Array.from({ length: 32 }, (_, index) => index);
const expectedSha256 =
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const abcSha256 =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

it("hashes exact bytes with SHA-256 and canonical lowercase hex", async () => {
  let receivedAlgorithm: string | null = null;
  let receivedBytes: Uint8Array | null = null;
  const digest = async (algorithm: string, bytes: Uint8Array) => {
    receivedAlgorithm = algorithm;
    receivedBytes = Uint8Array.from(bytes);
    return canonicalDigest.buffer;
  };
  const hasher = new BrowserPrivateMediaSha256(digest);
  const bytes = new Uint8Array([0x00, 0xff, 0x10, 0xab]);

  await expect(hasher.hashExactBytes(bytes)).resolves.toBe(expectedSha256);
  expect(receivedAlgorithm).toBe("SHA-256");
  expect(receivedBytes).toEqual(bytes);
});

it("uses browser Web Crypto by default", async () => {
  const hasher = new BrowserPrivateMediaSha256();
  const hash = await hasher.hashExactBytes(new Uint8Array([0x61, 0x62, 0x63]));

  expect(hash).toBe(abcSha256);
});

it("maps digest rejection to a stable typed failure", async () => {
  const digest = async () => {
    throw new Error("crypto unavailable");
  };
  const hasher = new BrowserPrivateMediaSha256(digest);
  const failure = hasher.hashExactBytes(new Uint8Array([0x01]));

  await expect(failure).rejects.toMatchObject({
    name: "PrivateMediaSha256Error",
    code: "hash_failed",
  });
});

it("rejects malformed SHA-256 digest length", async () => {
  const digest = async () => new Uint8Array(31).buffer;
  const hasher = new BrowserPrivateMediaSha256(digest);
  const failure = hasher.hashExactBytes(new Uint8Array([0x01]));

  await expect(failure).rejects.toMatchObject({
    name: "PrivateMediaSha256Error",
    code: "hash_failed",
  });
});

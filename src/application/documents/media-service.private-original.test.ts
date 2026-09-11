import { expect, it } from "vitest";
import type { VenueRemoteMediaBundle } from "@domain/documents/venue-remote-media";
import { MediaPersistenceError } from "./media-persistence-error";
import { MediaService, type MediaPort } from "./media-service";
import type { PrivateMediaImageInspectorPort } from "./private-media-image-inspector-port";
import type {
  PrivateMediaLifecyclePort,
  ReserveVenuePrivateOriginalInput,
} from "./private-media-lifecycle-port";
import type { PrivateMediaSha256Port } from "./private-media-sha256-port";
import type { PrivateMediaStoragePort } from "./private-media-storage-port";

const operationId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const venueId = "33333333-3333-4333-8333-333333333333";
const mediaId = "44444444-4444-4444-8444-444444444444";
const linkId = "55555555-5555-4555-8555-555555555555";
const storagePath = `${projectId}/media/${mediaId}/original`;
const sha256 = "a".repeat(64);

const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);

const remotePort: MediaPort = {
  async createVenueRemoteMedia(): Promise<VenueRemoteMediaBundle> {
    throw new Error("unused");
  },
  async listVenueRemoteMedia(): Promise<readonly VenueRemoteMediaBundle[]> {
    return [];
  },
};

function request(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    operationId,
    projectId,
    venueId,
    mediaId,
    linkId,
    category: "own_visit",
    caption: " Own visit ",
    originalFilename: "visit.jpg",
    bytes,
    ...overrides,
  };
}

function privatePorts(options?: {
  readonly storageError?: unknown;
  readonly finalizeError?: unknown;
}) {
  const events: string[] = [];
  let reserveInput: ReserveVenuePrivateOriginalInput | null = null;

  const imageInspector: PrivateMediaImageInspectorPort = {
    async inspect(receivedBytes) {
      events.push("inspect");
      expect(receivedBytes).toBe(bytes);
      return { widthPx: 4_000, heightPx: 3_000 };
    },
  };
  const sha: PrivateMediaSha256Port = {
    async hashExactBytes(receivedBytes) {
      events.push("hash");
      expect(receivedBytes).toBe(bytes);
      return sha256;
    },
  };
  const lifecycle: PrivateMediaLifecyclePort = {
    async reserveOriginal(input) {
      events.push("reserve");
      reserveInput = input;
      return { storagePath, replayed: false };
    },
    async finalizeOriginal() {
      events.push("finalize");
      if (options?.finalizeError !== undefined) throw options.finalizeError;
      return { storagePath, replayed: false };
    },
    async abandonOriginal() {
      throw new Error("unused");
    },
  };
  const storage: PrivateMediaStoragePort = {
    async uploadReservedObject(input) {
      events.push("upload");
      expect(input).toEqual({
        path: storagePath,
        bytes,
        mimeType: "image/jpeg",
      });
      if (options?.storageError !== undefined) throw options.storageError;
      return { bucket: "project-private", path: storagePath };
    },
    async deleteReservedObject() {
      throw new Error("unused");
    },
  };

  return {
    events,
    get reserveInput() {
      return reserveInput;
    },
    value: { lifecycle, storage, imageInspector, sha256: sha },
  };
}

it("creates a private original in the frozen safe order", async () => {
  const privateMedia = privatePorts();
  const service = new MediaService(remotePort, privateMedia.value);

  const result = await service.createVenuePrivateOriginal(request());

  expect(result).toEqual({
    ok: true,
    value: { storagePath, replayed: false },
  });
  expect(privateMedia.events).toEqual([
    "inspect",
    "hash",
    "reserve",
    "upload",
    "finalize",
  ]);
  expect(privateMedia.reserveInput).toEqual({
    operationId,
    projectId,
    venueId,
    mediaId,
    linkId,
    category: "own_visit",
    caption: "Own visit",
    originalFilename: "visit.jpg",
    mimeType: "image/jpeg",
    sizeBytes: bytes.byteLength,
    sha256,
    widthPx: 4_000,
    heightPx: 3_000,
  });
});

it("rejects unsupported bytes before decode, hash, or reservation", async () => {
  const privateMedia = privatePorts();
  const service = new MediaService(remotePort, privateMedia.value);

  const result = await service.createVenuePrivateOriginal(
    request({ originalFilename: "visit.png" }),
  );

  expect(result).toEqual({ ok: false, error: "unsupported_type" });
  expect(privateMedia.events).toEqual([]);
});

it("keeps the pending reservation when Storage upload fails", async () => {
  const privateMedia = privatePorts({
    storageError: new MediaPersistenceError("storage_retryable", "retry"),
  });
  const service = new MediaService(remotePort, privateMedia.value);

  const result = await service.createVenuePrivateOriginal(request());

  expect(result).toEqual({ ok: false, error: "storage_retryable" });
  expect(privateMedia.events).toEqual(["inspect", "hash", "reserve", "upload"]);
});

it("keeps the pending reservation and uploaded object when finalize fails", async () => {
  const privateMedia = privatePorts({
    finalizeError: new MediaPersistenceError("persistence_failed", "retry"),
  });
  const service = new MediaService(remotePort, privateMedia.value);

  const result = await service.createVenuePrivateOriginal(request());

  expect(result).toEqual({ ok: false, error: "persistence_failed" });
  expect(privateMedia.events).toEqual([
    "inspect",
    "hash",
    "reserve",
    "upload",
    "finalize",
  ]);
});

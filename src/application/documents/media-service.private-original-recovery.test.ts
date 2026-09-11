import { expect, it } from "vitest";
import type { VenueRemoteMediaBundle } from "@domain/documents/venue-remote-media";
import { MediaPersistenceError } from "./media-persistence-error";
import { MediaService, type MediaPort } from "./media-service";
import type { PrivateMediaImageInspectorPort } from "./private-media-image-inspector-port";
import type { PrivateMediaLifecyclePort } from "./private-media-lifecycle-port";
import type { PrivateMediaSha256Port } from "./private-media-sha256-port";
import type { PrivateMediaStoragePort } from "./private-media-storage-port";

const operationId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const venueId = "33333333-3333-4333-8333-333333333333";
const mediaId = "44444444-4444-4444-8444-444444444444";
const linkId = "55555555-5555-4555-8555-555555555555";
const storagePath = `${projectId}/media/${mediaId}/original`;
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);

const remotePort: MediaPort = {
  async createVenueRemoteMedia(): Promise<VenueRemoteMediaBundle> {
    throw new Error("unused");
  },
  async listVenueRemoteMedia(): Promise<readonly VenueRemoteMediaBundle[]> {
    return [];
  },
};

interface RecoveryOptions {
  readonly present?: boolean;
  readonly inspectionError?: unknown;
  readonly inspectionBucket?: unknown;
  readonly inspectionPath?: unknown;
  readonly inspectionPresent?: unknown;
}

function request() {
  return {
    operationId,
    projectId,
    venueId,
    mediaId,
    linkId,
    category: "own_visit",
    caption: "Own visit",
    originalFilename: "visit.jpg",
    bytes,
  };
}

function recoveryLifecycle(events: string[]): PrivateMediaLifecyclePort {
  return {
    async reserveOriginal() {
      events.push("reserve");
      return { storagePath, replayed: true };
    },
    async finalizeOriginal() {
      events.push("finalize");
      return { storagePath, replayed: false };
    },
    async abandonOriginal() {
      throw new Error("unused");
    },
  };
}

function recoveryStorage(
  events: string[],
  options: RecoveryOptions,
): PrivateMediaStoragePort {
  return {
    async inspectReservedObject(path) {
      events.push("inspect_storage");
      expect(path).toBe(storagePath);
      if (options.inspectionError !== undefined) {
        throw options.inspectionError;
      }
      return {
        bucket: (options.inspectionBucket ?? "project-private") as never,
        path: (options.inspectionPath ?? path) as never,
        present: (options.inspectionPresent ??
          options.present ??
          false) as never,
      };
    },
    async uploadReservedObject(input) {
      events.push("upload");
      expect(input).toEqual({
        path: storagePath,
        bytes,
        mimeType: "image/jpeg",
      });
      return { bucket: "project-private", path: storagePath };
    },
    async deleteReservedObject() {
      throw new Error("unused");
    },
  };
}

function recoveryInspector(events: string[]): PrivateMediaImageInspectorPort {
  return {
    async inspect(input) {
      events.push("inspect");
      expect(input).toBe(bytes);
      return { widthPx: 4_000, heightPx: 3_000 };
    },
  };
}

function recoverySha256(events: string[]): PrivateMediaSha256Port {
  return {
    async hashExactBytes(input) {
      events.push("hash");
      expect(input).toBe(bytes);
      return "a".repeat(64);
    },
  };
}

function recoveryHarness(options: RecoveryOptions = {}) {
  const events: string[] = [];
  const service = new MediaService(remotePort, {
    lifecycle: recoveryLifecycle(events),
    storage: recoveryStorage(events, options),
    imageInspector: recoveryInspector(events),
    sha256: recoverySha256(events),
  });
  return { events, service };
}

it("finalizes a replayed pending reservation without re-upload when the exact object is present", async () => {
  const harness = recoveryHarness({ present: true });

  await expect(
    harness.service.createVenuePrivateOriginal(request()),
  ).resolves.toEqual({
    ok: true,
    value: { storagePath, replayed: false },
  });
  expect(harness.events).toEqual([
    "inspect",
    "hash",
    "reserve",
    "inspect_storage",
    "finalize",
  ]);
});

it("re-uploads exact bytes for a replayed pending reservation when the object is absent", async () => {
  const harness = recoveryHarness({ present: false });

  await expect(
    harness.service.createVenuePrivateOriginal(request()),
  ).resolves.toEqual({
    ok: true,
    value: { storagePath, replayed: false },
  });
  expect(harness.events).toEqual([
    "inspect",
    "hash",
    "reserve",
    "inspect_storage",
    "upload",
    "finalize",
  ]);
});

it("keeps a replayed reservation pending when Storage presence cannot be confirmed", async () => {
  const harness = recoveryHarness({
    inspectionError: new MediaPersistenceError("storage_retryable", "retry"),
  });

  await expect(
    harness.service.createVenuePrivateOriginal(request()),
  ).resolves.toEqual({ ok: false, error: "storage_retryable" });
  expect(harness.events).toEqual([
    "inspect",
    "hash",
    "reserve",
    "inspect_storage",
  ]);
});

it("rejects substituted or malformed Storage inspection receipts", async () => {
  const cases: readonly RecoveryOptions[] = [
    { inspectionBucket: "other" },
    { inspectionPath: `${storagePath}-other` },
    { inspectionPresent: "yes" },
  ];

  for (const options of cases) {
    const harness = recoveryHarness(options);
    await expect(
      harness.service.createVenuePrivateOriginal(request()),
    ).resolves.toEqual({ ok: false, error: "provider_response_invalid" });
    expect(harness.events).toEqual([
      "inspect",
      "hash",
      "reserve",
      "inspect_storage",
    ]);
  }
});

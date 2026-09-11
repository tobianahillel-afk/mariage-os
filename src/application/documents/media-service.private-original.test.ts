import { expect, it } from "vitest";
import type { VenueRemoteMediaBundle } from "@domain/documents/venue-remote-media";
import { MediaPersistenceError } from "./media-persistence-error";
import { MediaService, type MediaPort } from "./media-service";
import {
  PrivateMediaImageInspectionError,
  type PrivateMediaImageInspectorPort,
} from "./private-media-image-inspector-port";
import type {
  PrivateMediaLifecyclePort,
  ReserveVenuePrivateOriginalInput,
} from "./private-media-lifecycle-port";
import {
  PrivateMediaSha256Error,
  type PrivateMediaSha256Port,
} from "./private-media-sha256-port";
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

interface PrivatePortOptions {
  readonly storageError?: unknown;
  readonly finalizeError?: unknown;
  readonly inspectionError?: unknown;
  readonly hashError?: unknown;
  readonly widthPx?: number;
  readonly heightPx?: number;
  readonly reservationPath?: string;
  readonly uploadPath?: string;
  readonly invalidUploadBucket?: boolean;
  readonly finalizationPath?: string;
}

interface PrivatePortState {
  readonly events: string[];
  reserveInput: ReserveVenuePrivateOriginalInput | null;
}

function imageInspectorPort(
  state: PrivatePortState,
  options: PrivatePortOptions,
): PrivateMediaImageInspectorPort {
  return {
    async inspect(receivedBytes) {
      state.events.push("inspect");
      expect(receivedBytes).toBe(bytes);
      if (options.inspectionError !== undefined) throw options.inspectionError;
      return {
        widthPx: options.widthPx ?? 4_000,
        heightPx: options.heightPx ?? 3_000,
      };
    },
  };
}

function sha256Port(
  state: PrivatePortState,
  options: PrivatePortOptions,
): PrivateMediaSha256Port {
  return {
    async hashExactBytes(receivedBytes) {
      state.events.push("hash");
      expect(receivedBytes).toBe(bytes);
      if (options.hashError !== undefined) throw options.hashError;
      return sha256;
    },
  };
}

function lifecyclePort(
  state: PrivatePortState,
  options: PrivatePortOptions,
): PrivateMediaLifecyclePort {
  return {
    async reserveOriginal(input) {
      state.events.push("reserve");
      state.reserveInput = input;
      return {
        storagePath: options.reservationPath ?? storagePath,
        replayed: false,
      };
    },
    async finalizeOriginal() {
      state.events.push("finalize");
      if (options.finalizeError !== undefined) throw options.finalizeError;
      return {
        storagePath: options.finalizationPath ?? storagePath,
        replayed: false,
        duplicateOriginalMediaIds: [],
      };
    },
    async abandonOriginal() {
      throw new Error("unused");
    },
  };
}

function storagePort(
  state: PrivatePortState,
  options: PrivatePortOptions,
): PrivateMediaStoragePort {
  return {
    async inspectReservedObject() {
      throw new Error("unused");
    },
    async uploadReservedObject(input) {
      state.events.push("upload");
      expect(input).toEqual({
        path: storagePath,
        bytes,
        mimeType: "image/jpeg",
      });
      if (options.storageError !== undefined) throw options.storageError;
      if (options.invalidUploadBucket === true) {
        return { bucket: "other", path: storagePath } as never;
      }
      return {
        bucket: "project-private",
        path: options.uploadPath ?? storagePath,
      };
    },
    async deleteReservedObject() {
      throw new Error("unused");
    },
  };
}

function privatePorts(options: PrivatePortOptions = {}) {
  const state: PrivatePortState = { events: [], reserveInput: null };
  const lifecycle = lifecyclePort(state, options);
  const storage = storagePort(state, options);
  const imageInspector = imageInspectorPort(state, options);
  const sha = sha256Port(state, options);

  return {
    events: state.events,
    get reserveInput() {
      return state.reserveInput;
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
    value: {
      storagePath,
      replayed: false,
      duplicateOriginalMediaIds: [],
    },
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

it("rejects every invalid private original identity before local media work", async () => {
  for (const key of [
    "operationId",
    "projectId",
    "venueId",
    "mediaId",
    "linkId",
  ] as const) {
    const privateMedia = privatePorts();
    const service = new MediaService(remotePort, privateMedia.value);

    expect(
      await service.createVenuePrivateOriginal(request({ [key]: "bad" })),
    ).toEqual({ ok: false, error: "invalid_identity" });
    expect(privateMedia.events).toEqual([]);
  }
});

it("rejects invalid presentation, filename, and byte shapes before decode", async () => {
  const cases = [
    { override: { category: "bad" }, error: "invalid_category" },
    { override: { caption: 42 }, error: "invalid_caption" },
    { override: { originalFilename: 42 }, error: "invalid_filename" },
    { override: { bytes: "bad" }, error: "invalid_size" },
  ] as const;

  for (const testCase of cases) {
    const privateMedia = privatePorts();
    const service = new MediaService(remotePort, privateMedia.value);

    expect(
      await service.createVenuePrivateOriginal(request(testCase.override)),
    ).toEqual({ ok: false, error: testCase.error });
    expect(privateMedia.events).toEqual([]);
  }
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

it("fails closed when required private creation ports are unavailable", async () => {
  const complete = privatePorts().value;
  const variants = [
    null,
    {
      lifecycle: complete.lifecycle,
      storage: complete.storage,
      sha256: complete.sha256,
    },
    {
      lifecycle: complete.lifecycle,
      storage: complete.storage,
      imageInspector: complete.imageInspector,
    },
  ] as const;

  for (const variant of variants) {
    const service = new MediaService(remotePort, variant);
    expect(await service.createVenuePrivateOriginal(request())).toEqual({
      ok: false,
      error: "persistence_failed",
    });
  }
});

it("maps image decode failures and contains unknown inspector failures", async () => {
  const known = privatePorts({
    inspectionError: new PrivateMediaImageInspectionError("decode"),
  });
  const unknown = privatePorts({ inspectionError: new Error("provider") });

  expect(
    await new MediaService(remotePort, known.value).createVenuePrivateOriginal(
      request(),
    ),
  ).toEqual({ ok: false, error: "decode_failed" });
  expect(known.events).toEqual(["inspect"]);

  expect(
    await new MediaService(
      remotePort,
      unknown.value,
    ).createVenuePrivateOriginal(request()),
  ).toEqual({ ok: false, error: "persistence_failed" });
  expect(unknown.events).toEqual(["inspect"]);
});

it("rejects unsafe decoded dimensions before hashing or reservation", async () => {
  const privateMedia = privatePorts({ widthPx: 0 });
  const service = new MediaService(remotePort, privateMedia.value);

  expect(await service.createVenuePrivateOriginal(request())).toEqual({
    ok: false,
    error: "invalid_dimensions",
  });
  expect(privateMedia.events).toEqual(["inspect"]);
});

it("maps SHA failures and contains unknown hashing failures", async () => {
  const known = privatePorts({
    hashError: new PrivateMediaSha256Error("hash"),
  });
  const unknown = privatePorts({ hashError: new Error("provider") });

  expect(
    await new MediaService(remotePort, known.value).createVenuePrivateOriginal(
      request(),
    ),
  ).toEqual({ ok: false, error: "hash_failed" });
  expect(known.events).toEqual(["inspect", "hash"]);

  expect(
    await new MediaService(
      remotePort,
      unknown.value,
    ).createVenuePrivateOriginal(request()),
  ).toEqual({ ok: false, error: "persistence_failed" });
  expect(unknown.events).toEqual(["inspect", "hash"]);
});

it("rejects a substituted reservation path before Storage upload", async () => {
  const privateMedia = privatePorts({
    reservationPath: `${storagePath}-other`,
  });
  const service = new MediaService(remotePort, privateMedia.value);

  expect(await service.createVenuePrivateOriginal(request())).toEqual({
    ok: false,
    error: "provider_response_invalid",
  });
  expect(privateMedia.events).toEqual(["inspect", "hash", "reserve"]);
});

it("rejects substituted Storage upload bucket or path before finalize", async () => {
  const invalidBucket = privatePorts({ invalidUploadBucket: true });
  const invalidPath = privatePorts({ uploadPath: `${storagePath}-other` });

  expect(
    await new MediaService(
      remotePort,
      invalidBucket.value,
    ).createVenuePrivateOriginal(request()),
  ).toEqual({ ok: false, error: "provider_response_invalid" });
  expect(invalidBucket.events).toEqual([
    "inspect",
    "hash",
    "reserve",
    "upload",
  ]);

  expect(
    await new MediaService(
      remotePort,
      invalidPath.value,
    ).createVenuePrivateOriginal(request()),
  ).toEqual({ ok: false, error: "provider_response_invalid" });
  expect(invalidPath.events).toEqual(["inspect", "hash", "reserve", "upload"]);
});

it("rejects a substituted finalization path", async () => {
  const privateMedia = privatePorts({
    finalizationPath: `${storagePath}-other`,
  });
  const service = new MediaService(remotePort, privateMedia.value);

  expect(await service.createVenuePrivateOriginal(request())).toEqual({
    ok: false,
    error: "provider_response_invalid",
  });
  expect(privateMedia.events).toEqual([
    "inspect",
    "hash",
    "reserve",
    "upload",
    "finalize",
  ]);
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

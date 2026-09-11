import { expect, it } from "vitest";
import type { VenueRemoteMediaBundle } from "@domain/documents/venue-remote-media";
import { MediaService, type MediaPort } from "./media-service";
import type {
  PrivateMediaDerivativeLifecyclePort,
  ReserveVenuePrivateDerivativeInput,
} from "./private-media-lifecycle-port";
import type { PrivateMediaImageInspectorPort } from "./private-media-image-inspector-port";
import type { PrivateMediaSha256Port } from "./private-media-sha256-port";
import type { PrivateMediaStoragePort } from "./private-media-storage-port";

const operationId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const parentMediaId = "44444444-4444-4444-8444-444444444444";
const storagePath = `${projectId}/media/${mediaId}/thumbnail-v1`;
const sha256 = "b".repeat(64);
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);

const remotePort: MediaPort = {
  async createVenueRemoteMedia(): Promise<VenueRemoteMediaBundle> {
    throw new Error("unused");
  },
  async listVenueRemoteMedia(): Promise<readonly VenueRemoteMediaBundle[]> {
    return [];
  },
};

function request() {
  return {
    operationId,
    projectId,
    mediaId,
    parentMediaId,
    derivativeKind: "thumbnail",
    derivativeVersion: 1,
    mimeType: "image/jpeg",
    bytes,
  };
}

interface HarnessState {
  readonly events: string[];
  reserveInput: ReserveVenuePrivateDerivativeInput | null;
}

function lifecyclePort(
  state: HarnessState,
  replayed: boolean,
): PrivateMediaDerivativeLifecyclePort {
  return {
    async reserveOriginal() {
      throw new Error("unused");
    },
    async finalizeOriginal() {
      throw new Error("unused");
    },
    async abandonOriginal() {
      throw new Error("unused");
    },
    async reserveDerivative(input) {
      state.events.push("reserve");
      state.reserveInput = input;
      return { storagePath, replayed };
    },
    async finalizeDerivative() {
      state.events.push("finalize");
      return { storagePath, replayed: false };
    },
    async abandonDerivative() {
      state.events.push("abandon");
      return { replayed: false, absent: true };
    },
  };
}

function storagePort(
  state: HarnessState,
  objectPresent: boolean,
): PrivateMediaStoragePort {
  return {
    async inspectReservedObject(path) {
      state.events.push("inspect-storage");
      return { bucket: "project-private", path, present: objectPresent };
    },
    async uploadReservedObject(input) {
      state.events.push("upload");
      expect(input).toEqual({
        path: storagePath,
        bytes,
        mimeType: "image/jpeg",
      });
      return { bucket: "project-private", path: storagePath };
    },
    async deleteReservedObject(path) {
      state.events.push("delete");
      return { bucket: "project-private", path, absent: true };
    },
  };
}

function inspectorPort(state: HarnessState): PrivateMediaImageInspectorPort {
  return {
    async inspect(receivedBytes) {
      state.events.push("inspect-image");
      expect(receivedBytes).toBe(bytes);
      return { widthPx: 320, heightPx: 180 };
    },
  };
}

function sha256Port(state: HarnessState): PrivateMediaSha256Port {
  return {
    async hashExactBytes(receivedBytes) {
      state.events.push("hash");
      expect(receivedBytes).toBe(bytes);
      return sha256;
    },
  };
}

function harness(replayed: boolean, objectPresent: boolean) {
  const state: HarnessState = { events: [], reserveInput: null };
  const service = new MediaService(remotePort, {
    lifecycle: lifecyclePort(state, replayed),
    storage: storagePort(state, objectPresent),
    imageInspector: inspectorPort(state),
    sha256: sha256Port(state),
  });
  return {
    service,
    events: state.events,
    get reserveInput() {
      return state.reserveInput;
    },
  };
}

it("creates a private thumbnail derivative through the frozen safe order", async () => {
  const context = harness(false, false);

  const result = await context.service.createVenuePrivateDerivative(request());

  expect(result).toEqual({
    ok: true,
    value: { storagePath, replayed: false },
  });
  expect(context.events).toEqual([
    "inspect-image",
    "hash",
    "reserve",
    "upload",
    "finalize",
  ]);
  expect(context.reserveInput).toEqual({
    operationId,
    projectId,
    mediaId,
    parentMediaId,
    derivativeKind: "thumbnail",
    derivativeVersion: 1,
    mimeType: "image/jpeg",
    sizeBytes: bytes.byteLength,
    sha256,
    widthPx: 320,
    heightPx: 180,
  });
});

it("finalizes a replayed derivative without re-upload when its object exists", async () => {
  const context = harness(true, true);

  const result = await context.service.createVenuePrivateDerivative(request());

  expect(result.ok).toBe(true);
  expect(context.events).toEqual([
    "inspect-image",
    "hash",
    "reserve",
    "inspect-storage",
    "finalize",
  ]);
});

it("re-uploads exact bytes when a replayed derivative object is absent", async () => {
  const context = harness(true, false);

  const result = await context.service.createVenuePrivateDerivative(request());

  expect(result.ok).toBe(true);
  expect(context.events).toEqual([
    "inspect-image",
    "hash",
    "reserve",
    "inspect-storage",
    "upload",
    "finalize",
  ]);
});

it("deletes the exact derivative object before abandoning its pending reservation", async () => {
  const context = harness(false, false);

  const result = await context.service.abandonVenuePrivateDerivative({
    operationId,
    projectId,
    mediaId,
    derivativeKind: "thumbnail",
    derivativeVersion: 1,
  });

  expect(result).toEqual({
    ok: true,
    value: { replayed: false, absent: true },
  });
  expect(context.events).toEqual(["delete", "abandon"]);
});

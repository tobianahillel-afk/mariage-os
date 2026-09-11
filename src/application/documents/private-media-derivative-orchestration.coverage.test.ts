import { expect, it } from "vitest";
import { MediaPersistenceError } from "./media-persistence-error";
import {
  orchestratePrivateDerivativeAbandon,
  orchestratePrivateDerivativeCreate,
} from "./private-media-derivative-orchestration";
import {
  PrivateMediaImageInspectionError,
  type PrivateMediaImageInspectorPort,
} from "./private-media-image-inspector-port";
import type {
  PrivateMediaDerivativeLifecyclePort,
  PrivateMediaLifecyclePort,
} from "./private-media-lifecycle-port";
import {
  PrivateMediaSha256Error,
  type PrivateMediaSha256Port,
} from "./private-media-sha256-port";
import type { PrivateMediaStoragePort } from "./private-media-storage-port";

const operationId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const parentMediaId = "44444444-4444-4444-8444-444444444444";
const path = `${projectId}/media/${mediaId}/thumbnail-v1`;
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);

function request(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    operationId,
    projectId,
    mediaId,
    parentMediaId,
    derivativeKind: "thumbnail",
    derivativeVersion: 1,
    mimeType: "image/jpeg",
    bytes,
    ...overrides,
  };
}

const originalOnlyLifecycle: PrivateMediaLifecyclePort = {
  async reserveOriginal() {
    throw new Error("unused");
  },
  async finalizeOriginal() {
    throw new Error("unused");
  },
  async abandonOriginal() {
    throw new Error("unused");
  },
};

interface CandidateOptions {
  readonly reserveError?: unknown;
  readonly reservePath?: string;
  readonly replayed?: boolean;
  readonly inspectReceipt?: unknown;
  readonly inspectError?: unknown;
  readonly uploadReceipt?: unknown;
  readonly uploadError?: unknown;
  readonly finalizePath?: string;
  readonly finalizeError?: unknown;
  readonly deleteReceipt?: unknown;
  readonly deleteError?: unknown;
  readonly abandonError?: unknown;
  readonly imageError?: unknown;
  readonly dimensions?: { readonly widthPx: number; readonly heightPx: number };
  readonly hashError?: unknown;
}

function lifecycle(options: CandidateOptions): PrivateMediaDerivativeLifecyclePort {
  return {
    ...originalOnlyLifecycle,
    async reserveDerivative() {
      if (options.reserveError !== undefined) throw options.reserveError;
      return {
        storagePath: options.reservePath ?? path,
        replayed: options.replayed ?? false,
      };
    },
    async finalizeDerivative() {
      if (options.finalizeError !== undefined) throw options.finalizeError;
      return {
        storagePath: options.finalizePath ?? path,
        replayed: false,
      };
    },
    async abandonDerivative() {
      if (options.abandonError !== undefined) throw options.abandonError;
      return { replayed: false, absent: true };
    },
  };
}

function storage(options: CandidateOptions): PrivateMediaStoragePort {
  return {
    async inspectReservedObject(expectedPath) {
      if (options.inspectError !== undefined) throw options.inspectError;
      return (options.inspectReceipt ?? {
        bucket: "project-private",
        path: expectedPath,
        present: false,
      }) as never;
    },
    async uploadReservedObject(input) {
      if (options.uploadError !== undefined) throw options.uploadError;
      return (options.uploadReceipt ?? {
        bucket: "project-private",
        path: input.path,
      }) as never;
    },
    async deleteReservedObject(expectedPath) {
      if (options.deleteError !== undefined) throw options.deleteError;
      return (options.deleteReceipt ?? {
        bucket: "project-private",
        path: expectedPath,
        absent: true,
      }) as never;
    },
  };
}

function inspector(options: CandidateOptions): PrivateMediaImageInspectorPort {
  return {
    async inspect() {
      if (options.imageError !== undefined) throw options.imageError;
      return options.dimensions ?? { widthPx: 320, heightPx: 180 };
    },
  };
}

function sha256(options: CandidateOptions): PrivateMediaSha256Port {
  return {
    async hashExactBytes() {
      if (options.hashError !== undefined) throw options.hashError;
      return "a".repeat(64);
    },
  };
}

function candidate(options: CandidateOptions = {}) {
  return {
    lifecycle: lifecycle(options),
    storage: storage(options),
    imageInspector: inspector(options),
    sha256: sha256(options),
  };
}

it("rejects invalid derivative identities, kinds, versions, bytes, and MIME", async () => {
  const cases = [
    [request({ operationId: "bad" }), "invalid_identity"],
    [request({ projectId: "bad" }), "invalid_identity"],
    [request({ mediaId: "bad" }), "invalid_identity"],
    [request({ parentMediaId: "bad" }), "invalid_identity"],
    [request({ parentMediaId: mediaId }), "invalid_identity"],
    [request({ derivativeKind: "large" }), "invalid_derivative"],
    [request({ derivativeVersion: 0 }), "invalid_derivative"],
    [request({ derivativeVersion: 32_768 }), "invalid_derivative"],
    [request({ derivativeVersion: 1.5 }), "invalid_derivative"],
    [request({ bytes: "bad" }), "invalid_size"],
    [request({ mimeType: "image/png" }), "unsupported_type"],
  ] as const;

  for (const [input, error] of cases) {
    expect(await orchestratePrivateDerivativeCreate(input, candidate())).toEqual({
      ok: false,
      error,
    });
  }
});

it("fails closed when derivative creation capabilities are unavailable", async () => {
  const base = candidate();
  const cases = [
    null,
    { ...base, lifecycle: originalOnlyLifecycle },
    { lifecycle: base.lifecycle, storage: base.storage, sha256: base.sha256 },
    {
      lifecycle: base.lifecycle,
      storage: base.storage,
      imageInspector: base.imageInspector,
    },
  ];

  for (const ports of cases) {
    expect(await orchestratePrivateDerivativeCreate(request(), ports)).toEqual({
      ok: false,
      error: "persistence_failed",
    });
  }
});

it("fails closed for partially exposed derivative lifecycle methods", async () => {
  const base = candidate();
  const reserveOnly = {
    ...originalOnlyLifecycle,
    reserveDerivative: base.lifecycle.reserveDerivative.bind(base.lifecycle),
  } as PrivateMediaLifecyclePort;
  const reserveFinalize = {
    ...reserveOnly,
    finalizeDerivative: base.lifecycle.finalizeDerivative.bind(base.lifecycle),
  } as PrivateMediaLifecyclePort;

  for (const value of [reserveOnly, reserveFinalize]) {
    expect(
      await orchestratePrivateDerivativeCreate(request(), {
        ...base,
        lifecycle: value,
      }),
    ).toEqual({ ok: false, error: "persistence_failed" });
  }
});

it("maps image inspection, dimension, and SHA failures", async () => {
  const cases: readonly [CandidateOptions, string][] = [
    [{ imageError: new PrivateMediaImageInspectionError("decode") }, "decode_failed"],
    [{ imageError: new Error("unknown") }, "persistence_failed"],
    [{ dimensions: { widthPx: 0, heightPx: 10 } }, "invalid_dimensions"],
    [{ hashError: new PrivateMediaSha256Error("hash") }, "hash_failed"],
    [{ hashError: new Error("unknown") }, "persistence_failed"],
  ];

  for (const [options, error] of cases) {
    expect(
      await orchestratePrivateDerivativeCreate(request(), candidate(options)),
    ).toEqual({ ok: false, error });
  }
});

it("rejects substituted reservation, inspection, upload, and finalize receipts", async () => {
  const cases: readonly CandidateOptions[] = [
    { reservePath: `${path}-other` },
    {
      replayed: true,
      inspectReceipt: { bucket: "other", path, present: false },
    },
    { uploadReceipt: { bucket: "other", path } },
    { uploadReceipt: { bucket: "project-private", path: `${path}-other` } },
    { finalizePath: `${path}-other` },
  ];

  for (const options of cases) {
    expect(
      await orchestratePrivateDerivativeCreate(request(), candidate(options)),
    ).toEqual({ ok: false, error: "provider_response_invalid" });
  }
});

it("maps lifecycle and Storage persistence failures without cleanup", async () => {
  const cases: readonly [CandidateOptions, string][] = [
    [
      { reserveError: new MediaPersistenceError("conflict", "conflict") },
      "replay_conflict",
    ],
    [
      {
        reserveError: new MediaPersistenceError(
          "provider_response_invalid",
          "provider",
        ),
      },
      "provider_response_invalid",
    ],
    [
      { uploadError: new MediaPersistenceError("storage_retryable", "retry") },
      "storage_retryable",
    ],
    [{ finalizeError: new Error("unknown") }, "persistence_failed"],
  ];

  for (const [options, error] of cases) {
    expect(
      await orchestratePrivateDerivativeCreate(request(), candidate(options)),
    ).toEqual({ ok: false, error });
  }
});

it("rejects invalid derivative abandon requests and unavailable lifecycle", async () => {
  const abandon = {
    operationId,
    projectId,
    mediaId,
    derivativeKind: "thumbnail",
    derivativeVersion: 1,
  };
  const invalid = [
    { ...abandon, operationId: "bad" },
    { ...abandon, projectId: "bad" },
    { ...abandon, mediaId: "bad" },
    { ...abandon, derivativeKind: "large" },
    { ...abandon, derivativeVersion: 0 },
    { ...abandon, derivativeVersion: 32_768 },
    { ...abandon, derivativeVersion: 1.5 },
  ];
  for (const input of invalid) {
    expect(await orchestratePrivateDerivativeAbandon(input, candidate())).toEqual({
      ok: false,
      error: "invalid_identity",
    });
  }
  expect(await orchestratePrivateDerivativeAbandon(abandon, null)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

it("requires confirmed Storage absence before derivative DB abandonment", async () => {
  const abandon = {
    operationId,
    projectId,
    mediaId,
    derivativeKind: "thumbnail",
    derivativeVersion: 1,
  };
  const invalidReceipts = [
    { bucket: "other", path, absent: true },
    { bucket: "project-private", path: `${path}-other`, absent: true },
    { bucket: "project-private", path, absent: false },
  ];
  for (const deleteReceipt of invalidReceipts) {
    expect(
      await orchestratePrivateDerivativeAbandon(
        abandon,
        candidate({ deleteReceipt }),
      ),
    ).toEqual({ ok: false, error: "provider_response_invalid" });
  }
});

it("maps derivative cleanup and abandon failures", async () => {
  const abandon = {
    operationId,
    projectId,
    mediaId,
    derivativeKind: "thumbnail",
    derivativeVersion: 1,
  };
  expect(
    await orchestratePrivateDerivativeAbandon(
      abandon,
      candidate({
        deleteError: new MediaPersistenceError("storage_retryable", "retry"),
      }),
    ),
  ).toEqual({ ok: false, error: "storage_retryable" });
  expect(
    await orchestratePrivateDerivativeAbandon(
      abandon,
      candidate({ abandonError: new Error("unknown") }),
    ),
  ).toEqual({ ok: false, error: "persistence_failed" });
});

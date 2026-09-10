import { expect, it } from "vitest";
import { MediaPersistenceError } from "./media-persistence-error";
import {
  MediaService,
  type MediaPort,
  type NormalizedCreateVenueRemoteMediaInput,
} from "./media-service";
import type { VenueRemoteMediaBundle } from "@domain/documents/venue-remote-media";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";
const operationId = "66666666-6666-4666-8666-666666666666";

function bundle(): VenueRemoteMediaBundle {
  return {
    media: {
      id: mediaId,
      projectId,
      mediaType: "image",
      category: "exterior",
      storagePath: null,
      remoteUrl: "https://example.com/photo.jpg",
      sourcePageUrl: "https://example.com/venue",
      originalFilename: null,
      mimeType: null,
      sizeBytes: null,
      sha256: null,
      widthPx: null,
      heightPx: null,
      derivativeOfId: null,
      isOriginal: true,
      uploadStatus: "ready",
      caption: "Exterior",
      createdAt: "2026-09-09T20:00:00.000Z",
      createdBy: actorId,
      updatedAt: "2026-09-09T20:00:00.000Z",
      updatedBy: actorId,
      revision: 1,
    },
    link: {
      id: linkId,
      projectId,
      mediaId,
      targetType: "venue",
      targetId: venueId,
      relationshipType: "gallery",
      createdAt: "2026-09-09T20:00:00.000Z",
      createdBy: actorId,
    },
  };
}

class StubPort implements MediaPort {
  created: NormalizedCreateVenueRemoteMediaInput | null = null;
  createError: unknown = null;
  listError: unknown = null;

  async createVenueRemoteMedia(
    input: NormalizedCreateVenueRemoteMediaInput,
  ): Promise<VenueRemoteMediaBundle> {
    this.created = input;
    if (this.createError !== null) throw this.createError;
    return bundle();
  }

  async listVenueRemoteMedia(): Promise<readonly VenueRemoteMediaBundle[]> {
    if (this.listError !== null) throw this.listError;
    return [bundle()];
  }
}

it("validates and canonicalizes before creating remote Venue media", async () => {
  const port = new StubPort();
  const service = new MediaService(port);
  const result = await service.createVenueRemoteMedia({
    projectId,
    venueId,
    mediaId,
    linkId,
    category: "exterior",
    remoteUrl: " https://EXAMPLE.com/photo.jpg ",
    sourcePageUrl: "https://example.com/venue",
    caption: " Exterior ",
  });
  expect(result.ok).toBe(true);
  expect(port.created).toEqual({
    projectId,
    venueId,
    mediaId,
    linkId,
    category: "exterior",
    remoteUrl: "https://example.com/photo.jpg",
    sourcePageUrl: "https://example.com/venue",
    caption: "Exterior",
  });
});

it("rejects invalid identity and unsafe remote URL before persistence", async () => {
  const port = new StubPort();
  const service = new MediaService(port);
  expect(
    await service.createVenueRemoteMedia({
      projectId: "bad",
      venueId,
      mediaId,
      linkId,
      category: null,
      remoteUrl: "https://example.com/photo.jpg",
      sourcePageUrl: null,
      caption: null,
    }),
  ).toEqual({ ok: false, error: "invalid_identity" });
  expect(
    await service.createVenueRemoteMedia({
      projectId,
      venueId,
      mediaId,
      linkId,
      category: null,
      remoteUrl: "https://127.0.0.1/photo.jpg",
      sourcePageUrl: null,
      caption: null,
    }),
  ).toEqual({ ok: false, error: "invalid_remote_url" });
  expect(port.created).toBeNull();
});

it("maps typed replay conflict and generic persistence failure", async () => {
  const port = new StubPort();
  const service = new MediaService(port);
  const input = {
    projectId,
    venueId,
    mediaId,
    linkId,
    category: null,
    remoteUrl: "https://example.com/photo.jpg",
    sourcePageUrl: null,
    caption: null,
  } as const;

  port.createError = new MediaPersistenceError("conflict", "conflict");
  expect(await service.createVenueRemoteMedia(input)).toEqual({
    ok: false,
    error: "replay_conflict",
  });

  port.createError = new Error("provider down");
  expect(await service.createVenueRemoteMedia(input)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

it("validates list identity and exposes persistence failure generically", async () => {
  const port = new StubPort();
  const service = new MediaService(port);
  expect(await service.listVenueRemoteMedia(projectId, venueId)).toEqual({
    ok: true,
    value: [bundle()],
  });
  expect(await service.listVenueRemoteMedia("bad", venueId)).toEqual({
    ok: false,
    error: "invalid_identity",
  });
  port.listError = new Error("provider down");
  expect(await service.listVenueRemoteMedia(projectId, venueId)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

it("deletes private Storage before abandoning a pending original", async () => {
  const events: string[] = [];
  const storagePath = `${projectId}/media/${mediaId}/original`;
  const privateMedia = {
    storage: {
      async uploadReservedObject() {
        throw new Error("unused");
      },
      async deleteReservedObject(path: string) {
        events.push(`delete:${path}`);
        return {
          bucket: "project-private" as const,
          path,
          absent: true as const,
        };
      },
    },
    lifecycle: {
      async reserveOriginal() {
        throw new Error("unused");
      },
      async finalizeOriginal() {
        throw new Error("unused");
      },
      async abandonOriginal() {
        events.push("abandon");
        return { replayed: false, absent: true as const };
      },
    },
  };
  const service = new MediaService(new StubPort(), privateMedia);

  const result = await service.abandonVenuePrivateOriginal({
    operationId,
    projectId,
    venueId,
    mediaId,
    linkId,
  });

  expect(result).toEqual({
    ok: true,
    value: { replayed: false, absent: true },
  });
  expect(events).toEqual([`delete:${storagePath}`, "abandon"]);
});

it("keeps pending metadata when private Storage cleanup fails", async () => {
  let abandonCalls = 0;
  const privateMedia = {
    storage: {
      async uploadReservedObject() {
        throw new Error("unused");
      },
      async deleteReservedObject() {
        throw new MediaPersistenceError("storage_retryable", "retry");
      },
    },
    lifecycle: {
      async reserveOriginal() {
        throw new Error("unused");
      },
      async finalizeOriginal() {
        throw new Error("unused");
      },
      async abandonOriginal() {
        abandonCalls += 1;
        return { replayed: false, absent: true as const };
      },
    },
  };
  const service = new MediaService(new StubPort(), privateMedia);

  const result = await service.abandonVenuePrivateOriginal({
    operationId,
    projectId,
    venueId,
    mediaId,
    linkId,
  });

  expect(result).toEqual({ ok: false, error: "storage_retryable" });
  expect(abandonCalls).toBe(0);
});

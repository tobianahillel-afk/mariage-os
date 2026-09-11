import { expect, it } from "vitest";
import { MediaPersistenceError } from "./media-persistence-error";
import {
  MediaService,
  type MediaPort,
  type NormalizedCreateVenueRemoteMediaInput,
  type NormalizedTransitionVenueRemoteMediaLifecycleRequest,
} from "./media-service";
import type { VenueRemoteMediaBundle } from "@domain/documents/venue-remote-media";
import type { VenueRemoteMediaLifecycleReceipt } from "@domain/documents/venue-remote-media-lifecycle";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";
const deletedAt = "2026-09-11T16:30:00.000Z";

function lifecycleReceipt(): VenueRemoteMediaLifecycleReceipt {
  return {
    action: "soft_delete",
    replayed: false,
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
      derivativeKind: null,
      derivativeVersion: null,
      isOriginal: true,
      uploadStatus: "ready",
      caption: "Exterior",
      deletedAt,
      createdAt: "2026-09-09T20:00:00.000Z",
      createdBy: actorId,
      updatedAt: deletedAt,
      updatedBy: actorId,
      revision: 2,
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
  transitionInput: NormalizedTransitionVenueRemoteMediaLifecycleRequest | null =
    null;
  transitionError: unknown = null;

  async createVenueRemoteMedia(
    input: NormalizedCreateVenueRemoteMediaInput,
  ): Promise<VenueRemoteMediaBundle> {
    void input;
    throw new Error("unused");
  }

  async listVenueRemoteMedia(): Promise<readonly VenueRemoteMediaBundle[]> {
    return [];
  }

  async transitionVenueRemoteMediaLifecycle(
    input: NormalizedTransitionVenueRemoteMediaLifecycleRequest,
  ): Promise<VenueRemoteMediaLifecycleReceipt> {
    this.transitionInput = input;
    if (this.transitionError !== null) throw this.transitionError;
    return lifecycleReceipt();
  }
}

it("validates and delegates a remote-media lifecycle transition", async () => {
  const port = new StubPort();
  const result = await new MediaService(port).transitionVenueRemoteMediaLifecycle({
    projectId,
    mediaId,
    action: "soft_delete",
    expectedRevision: 1,
  });

  expect(result).toEqual({ ok: true, value: lifecycleReceipt() });
  expect(port.transitionInput).toEqual({
    projectId,
    mediaId,
    action: "soft_delete",
    expectedRevision: 1,
  });
});

it("rejects invalid lifecycle identity, action and revision before persistence", async () => {
  const port = new StubPort();
  const service = new MediaService(port);

  expect(
    await service.transitionVenueRemoteMediaLifecycle({
      projectId: "bad",
      mediaId,
      action: "soft_delete",
      expectedRevision: 1,
    }),
  ).toEqual({ ok: false, error: "invalid_identity" });
  expect(
    await service.transitionVenueRemoteMediaLifecycle({
      projectId,
      mediaId,
      action: "purge",
      expectedRevision: 1,
    }),
  ).toEqual({ ok: false, error: "invalid_action" });

  for (const expectedRevision of [null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    expect(
      await service.transitionVenueRemoteMediaLifecycle({
        projectId,
        mediaId,
        action: "restore",
        expectedRevision,
      }),
    ).toEqual({ ok: false, error: "invalid_revision" });
  }
  expect(port.transitionInput).toBeNull();
});

it("maps stale/conflicting lifecycle transitions through replay_conflict", async () => {
  const port = new StubPort();
  port.transitionError = new MediaPersistenceError("conflict", "stale");

  expect(
    await new MediaService(port).transitionVenueRemoteMediaLifecycle({
      projectId,
      mediaId,
      action: "restore",
      expectedRevision: 1,
    }),
  ).toEqual({ ok: false, error: "replay_conflict" });
});

it("fails closed when a MediaPort does not expose the lifecycle capability", async () => {
  const port: MediaPort = {
    async createVenueRemoteMedia() {
      throw new Error("unused");
    },
    async listVenueRemoteMedia() {
      return [];
    },
  };

  expect(
    await new MediaService(port).transitionVenueRemoteMediaLifecycle({
      projectId,
      mediaId,
      action: "soft_delete",
      expectedRevision: 1,
    }),
  ).toEqual({ ok: false, error: "persistence_failed" });
});

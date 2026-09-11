import { expect, it } from "vitest";
import type { VenueRemoteMediaBundle } from "@domain/documents/venue-remote-media";
import {
  MediaService,
  type MediaPort,
  type PrivateMediaServicePorts,
} from "./media-service";

const operationId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const venueId = "33333333-3333-4333-8333-333333333333";
const mediaId = "44444444-4444-4444-8444-444444444444";
const linkId = "55555555-5555-4555-8555-555555555555";
const storagePath = `${projectId}/media/${mediaId}/original`;

const remotePort: MediaPort = {
  async createVenueRemoteMedia(): Promise<VenueRemoteMediaBundle> {
    throw new Error("unused");
  },
  async listVenueRemoteMedia(): Promise<readonly VenueRemoteMediaBundle[]> {
    return [];
  },
};

function request() {
  return { operationId, projectId, venueId, mediaId, linkId };
}

function privateMediaWithDeleteReceipt(
  receipt: unknown,
  events: string[],
): PrivateMediaServicePorts {
  return {
    storage: {
      async inspectReservedObject() {
        throw new Error("unused");
      },
      async uploadReservedObject() {
        throw new Error("unused");
      },
      async deleteReservedObject(path) {
        events.push(`delete:${path}`);
        return receipt as never;
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
        return { replayed: false, absent: true };
      },
    },
  };
}

it("keeps the pending reservation when Storage cleanup proof is substituted or malformed", async () => {
  const invalidReceipts = [
    { bucket: "other", path: storagePath, absent: true },
    { bucket: "project-private", path: `${storagePath}-other`, absent: true },
    { bucket: "project-private", path: storagePath, absent: false },
  ];

  for (const receipt of invalidReceipts) {
    const events: string[] = [];
    const service = new MediaService(
      remotePort,
      privateMediaWithDeleteReceipt(receipt, events),
    );

    await expect(
      service.abandonVenuePrivateOriginal(request()),
    ).resolves.toEqual({ ok: false, error: "provider_response_invalid" });
    expect(events).toEqual([`delete:${storagePath}`]);
  }
});

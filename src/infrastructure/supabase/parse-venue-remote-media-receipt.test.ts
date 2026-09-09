import { expect, it } from "vitest";
import {
  parseVenueRemoteMediaListRow,
  parseVenueRemoteMediaReceipt,
} from "./parse-venue-remote-media-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";
const expectedIds = { projectId, venueId, mediaId, linkId };

function media(overrides: Record<string, unknown> = {}) {
  return {
    id: mediaId,
    project_id: projectId,
    media_type: "image",
    category: "exterior",
    storage_path: null,
    remote_url: "https://example.com/photo.jpg",
    source_page_url: "https://example.com/venue",
    original_filename: null,
    mime_type: null,
    size_bytes: null,
    sha256: null,
    width_px: null,
    height_px: null,
    derivative_of_id: null,
    is_original: true,
    upload_status: "ready",
    caption: "Exterior",
    created_at: "2026-09-09T20:00:00Z",
    created_by: actorId,
    updated_at: "2026-09-09T20:00:00Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: linkId,
    project_id: projectId,
    media_id: mediaId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: "gallery",
    created_at: "2026-09-09T20:00:00Z",
    created_by: actorId,
    ...overrides,
  };
}

it("parses the exact metadata-only RPC receipt", () => {
  const parsed = parseVenueRemoteMediaReceipt(
    { media: media(), link: link() },
    expectedIds,
  );
  expect(parsed.media.remoteUrl).toBe("https://example.com/photo.jpg");
  expect(parsed.media.storagePath).toBeNull();
  expect(parsed.media.createdAt).toBe("2026-09-09T20:00:00.000Z");
  expect(parsed.link.targetType).toBe("venue");
  expect(parsed.link.relationshipType).toBe("gallery");
});

it("parses an embedded media row for the active Venue list", () => {
  const parsed = parseVenueRemoteMediaListRow(
    { ...link(), media: media() },
    { projectId, venueId },
  );
  expect(parsed.media.id).toBe(mediaId);
  expect(parsed.link.id).toBe(linkId);
});

it.each([
  { media: media({ project_id: venueId }), link: link() },
  {
    media: media({ remote_url: "https://EXAMPLE.com/photo.jpg" }),
    link: link(),
  },
  { media: media({ storage_path: "private/path" }), link: link() },
  { media: media({ upload_status: "pending" }), link: link() },
  { media: media(), link: link({ target_type: "vendor" }) },
  { media: media(), link: link({ media_id: venueId }) },
])("fails closed on malformed or substituted receipt %#", (receipt) => {
  expect(() => parseVenueRemoteMediaReceipt(receipt, expectedIds)).toThrow(
    "Invalid venue remote media response.",
  );
});

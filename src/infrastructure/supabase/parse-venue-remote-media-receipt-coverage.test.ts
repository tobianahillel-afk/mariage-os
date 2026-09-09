import { expect, it } from "vitest";
import { parseVenueRemoteMediaReceipt } from "./parse-venue-remote-media-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const otherMediaId = "66666666-6666-4666-8666-666666666666";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";

function media(overrides: Record<string, unknown> = {}) {
  return {
    id: mediaId,
    project_id: projectId,
    media_type: "image",
    category: null,
    storage_path: null,
    remote_url: "https://example.com/photo.jpg",
    source_page_url: null,
    original_filename: null,
    mime_type: null,
    size_bytes: null,
    sha256: null,
    width_px: null,
    height_px: null,
    derivative_of_id: null,
    is_original: true,
    upload_status: "ready",
    caption: null,
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

it.each([null, [], "invalid"])("fails closed on non-object receipt %#", (value) => {
  expect(() => parseVenueRemoteMediaReceipt(value)).toThrow(
    "Invalid venue remote media response.",
  );
});

it("accepts a valid receipt without optional expected identities", () => {
  expect(
    parseVenueRemoteMediaReceipt({ media: media(), link: link() }).media.id,
  ).toBe(mediaId);
});

it.each([
  { media: media({ id: "not-a-uuid" }), link: link() },
  { media: media({ created_at: "not-an-instant" }), link: link() },
  {
    media: media({ remote_url: "http://example.com/photo.jpg" }),
    link: link(),
  },
  { media: media(), link: link({ relationship_type: "thumbnail" }) },
])("fails closed on additional malformed provider row %#", (receipt) => {
  expect(() => parseVenueRemoteMediaReceipt(receipt)).toThrow(
    "Invalid venue remote media response.",
  );
});

it("rejects internally inconsistent media and link identities", () => {
  const receipt = {
    media: media(),
    link: link({ media_id: otherMediaId }),
  };
  expect(() => parseVenueRemoteMediaReceipt(receipt)).toThrow(
    "Invalid venue remote media response.",
  );
});

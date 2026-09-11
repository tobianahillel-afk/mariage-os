import { expect, it } from "vitest";
import { parseVenueRemoteMediaReceipt } from "./parse-venue-remote-media-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";

function receipt(revision: unknown) {
  return {
    media: {
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
      updated_at: "2026-09-11T16:30:00Z",
      updated_by: actorId,
      revision,
      deleted_at: null,
    },
    link: {
      id: linkId,
      project_id: projectId,
      media_id: mediaId,
      target_type: "venue",
      target_id: venueId,
      relationship_type: "gallery",
      created_at: "2026-09-09T20:00:00Z",
      created_by: actorId,
    },
  };
}

it("accepts a restored active remote-media row with revision above one", () => {
  const parsed = parseVenueRemoteMediaReceipt(receipt(3), {
    projectId,
    venueId,
    mediaId,
    linkId,
  });
  expect(parsed.media.revision).toBe(3);
});

it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
  "rejects non-positive or unsafe active remote-media revision %#",
  (revision) => {
    expect(() =>
      parseVenueRemoteMediaReceipt(receipt(revision), {
        projectId,
        venueId,
        mediaId,
        linkId,
      }),
    ).toThrow("Invalid venue remote media response.");
  },
);

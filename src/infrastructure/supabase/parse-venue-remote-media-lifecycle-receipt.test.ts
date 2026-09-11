import { expect, it } from "vitest";
import { parseVenueRemoteMediaLifecycleReceipt } from "./parse-venue-remote-media-lifecycle-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const linkId = "44444444-4444-4444-8444-444444444444";
const actorId = "55555555-5555-4555-8555-555555555555";
const deletedAt = "2026-09-11T16:30:00Z";

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
    derivative_kind: null,
    derivative_version: null,
    is_original: true,
    upload_status: "ready",
    caption: "Exterior",
    deleted_at: deletedAt,
    created_at: "2026-09-09T20:00:00Z",
    created_by: actorId,
    updated_at: deletedAt,
    updated_by: actorId,
    revision: 2,
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

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    action: "soft_delete",
    replayed: false,
    media: media(),
    link: link(),
    ...overrides,
  };
}

it("parses the exact remote-media soft-delete lifecycle receipt", () => {
  const parsed = parseVenueRemoteMediaLifecycleReceipt(receipt(), {
    projectId,
    mediaId,
    action: "soft_delete",
  });
  expect(parsed.replayed).toBe(false);
  expect(parsed.media.deletedAt).toBe("2026-09-11T16:30:00.000Z");
  expect(parsed.media.revision).toBe(2);
  expect(parsed.link.targetId).toBe(venueId);
});

it("parses a restored active receipt with positive revision", () => {
  const parsed = parseVenueRemoteMediaLifecycleReceipt(
    receipt({
      action: "restore",
      replayed: true,
      media: media({ deleted_at: null, revision: 3 }),
    }),
    { projectId, mediaId, action: "restore" },
  );
  expect(parsed.replayed).toBe(true);
  expect(parsed.media.deletedAt).toBeNull();
  expect(parsed.media.revision).toBe(3);
});

it.each([
  receipt({ action: "restore" }),
  receipt({ replayed: "false" }),
  receipt({ media: media({ project_id: venueId }) }),
  receipt({ media: media({ storage_path: "private/object" }) }),
  receipt({ media: media({ derivative_kind: "thumbnail" }) }),
  receipt({ media: media({ deleted_at: null }) }),
  receipt({ media: media({ revision: 0 }) }),
  receipt({ media: media({ revision: 1.5 }) }),
  receipt({ link: link({ project_id: venueId }) }),
  receipt({ link: link({ media_id: venueId }) }),
  receipt({ link: link({ target_type: "vendor" }) }),
])("fails closed on malformed or substituted lifecycle receipt %#", (value) => {
  expect(() =>
    parseVenueRemoteMediaLifecycleReceipt(value, {
      projectId,
      mediaId,
      action: "soft_delete",
    }),
  ).toThrow("Invalid venue remote media lifecycle response.");
});

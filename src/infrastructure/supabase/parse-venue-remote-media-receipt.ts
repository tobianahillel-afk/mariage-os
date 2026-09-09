import {
  isMediaUuid,
  normalizeVenueRemoteMediaDraft,
  type VenueRemoteMediaBundle,
  type VenueRemoteMediaLinkRecord,
  type VenueRemoteMediaRecord,
} from "@domain/documents/venue-remote-media";
import { normalizeFactInstant } from "@domain/facts/fact-observation";

const INVALID_RESPONSE = "Invalid venue remote media response.";

function fail(): never {
  throw new Error(INVALID_RESPONSE);
}

function objectRow(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail();
  return value as Record<string, unknown>;
}

function requiredUuid(value: unknown): string {
  return isMediaUuid(value) ? value : fail();
}

function canonicalInstant(value: unknown): string {
  const normalized = normalizeFactInstant(value);
  return normalized === null ? fail() : normalized;
}

function assertExpected(actual: string, expected?: string): void {
  if (expected !== undefined && actual !== expected) fail();
}

function parseMediaRow(
  value: unknown,
  expectedProjectId?: string,
  expectedMediaId?: string,
): VenueRemoteMediaRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  assertExpected(id, expectedMediaId);
  assertExpected(projectId, expectedProjectId);

  const normalized = normalizeVenueRemoteMediaDraft({
    category: row.category,
    remoteUrl: row.remote_url,
    sourcePageUrl: row.source_page_url,
    caption: row.caption,
  });
  if (!normalized.ok) fail();
  if (
    normalized.value.category !== row.category ||
    normalized.value.remoteUrl !== row.remote_url ||
    normalized.value.sourcePageUrl !== row.source_page_url ||
    normalized.value.caption !== row.caption
  ) {
    fail();
  }
  if (
    row.media_type !== "image" ||
    row.storage_path !== null ||
    row.original_filename !== null ||
    row.mime_type !== null ||
    row.size_bytes !== null ||
    row.sha256 !== null ||
    row.width_px !== null ||
    row.height_px !== null ||
    row.derivative_of_id !== null ||
    row.is_original !== true ||
    row.upload_status !== "ready" ||
    row.revision !== 1
  ) {
    fail();
  }

  return {
    id,
    projectId,
    mediaType: "image",
    category: normalized.value.category,
    storagePath: null,
    remoteUrl: normalized.value.remoteUrl,
    sourcePageUrl: normalized.value.sourcePageUrl,
    originalFilename: null,
    mimeType: null,
    sizeBytes: null,
    sha256: null,
    widthPx: null,
    heightPx: null,
    derivativeOfId: null,
    isOriginal: true,
    uploadStatus: "ready",
    caption: normalized.value.caption,
    createdAt: canonicalInstant(row.created_at),
    createdBy: requiredUuid(row.created_by),
    updatedAt: canonicalInstant(row.updated_at),
    updatedBy: requiredUuid(row.updated_by),
    revision: 1,
  };
}

function parseLinkRow(
  value: unknown,
  expectedProjectId?: string,
  expectedVenueId?: string,
  expectedMediaId?: string,
  expectedLinkId?: string,
): VenueRemoteMediaLinkRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  const mediaId = requiredUuid(row.media_id);
  const targetId = requiredUuid(row.target_id);
  assertExpected(id, expectedLinkId);
  assertExpected(projectId, expectedProjectId);
  assertExpected(mediaId, expectedMediaId);
  assertExpected(targetId, expectedVenueId);
  if (row.target_type !== "venue" || row.relationship_type !== "gallery")
    fail();
  return {
    id,
    projectId,
    mediaId,
    targetType: "venue",
    targetId,
    relationshipType: "gallery",
    createdAt: canonicalInstant(row.created_at),
    createdBy: requiredUuid(row.created_by),
  };
}

export function parseVenueRemoteMediaReceipt(
  value: unknown,
  expectedProjectId?: string,
  expectedVenueId?: string,
  expectedMediaId?: string,
  expectedLinkId?: string,
): VenueRemoteMediaBundle {
  const row = objectRow(value);
  const media = parseMediaRow(row.media, expectedProjectId, expectedMediaId);
  const link = parseLinkRow(
    row.link,
    expectedProjectId,
    expectedVenueId,
    expectedMediaId,
    expectedLinkId,
  );
  if (link.mediaId !== media.id || link.projectId !== media.projectId) fail();
  return { media, link };
}

export function parseVenueRemoteMediaListRow(
  value: unknown,
  expectedProjectId?: string,
  expectedVenueId?: string,
): VenueRemoteMediaBundle {
  const row = objectRow(value);
  const media = parseMediaRow(row.media, expectedProjectId);
  const link = parseLinkRow(row, expectedProjectId, expectedVenueId, media.id);
  return { media, link };
}

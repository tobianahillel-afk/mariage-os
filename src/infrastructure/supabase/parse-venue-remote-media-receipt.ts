import {
  isMediaUuid,
  normalizeVenueRemoteMediaDraft,
  type NormalizedVenueRemoteMediaDraft,
  type VenueRemoteMediaBundle,
  type VenueRemoteMediaLinkRecord,
  type VenueRemoteMediaRecord,
} from "@domain/documents/venue-remote-media";
import { normalizeFactInstant } from "@domain/facts/fact-observation";

const INVALID_RESPONSE = "Invalid venue remote media response.";

export interface ExpectedVenueRemoteMediaIds {
  readonly projectId?: string;
  readonly venueId?: string;
  readonly mediaId?: string;
  readonly linkId?: string;
}

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

function normalizedMediaFields(
  row: Record<string, unknown>,
): NormalizedVenueRemoteMediaDraft {
  const normalized = normalizeVenueRemoteMediaDraft({
    category: row.category,
    remoteUrl: row.remote_url,
    sourcePageUrl: row.source_page_url,
    caption: row.caption,
  });
  if (!normalized.ok) fail();
  const valuesAreCanonical = [
    normalized.value.category === row.category,
    normalized.value.remoteUrl === row.remote_url,
    normalized.value.sourcePageUrl === row.source_page_url,
    normalized.value.caption === row.caption,
  ].every(Boolean);
  return valuesAreCanonical ? normalized.value : fail();
}

function assertRemoteOnlyMediaState(row: Record<string, unknown>): void {
  const stateIsExpected = [
    row.media_type === "image",
    row.storage_path === null,
    row.original_filename === null,
    row.mime_type === null,
    row.size_bytes === null,
    row.sha256 === null,
    row.width_px === null,
    row.height_px === null,
    row.derivative_of_id === null,
    row.is_original === true,
    row.upload_status === "ready",
    row.revision === 1,
  ].every(Boolean);
  if (!stateIsExpected) fail();
}

function parseMediaRow(
  value: unknown,
  expected: ExpectedVenueRemoteMediaIds = {},
): VenueRemoteMediaRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  assertExpected(id, expected.mediaId);
  assertExpected(projectId, expected.projectId);
  const normalized = normalizedMediaFields(row);
  assertRemoteOnlyMediaState(row);
  return {
    id,
    projectId,
    mediaType: "image",
    category: normalized.category,
    storagePath: null,
    remoteUrl: normalized.remoteUrl,
    sourcePageUrl: normalized.sourcePageUrl,
    originalFilename: null,
    mimeType: null,
    sizeBytes: null,
    sha256: null,
    widthPx: null,
    heightPx: null,
    derivativeOfId: null,
    isOriginal: true,
    uploadStatus: "ready",
    caption: normalized.caption,
    createdAt: canonicalInstant(row.created_at),
    createdBy: requiredUuid(row.created_by),
    updatedAt: canonicalInstant(row.updated_at),
    updatedBy: requiredUuid(row.updated_by),
    revision: 1,
  };
}

function parseLinkRow(
  value: unknown,
  expected: ExpectedVenueRemoteMediaIds = {},
): VenueRemoteMediaLinkRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  const mediaId = requiredUuid(row.media_id);
  const targetId = requiredUuid(row.target_id);
  assertExpected(id, expected.linkId);
  assertExpected(projectId, expected.projectId);
  assertExpected(mediaId, expected.mediaId);
  assertExpected(targetId, expected.venueId);
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
  expected: ExpectedVenueRemoteMediaIds = {},
): VenueRemoteMediaBundle {
  const row = objectRow(value);
  const media = parseMediaRow(row.media, expected);
  const link = parseLinkRow(row.link, expected);
  if (link.mediaId !== media.id || link.projectId !== media.projectId) fail();
  return { media, link };
}

export function parseVenueRemoteMediaListRow(
  value: unknown,
  expected: ExpectedVenueRemoteMediaIds = {},
): VenueRemoteMediaBundle {
  const row = objectRow(value);
  const media = parseMediaRow(row.media, expected);
  const link = parseLinkRow(row, { ...expected, mediaId: media.id });
  return { media, link };
}

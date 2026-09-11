import {
  isMediaUuid,
  normalizeVenueRemoteMediaDraft,
  type VenueRemoteMediaLinkRecord,
} from "@domain/documents/venue-remote-media";
import type {
  VenueRemoteMediaLifecycleAction,
  VenueRemoteMediaLifecycleReceipt,
  VenueRemoteMediaLifecycleRecord,
} from "@domain/documents/venue-remote-media-lifecycle";
import { normalizeFactInstant } from "@domain/facts/fact-observation";

const INVALID_RESPONSE = "Invalid venue remote media lifecycle response.";

export interface ExpectedVenueRemoteMediaLifecycle {
  readonly projectId: string;
  readonly mediaId: string;
  readonly action: VenueRemoteMediaLifecycleAction;
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

function positiveRevision(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    fail();
  }
  return value;
}

function normalizedRemoteFields(row: Record<string, unknown>) {
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
  return normalized.value;
}

function parseLifecycleMedia(
  value: unknown,
  expected: ExpectedVenueRemoteMediaLifecycle,
): VenueRemoteMediaLifecycleRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  if (id !== expected.mediaId || projectId !== expected.projectId) fail();

  const stateIsRemote = [
    row.media_type === "image",
    row.storage_path === null,
    typeof row.remote_url === "string",
    row.original_filename === null,
    row.mime_type === null,
    row.size_bytes === null,
    row.sha256 === null,
    row.width_px === null,
    row.height_px === null,
    row.derivative_of_id === null,
    row.derivative_kind === null,
    row.derivative_version === null,
    row.is_original === true,
    row.upload_status === "ready",
  ].every(Boolean);
  if (!stateIsRemote) fail();

  const normalized = normalizedRemoteFields(row);
  const deletedAt =
    row.deleted_at === null ? null : canonicalInstant(row.deleted_at);
  if (expected.action === "soft_delete" && deletedAt === null) fail();
  if (expected.action === "restore" && deletedAt !== null) fail();

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
    derivativeKind: null,
    derivativeVersion: null,
    isOriginal: true,
    uploadStatus: "ready",
    caption: normalized.caption,
    deletedAt,
    createdAt: canonicalInstant(row.created_at),
    createdBy: requiredUuid(row.created_by),
    updatedAt: canonicalInstant(row.updated_at),
    updatedBy: requiredUuid(row.updated_by),
    revision: positiveRevision(row.revision),
  };
}

function parseLifecycleLink(
  value: unknown,
  expected: ExpectedVenueRemoteMediaLifecycle,
): VenueRemoteMediaLinkRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  const mediaId = requiredUuid(row.media_id);
  const targetId = requiredUuid(row.target_id);
  if (projectId !== expected.projectId || mediaId !== expected.mediaId) fail();
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

export function parseVenueRemoteMediaLifecycleReceipt(
  value: unknown,
  expected: ExpectedVenueRemoteMediaLifecycle,
): VenueRemoteMediaLifecycleReceipt {
  const row = objectRow(value);
  if (row.action !== expected.action || typeof row.replayed !== "boolean") fail();
  const media = parseLifecycleMedia(row.media, expected);
  const link = parseLifecycleLink(row.link, expected);
  if (link.projectId !== media.projectId || link.mediaId !== media.id) fail();
  return {
    action: expected.action,
    replayed: row.replayed,
    media,
    link,
  };
}

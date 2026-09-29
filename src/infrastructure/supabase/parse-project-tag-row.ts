import {
  isCanonicalTagKey,
  isCanonicalTagLabel,
  type ProjectTagRecord,
  type VenueTagAssignmentRecord,
} from "@domain/tags/project-tag";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";

function invalidTagResponse(): never {
  throw new Error("Invalid project tag provider response.");
}

function objectValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidTagResponse();
  }
  return value as Record<string, unknown>;
}

function uuidValue(value: unknown): string {
  if (!isVenueCommercialUuid(value)) invalidTagResponse();
  return value;
}

function deletedAtValue(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    invalidTagResponse();
  }
  return value;
}

export function parseProjectTagRow(
  value: unknown,
  expectedProjectId: string,
  expectedTagId?: string,
): ProjectTagRecord {
  const row = objectValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  if (projectId !== expectedProjectId) invalidTagResponse();
  if (expectedTagId !== undefined && id !== expectedTagId) {
    invalidTagResponse();
  }
  if (!isCanonicalTagKey(row.key) || !isCanonicalTagLabel(row.label)) {
    invalidTagResponse();
  }
  if (!Number.isSafeInteger(row.revision) || (row.revision as number) < 1) {
    invalidTagResponse();
  }
  return {
    id,
    projectId,
    key: row.key,
    label: row.label,
    revision: row.revision as number,
    deletedAt: deletedAtValue(row.deleted_at),
  };
}

function matchesExpectedLink(
  id: string,
  tagId: string,
  expected?: {
    readonly linkId?: string | undefined;
    readonly tagId?: string | undefined;
  },
): boolean {
  return (
    (expected?.linkId === undefined || id === expected.linkId) &&
    (expected?.tagId === undefined || tagId === expected.tagId)
  );
}

export function parseVenueTagAssignmentRow(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
  expected?: {
    readonly linkId?: string | undefined;
    readonly tagId?: string | undefined;
  },
): VenueTagAssignmentRecord {
  const row = objectValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  const tagId = uuidValue(row.tag_id);
  const venueId = uuidValue(row.target_id);
  if (
    projectId !== expectedProjectId ||
    venueId !== expectedVenueId ||
    row.target_type !== "venue" ||
    !matchesExpectedLink(id, tagId, expected)
  ) {
    invalidTagResponse();
  }
  return { id, projectId, tagId, targetType: "venue", venueId };
}

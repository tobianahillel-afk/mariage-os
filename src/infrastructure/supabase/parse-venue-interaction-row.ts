import { normalizeFactInstant } from "@domain/facts/fact-observation";
import {
  normalizeVenueInteraction,
  type VenueInteractionRecord,
} from "@domain/venues/venue-interaction";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";

const INVALID_RESPONSE = "Invalid venue interaction response.";

function fail(): never {
  throw new Error(INVALID_RESPONSE);
}

function objectRow(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail();
  return value as Record<string, unknown>;
}

function requiredUuid(value: unknown): string {
  return isVenueCommercialUuid(value) ? value : fail();
}

function optionalUuid(value: unknown): string | null {
  if (value === null) return null;
  return requiredUuid(value);
}

function canonicalInstant(value: unknown): string {
  const normalized = normalizeFactInstant(value);
  if (normalized === null) fail();
  return normalized;
}

function positiveRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) fail();
  return value as number;
}

function assertExpectedIdentity(
  actual: string,
  expected: string | undefined,
): void {
  if (expected !== undefined && actual !== expected) fail();
}

function canonicalInteraction(row: Record<string, unknown>) {
  if (row.next_follow_up_at === undefined) fail();
  const normalized = normalizeVenueInteraction({
    interactionType: row.interaction_type,
    occurredAt: row.occurred_at,
    summary: row.summary,
    nextFollowUpAt: row.next_follow_up_at,
  });
  if (!normalized.ok) fail();
  const value = normalized.value;
  const canonicalPairs: readonly (readonly [unknown, unknown])[] = [
    [value.interactionType, row.interaction_type],
    [value.summary, row.summary],
  ];
  if (!canonicalPairs.every(([canonical, raw]) => canonical === raw)) fail();
  return value;
}

export function parseVenueInteractionRow(
  value: unknown,
  expectedProjectId?: string,
  expectedVenueId?: string,
  expectedId?: string,
): VenueInteractionRecord {
  const row = objectRow(value);
  const id = requiredUuid(row.id);
  const projectId = requiredUuid(row.project_id);
  const venueId = requiredUuid(row.parent_id);
  const contactId = optionalUuid(row.contact_id);
  const sourceId = optionalUuid(row.source_id);
  if (row.parent_type !== "venue") fail();

  assertExpectedIdentity(projectId, expectedProjectId);
  assertExpectedIdentity(venueId, expectedVenueId);
  assertExpectedIdentity(id, expectedId);

  return {
    id,
    projectId,
    parentType: "venue",
    venueId,
    contactId,
    ...canonicalInteraction(row),
    sourceId,
    createdAt: canonicalInstant(row.created_at),
    createdBy: requiredUuid(row.created_by),
    updatedAt: canonicalInstant(row.updated_at),
    updatedBy: requiredUuid(row.updated_by),
    revision: positiveRevision(row.revision),
  };
}

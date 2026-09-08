import {
  normalizeVenueContact,
  type NormalizedVenueContact,
  type VenueContactRecord,
} from "@domain/venues/venue-contact";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";

function invalidContactResponse(): never {
  throw new Error("Invalid venue contact response.");
}

function recordValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidContactResponse();
  }
  return value as Record<string, unknown>;
}

function uuidValue(value: unknown): string {
  if (!isVenueCommercialUuid(value)) invalidContactResponse();
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") invalidContactResponse();
  return value;
}

function revisionValue(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    invalidContactResponse();
  }
  return value as number;
}

function identityMatches(
  row: Record<string, unknown>,
  id: string,
  projectId: string,
  parentId: string,
  expectedProjectId: string,
  expectedVenueId: string,
  expectedContactId: string | undefined,
): boolean {
  return [
    projectId === expectedProjectId,
    parentId === expectedVenueId,
    row.parent_type === "venue",
    expectedContactId === undefined || id === expectedContactId,
  ].every(Boolean);
}

function canonicalPayloadMatches(
  normalized: NormalizedVenueContact,
  raw: NormalizedVenueContact,
): boolean {
  return [
    [normalized.name, raw.name],
    [normalized.roleLabel, raw.roleLabel],
    [normalized.email, raw.email],
    [normalized.phone, raw.phone],
    [normalized.preferredChannel, raw.preferredChannel],
    [normalized.notes, raw.notes],
  ].every(([canonical, provider]) => canonical === provider);
}

export function parseVenueContactRow(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
  expectedContactId?: string,
): VenueContactRecord {
  const row = recordValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  const parentId = uuidValue(row.parent_id);
  if (
    !identityMatches(
      row,
      id,
      projectId,
      parentId,
      expectedProjectId,
      expectedVenueId,
      expectedContactId,
    )
  ) {
    invalidContactResponse();
  }

  const raw: NormalizedVenueContact = {
    name: nullableString(row.name),
    roleLabel: nullableString(row.role_label),
    email: nullableString(row.email),
    phone: nullableString(row.phone),
    preferredChannel: nullableString(row.preferred_channel),
    notes: nullableString(row.notes),
  };
  const normalized = normalizeVenueContact(raw);
  if (!normalized.ok) invalidContactResponse();
  if (!canonicalPayloadMatches(normalized.value, raw)) invalidContactResponse();

  return {
    id,
    projectId,
    parentType: "venue",
    venueId: parentId,
    ...normalized.value,
    revision: revisionValue(row.revision),
  };
}

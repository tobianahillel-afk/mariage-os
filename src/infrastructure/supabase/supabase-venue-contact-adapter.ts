import type {
  SaveVenueContactInput,
  VenueContactPort,
} from "@application/venues/venue-contact-service";
import { VenueContactPersistenceError } from "@application/venues/venue-contact-persistence-error";
import type { VenueContactRecord } from "@domain/venues/venue-contact";
import { parseVenueContactRow } from "./parse-venue-contact-row";

const CONTACT_COLUMNS =
  "id,project_id,parent_type,parent_id,name,role_label,email,phone,preferred_channel,notes,revision";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface FilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): FilterBuilder;
}

interface ContactsTable {
  select(columns: string): FilterBuilder;
}

export interface SupabaseVenueContactClientLike {
  from(table: "contacts"): ContactsTable;
  rpc(
    functionName: "save_venue_contact",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function providerErrorCode(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function providerFailure(message: string): VenueContactPersistenceError {
  return new VenueContactPersistenceError("provider_response_invalid", message);
}

function savedRecordMatches(
  record: VenueContactRecord,
  input: SaveVenueContactInput,
  expectedRevision: number,
): boolean {
  return [
    record.id === input.contactId,
    record.projectId === input.projectId,
    record.venueId === input.venueId,
    record.parentType === "venue",
    record.name === input.name,
    record.roleLabel === input.roleLabel,
    record.email === input.email,
    record.phone === input.phone,
    record.preferredChannel === input.preferredChannel,
    record.notes === input.notes,
    record.revision === expectedRevision,
  ].every(Boolean);
}

function expectedSavedRecord(
  record: VenueContactRecord,
  input: SaveVenueContactInput,
): VenueContactRecord {
  const expectedRevision =
    input.expectedRevision === null ? 1 : input.expectedRevision + 1;
  if (!savedRecordMatches(record, input, expectedRevision)) {
    throw providerFailure("Invalid venue contact save response.");
  }
  return record;
}

function uniqueRecords(
  records: readonly VenueContactRecord[],
): readonly VenueContactRecord[] {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) {
      throw providerFailure("Invalid venue contact list response.");
    }
    ids.add(record.id);
  }
  return records;
}

export class SupabaseVenueContactAdapter implements VenueContactPort {
  constructor(private readonly client: SupabaseVenueContactClientLike) {}

  async saveVenueContact(
    input: SaveVenueContactInput,
  ): Promise<VenueContactRecord> {
    const { data, error } = await this.client.rpc("save_venue_contact", {
      target_project_id: input.projectId,
      target_venue_id: input.venueId,
      target_contact_id: input.contactId,
      target_expected_revision: input.expectedRevision,
      target_name: input.name,
      target_role_label: input.roleLabel,
      target_email: input.email,
      target_phone: input.phone,
      target_preferred_channel: input.preferredChannel,
      target_notes: input.notes,
    });
    if (error !== null) {
      const code = providerErrorCode(error);
      throw new VenueContactPersistenceError(
        code === "23505" || code === "40001"
          ? "conflict"
          : "persistence_failed",
        "Venue contact save failed.",
      );
    }
    let record: VenueContactRecord;
    try {
      record = parseVenueContactRow(
        data,
        input.projectId,
        input.venueId,
        input.contactId,
      );
    } catch {
      throw providerFailure("Invalid venue contact save response.");
    }
    return expectedSavedRecord(record, input);
  }

  async listVenueContacts(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueContactRecord[]> {
    const { data, error } = await this.client
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .eq("project_id", projectId)
      .eq("parent_type", "venue")
      .eq("parent_id", venueId);
    if (error !== null || !Array.isArray(data)) {
      throw new VenueContactPersistenceError(
        "persistence_failed",
        "Venue contact query failed.",
      );
    }
    try {
      return uniqueRecords(
        data.map((row) => parseVenueContactRow(row, projectId, venueId)),
      );
    } catch (errorValue) {
      if (errorValue instanceof VenueContactPersistenceError) throw errorValue;
      throw providerFailure("Invalid venue contact list response.");
    }
  }
}

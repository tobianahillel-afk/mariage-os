import {
  compareVenueAvailabilityRecency,
  venueAvailabilityPayloadEquals,
  type VenueAvailabilityRecord,
} from "@domain/venues/venue-availability";
import type {
  NormalizedAppendVenueAvailabilityInput,
  VenueAvailabilityPort,
} from "@application/venues/venue-availability-service";
import { VenueAvailabilityPersistenceError } from "@application/venues/venue-availability-persistence-error";
import { parseVenueAvailabilityRow } from "./parse-venue-availability-row";

const AVAILABILITY_COLUMNS =
  "id,project_id,venue_id,date_option_id,event_date,status,option_expires_at,observed_at,source_id,notes,created_at,created_by,updated_at,updated_by,revision";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface FilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): FilterBuilder;
  order(
    column: string,
    options: Readonly<{ ascending: boolean }>,
  ): PromiseLike<SupabaseResult>;
}

interface AvailabilityTable {
  select(columns: string): FilterBuilder;
}

export interface SupabaseVenueAvailabilityClientLike {
  from(table: "venue_availabilities"): AvailabilityTable;
  rpc(
    functionName: "append_venue_availability",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function providerErrorCode(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function uniqueRecords(
  records: readonly VenueAvailabilityRecord[],
): readonly VenueAvailabilityRecord[] {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) {
      throw new VenueAvailabilityPersistenceError(
        "provider_response_invalid",
        "Invalid venue availability response.",
      );
    }
    ids.add(record.id);
  }
  return records;
}

function expectedAppendPayload(
  record: VenueAvailabilityRecord,
  input: NormalizedAppendVenueAvailabilityInput,
): VenueAvailabilityRecord {
  if (
    record.id !== input.availabilityId ||
    !venueAvailabilityPayloadEquals(record, {
      projectId: input.projectId,
      venueId: input.venueId,
      dateOptionId: input.dateOptionId,
      eventDate: input.eventDate,
      status: input.status,
      optionExpiresAt: input.optionExpiresAt,
      observedAt: input.observedAt,
      sourceId: input.sourceId,
      notes: input.notes,
    })
  ) {
    throw new VenueAvailabilityPersistenceError(
      "provider_response_invalid",
      "Invalid venue availability response.",
    );
  }
  return record;
}

export class SupabaseVenueAvailabilityAdapter implements VenueAvailabilityPort {
  constructor(private readonly client: SupabaseVenueAvailabilityClientLike) {}

  async appendVenueAvailability(
    input: NormalizedAppendVenueAvailabilityInput,
  ): Promise<VenueAvailabilityRecord> {
    const { data, error } = await this.client.rpc("append_venue_availability", {
      target_project_id: input.projectId,
      target_venue_id: input.venueId,
      target_availability_id: input.availabilityId,
      target_date_option_id: input.dateOptionId,
      target_event_date: input.eventDate,
      target_status: input.status,
      target_option_expires_at: input.optionExpiresAt,
      target_observed_at: input.observedAt,
      target_source_id: input.sourceId,
      target_notes: input.notes,
    });
    if (error !== null) {
      throw new VenueAvailabilityPersistenceError(
        providerErrorCode(error) === "23505"
          ? "conflict"
          : "persistence_failed",
        "Venue availability append failed.",
      );
    }
    let record: VenueAvailabilityRecord;
    try {
      record = parseVenueAvailabilityRow(
        data,
        input.projectId,
        input.venueId,
        input.availabilityId,
      );
    } catch {
      throw new VenueAvailabilityPersistenceError(
        "provider_response_invalid",
        "Invalid venue availability response.",
      );
    }
    return expectedAppendPayload(record, input);
  }

  async listVenueAvailabilityHistory(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueAvailabilityRecord[]> {
    const { data, error } = await this.client
      .from("venue_availabilities")
      .select(AVAILABILITY_COLUMNS)
      .eq("project_id", projectId)
      .eq("venue_id", venueId)
      .order("observed_at", { ascending: false });
    if (error !== null || !Array.isArray(data)) {
      throw new VenueAvailabilityPersistenceError(
        "persistence_failed",
        "Venue availability query failed.",
      );
    }
    let records: readonly VenueAvailabilityRecord[];
    try {
      records = uniqueRecords(
        data.map((row) =>
          parseVenueAvailabilityRow(row, projectId, venueId),
        ),
      );
    } catch (errorValue) {
      if (errorValue instanceof VenueAvailabilityPersistenceError) {
        throw errorValue;
      }
      throw new VenueAvailabilityPersistenceError(
        "provider_response_invalid",
        "Invalid venue availability response.",
      );
    }
    return [...records].sort(compareVenueAvailabilityRecency);
  }
}

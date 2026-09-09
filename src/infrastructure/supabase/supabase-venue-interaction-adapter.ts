import type {
  NormalizedAppendVenueInteractionInput,
  VenueInteractionPort,
} from "@application/venues/venue-interaction-service";
import { VenueInteractionPersistenceError } from "@application/venues/venue-interaction-persistence-error";
import {
  venueInteractionPayloadEquals,
  type VenueInteractionRecord,
} from "@domain/venues/venue-interaction";
import { parseVenueInteractionRow } from "./parse-venue-interaction-row";

const INTERACTION_COLUMNS =
  "id,project_id,parent_type,parent_id,contact_id,interaction_type,occurred_at,summary,next_follow_up_at,source_id,created_at,created_by,updated_at,updated_by,revision";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface FilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): FilterBuilder;
  order(
    column: string,
    options: Readonly<{ ascending: boolean }>,
  ): FilterBuilder;
}

interface InteractionsTable {
  select(columns: string): FilterBuilder;
}

export interface SupabaseVenueInteractionClientLike {
  from(table: "interactions"): InteractionsTable;
  rpc(
    functionName: "append_venue_interaction",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function providerErrorCode(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function providerFailure(message: string): VenueInteractionPersistenceError {
  return new VenueInteractionPersistenceError(
    "provider_response_invalid",
    message,
  );
}

function expectedAppendRecord(
  record: VenueInteractionRecord,
  input: NormalizedAppendVenueInteractionInput,
): VenueInteractionRecord {
  if (!venueInteractionPayloadEquals(record, input)) {
    throw providerFailure("Invalid venue interaction append response.");
  }
  return record;
}

function uniqueRecords(
  records: readonly VenueInteractionRecord[],
): readonly VenueInteractionRecord[] {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) {
      throw providerFailure("Invalid venue interaction list response.");
    }
    ids.add(record.id);
  }
  return records;
}

export class SupabaseVenueInteractionAdapter implements VenueInteractionPort {
  constructor(private readonly client: SupabaseVenueInteractionClientLike) {}

  async appendVenueInteraction(
    input: NormalizedAppendVenueInteractionInput,
  ): Promise<VenueInteractionRecord> {
    const { data, error } = await this.client.rpc("append_venue_interaction", {
      target_project_id: input.projectId,
      target_venue_id: input.venueId,
      target_interaction_id: input.interactionId,
      target_contact_id: input.contactId,
      target_interaction_type: input.interactionType,
      target_occurred_at: input.occurredAt,
      target_summary: input.summary,
      target_next_follow_up_at: input.nextFollowUpAt,
      target_source_id: input.sourceId,
    });
    if (error !== null) {
      throw new VenueInteractionPersistenceError(
        providerErrorCode(error) === "23505"
          ? "conflict"
          : "persistence_failed",
        "Venue interaction append failed.",
      );
    }
    try {
      return expectedAppendRecord(
        parseVenueInteractionRow(
          data,
          input.projectId,
          input.venueId,
          input.interactionId,
        ),
        input,
      );
    } catch (errorValue) {
      if (errorValue instanceof VenueInteractionPersistenceError)
        throw errorValue;
      throw providerFailure("Invalid venue interaction append response.");
    }
  }

  async listVenueInteractionHistory(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueInteractionRecord[]> {
    const { data, error } = await this.client
      .from("interactions")
      .select(INTERACTION_COLUMNS)
      .eq("project_id", projectId)
      .eq("parent_type", "venue")
      .eq("parent_id", venueId)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (error !== null || !Array.isArray(data)) {
      throw new VenueInteractionPersistenceError(
        "persistence_failed",
        "Venue interaction query failed.",
      );
    }
    try {
      return uniqueRecords(
        data.map((row) => parseVenueInteractionRow(row, projectId, venueId)),
      );
    } catch (errorValue) {
      if (errorValue instanceof VenueInteractionPersistenceError)
        throw errorValue;
      throw providerFailure("Invalid venue interaction list response.");
    }
  }
}

import type {
  VenueCoreRecord,
  VenueCoreUpdateInput,
  VenueRepositoryPort,
} from "@application/venues/venue-repository-port";
import { parseVenueCoreRow } from "./parse-venue-core-row";

const VENUE_CORE_COLUMNS =
  "id,project_id,code,name,status,rejection_reason,website_url,city,revision";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface SupabaseMaybeSingleBuilder {
  maybeSingle(): PromiseLike<SupabaseResult>;
}

interface SupabaseProjectFilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: "id", value: string): SupabaseMaybeSingleBuilder;
}

interface SupabaseSelectBuilder {
  eq(column: "project_id", value: string): SupabaseProjectFilterBuilder;
}

interface SupabaseSingleBuilder {
  single(): PromiseLike<SupabaseResult>;
}

interface SupabaseUpdateSelectBuilder {
  select(columns: string): SupabaseSingleBuilder;
}

interface SupabaseUpdateVenueFilterBuilder {
  eq(column: "id", value: string): SupabaseUpdateSelectBuilder;
}

interface SupabaseUpdateProjectFilterBuilder {
  eq(column: "project_id", value: string): SupabaseUpdateVenueFilterBuilder;
}

interface SupabaseVenueRepositoryTable {
  select(columns: string): SupabaseSelectBuilder;
  update(
    values: Readonly<Record<string, unknown>>,
  ): SupabaseUpdateProjectFilterBuilder;
}

export interface SupabaseVenueRepositoryClientLike {
  from(table: "venues"): SupabaseVenueRepositoryTable;
}

function queryFailure(): never {
  throw new Error("Venue query failed.");
}

function updateFailure(): never {
  throw new Error("Venue update failed.");
}

export class SupabaseVenueRepositoryAdapter implements VenueRepositoryPort {
  constructor(private readonly client: SupabaseVenueRepositoryClientLike) {}

  async listVenues(projectId: string): Promise<readonly VenueCoreRecord[]> {
    try {
      const { data, error } = await this.client
        .from("venues")
        .select(VENUE_CORE_COLUMNS)
        .eq("project_id", projectId);
      if (error !== null) queryFailure();
      if (!Array.isArray(data)) queryFailure();
      return data.map((row) => parseVenueCoreRow(row, projectId));
    } catch {
      throw new Error("Venue query failed.");
    }
  }

  async getVenue(
    projectId: string,
    venueId: string,
  ): Promise<VenueCoreRecord | null> {
    try {
      const { data, error } = await this.client
        .from("venues")
        .select(VENUE_CORE_COLUMNS)
        .eq("project_id", projectId)
        .eq("id", venueId)
        .maybeSingle();
      if (error !== null) queryFailure();
      if (data === null) return null;
      return parseVenueCoreRow(data, projectId);
    } catch {
      throw new Error("Venue query failed.");
    }
  }

  async updateVenueCore(input: VenueCoreUpdateInput): Promise<VenueCoreRecord> {
    try {
      const { data, error } = await this.client
        .from("venues")
        .update({
          name: input.name,
          code: input.code,
          website_url: input.websiteUrl,
          city: input.city,
        })
        .eq("project_id", input.projectId)
        .eq("id", input.venueId)
        .select(VENUE_CORE_COLUMNS)
        .single();
      if (error !== null) updateFailure();
      return parseVenueCoreRow(data, input.projectId);
    } catch {
      throw new Error("Venue update failed.");
    }
  }
}

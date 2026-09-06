import type {
  CreateVenueSpaceInput,
  UpdateVenueSpaceInput,
  VenueSpacePort,
  VenueSpaceRecord,
} from "@application/venues/venue-space-service";
import { parseVenueSpaceRow } from "./parse-venue-space-row";

const SPACE_COLUMNS =
  "id,project_id,venue_id,name,space_type,indoor,area_m2,length_m,width_m,height_m,capacity_seated,capacity_cocktail,sort_order,notes,revision";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface VenueFilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: "venue_id", value: string): PromiseLike<SupabaseResult>;
}

interface ProjectFilterBuilder {
  eq(column: "project_id", value: string): VenueFilterBuilder;
}

interface SpaceTable {
  select(columns: string): ProjectFilterBuilder;
}

export interface SupabaseVenueSpaceClientLike {
  from(table: "venue_spaces"): SpaceTable;
  rpc(
    functionName: "create_venue_space" | "update_venue_space",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function queryFailure(): never {
  throw new Error("Venue space query failed.");
}

function mutationFailure(): never {
  throw new Error("Venue space mutation failed.");
}

function rpcPayload(
  input: CreateVenueSpaceInput,
): Readonly<Record<string, unknown>> {
  return {
    target_project_id: input.projectId,
    target_venue_id: input.venueId,
    target_name: input.name,
    target_space_type: input.spaceType,
    target_indoor: input.indoor,
    target_area_m2: input.areaM2,
    target_length_m: input.lengthM,
    target_width_m: input.widthM,
    target_height_m: input.heightM,
    target_capacity_seated: input.capacitySeated,
    target_capacity_cocktail: input.capacityCocktail,
    target_sort_order: input.sortOrder,
    target_notes: input.notes,
  };
}

export class SupabaseVenueSpaceAdapter implements VenueSpacePort {
  constructor(private readonly client: SupabaseVenueSpaceClientLike) {}

  async listVenueSpaces(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueSpaceRecord[]> {
    try {
      const { data, error } = await this.client
        .from("venue_spaces")
        .select(SPACE_COLUMNS)
        .eq("project_id", projectId)
        .eq("venue_id", venueId);
      if (error !== null || !Array.isArray(data)) queryFailure();
      return data.map((row) => parseVenueSpaceRow(row, projectId, venueId));
    } catch {
      throw new Error("Venue space query failed.");
    }
  }

  async createVenueSpace(
    input: CreateVenueSpaceInput,
  ): Promise<VenueSpaceRecord> {
    try {
      const { data, error } = await this.client.rpc(
        "create_venue_space",
        rpcPayload(input),
      );
      if (error !== null) mutationFailure();
      return parseVenueSpaceRow(data, input.projectId, input.venueId);
    } catch {
      throw new Error("Venue space mutation failed.");
    }
  }

  async updateVenueSpace(
    input: UpdateVenueSpaceInput,
  ): Promise<VenueSpaceRecord> {
    try {
      const { data, error } = await this.client.rpc("update_venue_space", {
        ...rpcPayload(input),
        target_space_id: input.spaceId,
        target_expected_revision: input.expectedRevision,
      });
      if (error !== null) mutationFailure();
      return parseVenueSpaceRow(data, input.projectId, input.venueId);
    } catch {
      throw new Error("Venue space mutation failed.");
    }
  }
}

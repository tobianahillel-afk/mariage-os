import type {
  SaveVenueMemberPreferenceInput,
  SaveVenueMemberRatingInput,
  VenueMemberOpinionPort,
  VenueMemberPreferenceRecord,
  VenueMemberRatingRecord,
} from "@application/venues/venue-member-opinion-service";
import {
  parseVenueMemberPreferenceRow,
  parseVenueMemberRatingRow,
} from "./parse-venue-member-opinion-row";

const PREFERENCE_COLUMNS =
  "id,project_id,user_id,target_type,target_id,favorite,personal_note,revision";
const RATING_COLUMNS =
  "id,project_id,user_id,target_type,target_id,dimension_key,rating,revision";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface TargetFilterBuilder extends PromiseLike<SupabaseResult> {
  maybeSingle(): PromiseLike<SupabaseResult>;
}
interface TypeFilterBuilder {
  eq(column: "target_id", value: string): TargetFilterBuilder;
}
interface ProjectFilterBuilder {
  eq(column: "target_type", value: "venue"): TypeFilterBuilder;
}
interface SelectBuilder {
  eq(column: "project_id", value: string): ProjectFilterBuilder;
}
interface OpinionTable {
  select(columns: string): SelectBuilder;
}

export interface SupabaseVenueMemberOpinionClientLike {
  from(table: "member_entity_preferences" | "member_ratings"): OpinionTable;
  rpc(
    functionName: "set_venue_member_preference" | "set_venue_member_rating",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function queryFailure(): never {
  throw new Error("Venue member opinion query failed.");
}
function mutationFailure(): never {
  throw new Error("Venue member opinion mutation failed.");
}

export class SupabaseVenueMemberOpinionAdapter implements VenueMemberOpinionPort {
  constructor(private readonly client: SupabaseVenueMemberOpinionClientLike) {}

  async getOwnVenuePreference(
    projectId: string,
    venueId: string,
  ): Promise<VenueMemberPreferenceRecord | null> {
    try {
      const { data, error } = await this.client
        .from("member_entity_preferences")
        .select(PREFERENCE_COLUMNS)
        .eq("project_id", projectId)
        .eq("target_type", "venue")
        .eq("target_id", venueId)
        .maybeSingle();
      if (error !== null) queryFailure();
      if (data === null) return null;
      return parseVenueMemberPreferenceRow(data, projectId, venueId);
    } catch {
      throw new Error("Venue member opinion query failed.");
    }
  }

  async listVenueRatings(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueMemberRatingRecord[]> {
    try {
      const { data, error } = await this.client
        .from("member_ratings")
        .select(RATING_COLUMNS)
        .eq("project_id", projectId)
        .eq("target_type", "venue")
        .eq("target_id", venueId);
      if (error !== null || !Array.isArray(data)) queryFailure();
      return data.map((row) => parseVenueMemberRatingRow(row, projectId, venueId));
    } catch {
      throw new Error("Venue member opinion query failed.");
    }
  }

  async saveVenuePreference(
    input: SaveVenueMemberPreferenceInput,
  ): Promise<VenueMemberPreferenceRecord> {
    try {
      const { data, error } = await this.client.rpc("set_venue_member_preference", {
        target_project_id: input.projectId,
        target_venue_id: input.venueId,
        target_favorite: input.favorite,
        target_personal_note: input.personalNote,
        target_expected_revision: input.expectedRevision,
      });
      if (error !== null) mutationFailure();
      return parseVenueMemberPreferenceRow(data, input.projectId, input.venueId);
    } catch {
      throw new Error("Venue member opinion mutation failed.");
    }
  }

  async saveVenueRating(
    input: SaveVenueMemberRatingInput,
  ): Promise<VenueMemberRatingRecord> {
    try {
      const { data, error } = await this.client.rpc("set_venue_member_rating", {
        target_project_id: input.projectId,
        target_venue_id: input.venueId,
        target_dimension_key: input.dimensionKey,
        target_rating: input.rating,
        target_expected_revision: input.expectedRevision,
      });
      if (error !== null) mutationFailure();
      return parseVenueMemberRatingRow(data, input.projectId, input.venueId);
    } catch {
      throw new Error("Venue member opinion mutation failed.");
    }
  }
}

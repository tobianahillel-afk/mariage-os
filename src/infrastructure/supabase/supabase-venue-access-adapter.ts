import type {
  NormalizedAppendVenueAccessRouteInput,
  VenueAccessPort,
} from "@application/venues/venue-access-service";
import { VenueAccessPersistenceError } from "@application/venues/venue-access-persistence-error";
import {
  venueAccessRouteCallerPayloadEquals,
  type VenueAccessRouteRecord,
  type VenueReferenceOrigin,
} from "@domain/venues/venue-access-route";
import { parseVenueAccessRouteRow } from "./parse-venue-access-route-row";
import { parseVenueReferenceOriginRow } from "./parse-venue-reference-origin-row";

const ROUTE_COLUMNS =
  "id,project_id,venue_id,reference_origin_id,route_type,origin_label,destination_label,mode,duration_minutes,distance_meters,transfers_count,observed_at,source_id,notes,reference_origin_address_snapshot,reference_origin_latitude_snapshot,reference_origin_longitude_snapshot,created_at,created_by,updated_at,updated_by,revision";
const ORIGIN_COLUMNS =
  "id,project_id,label,address_text,latitude,longitude,is_default";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface FilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string | boolean): FilterBuilder;
  order(
    column: string,
    options: Readonly<{ ascending: boolean }>,
  ): FilterBuilder;
}

interface AccessTable {
  select(columns: string): FilterBuilder;
}

export interface SupabaseVenueAccessClientLike {
  from(table: "venue_access_routes" | "project_reference_origins"): AccessTable;
  rpc(
    functionName: "append_venue_access_route",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function providerErrorCode(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function uniqueRoutes(
  records: readonly VenueAccessRouteRecord[],
): readonly VenueAccessRouteRecord[] {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) {
      throw new VenueAccessPersistenceError(
        "provider_response_invalid",
        "Invalid venue access route response.",
      );
    }
    ids.add(record.id);
  }
  return records;
}

function expectedAppendPayload(
  record: VenueAccessRouteRecord,
  input: NormalizedAppendVenueAccessRouteInput,
): VenueAccessRouteRecord {
  if (
    record.id !== input.routeId ||
    !venueAccessRouteCallerPayloadEquals(record, {
      projectId: input.projectId,
      venueId: input.venueId,
      referenceOriginId: input.referenceOriginId,
      routeType: input.routeType,
      originLabel: input.originLabel,
      destinationLabel: input.destinationLabel,
      mode: input.mode,
      durationMinutes: input.durationMinutes,
      distanceMeters: input.distanceMeters,
      transfersCount: input.transfersCount,
      observedAt: input.observedAt,
      sourceId: input.sourceId,
      notes: input.notes,
    })
  ) {
    throw new VenueAccessPersistenceError(
      "provider_response_invalid",
      "Invalid venue access route response.",
    );
  }
  return record;
}

export class SupabaseVenueAccessAdapter implements VenueAccessPort {
  constructor(private readonly client: SupabaseVenueAccessClientLike) {}

  async appendVenueAccessRoute(
    input: NormalizedAppendVenueAccessRouteInput,
  ): Promise<VenueAccessRouteRecord> {
    const { data, error } = await this.client.rpc("append_venue_access_route", {
      target_project_id: input.projectId,
      target_venue_id: input.venueId,
      target_route_id: input.routeId,
      target_reference_origin_id: input.referenceOriginId,
      target_route_type: input.routeType,
      target_origin_label: input.originLabel,
      target_destination_label: input.destinationLabel,
      target_mode: input.mode,
      target_duration_minutes: input.durationMinutes,
      target_distance_meters: input.distanceMeters,
      target_transfers_count: input.transfersCount,
      target_observed_at: input.observedAt,
      target_source_id: input.sourceId,
      target_notes: input.notes,
    });
    if (error !== null) {
      throw new VenueAccessPersistenceError(
        providerErrorCode(error) === "23505"
          ? "conflict"
          : "persistence_failed",
        "Venue access route append failed.",
      );
    }

    let record: VenueAccessRouteRecord;
    try {
      record = parseVenueAccessRouteRow(
        data,
        input.projectId,
        input.venueId,
        input.routeId,
      );
    } catch {
      throw new VenueAccessPersistenceError(
        "provider_response_invalid",
        "Invalid venue access route response.",
      );
    }
    return expectedAppendPayload(record, input);
  }

  async listVenueAccessRouteHistory(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueAccessRouteRecord[]> {
    const { data, error } = await this.client
      .from("venue_access_routes")
      .select(ROUTE_COLUMNS)
      .eq("project_id", projectId)
      .eq("venue_id", venueId)
      .order("observed_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (error !== null || !Array.isArray(data)) {
      throw new VenueAccessPersistenceError(
        "persistence_failed",
        "Venue access route query failed.",
      );
    }
    try {
      return uniqueRoutes(
        data.map((row) => parseVenueAccessRouteRow(row, projectId, venueId)),
      );
    } catch (errorValue) {
      if (errorValue instanceof VenueAccessPersistenceError) throw errorValue;
      throw new VenueAccessPersistenceError(
        "provider_response_invalid",
        "Invalid venue access route response.",
      );
    }
  }

  async getDefaultReferenceOrigin(
    projectId: string,
  ): Promise<VenueReferenceOrigin | null> {
    const { data, error } = await this.client
      .from("project_reference_origins")
      .select(ORIGIN_COLUMNS)
      .eq("project_id", projectId)
      .eq("is_default", true);
    if (error !== null || !Array.isArray(data)) {
      throw new VenueAccessPersistenceError(
        "persistence_failed",
        "Venue reference origin query failed.",
      );
    }
    if (data.length === 0) return null;
    if (data.length !== 1) {
      throw new VenueAccessPersistenceError(
        "provider_response_invalid",
        "Invalid venue reference origin response.",
      );
    }
    try {
      return parseVenueReferenceOriginRow(data[0], projectId);
    } catch {
      throw new VenueAccessPersistenceError(
        "provider_response_invalid",
        "Invalid venue reference origin response.",
      );
    }
  }
}

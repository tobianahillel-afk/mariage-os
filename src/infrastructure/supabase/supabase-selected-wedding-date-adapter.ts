import {
  isCommercialCivilDate,
  isVenueCommercialUuid,
} from "@domain/venues/venue-commercial-values";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface FilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): FilterBuilder;
}

interface WeddingDateTable {
  select(columns: string): FilterBuilder;
}

export interface SupabaseSelectedWeddingDateClientLike {
  from(table: "wedding_date_options"): WeddingDateTable;
}

function fail(): never {
  throw new Error("Selected wedding date query failed.");
}

function selectedEventDate(value: unknown, projectId: string): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail();
  }
  const row = value as Record<string, unknown>;
  if (
    !isVenueCommercialUuid(row.id) ||
    row.project_id !== projectId ||
    row.status !== "selected" ||
    !isCommercialCivilDate(row.event_date)
  ) {
    return fail();
  }
  return row.event_date;
}

export class SupabaseSelectedWeddingDateAdapter {
  constructor(private readonly client: SupabaseSelectedWeddingDateClientLike) {}

  async getSelectedEventDate(projectId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("wedding_date_options")
      .select("id,project_id,event_date,status")
      .eq("project_id", projectId)
      .eq("status", "selected");
    if (error !== null || !Array.isArray(data)) return fail();
    if (data.length === 0) return null;
    if (data.length !== 1) return fail();
    return selectedEventDate(data[0], projectId);
  }
}

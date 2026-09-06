import type {
  CreatedVenue,
  VenueCommandPort,
  VenueQuickAddInput,
  VenueTransitionInput,
} from "@application/venues/venue-command-port";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface SupabaseSingleBuilder {
  single(): PromiseLike<SupabaseResult>;
}

interface SupabaseSelectBuilder {
  select(columns: string): SupabaseSingleBuilder;
}

interface SupabaseVenueTable {
  insert(values: Readonly<Record<string, unknown>>): SupabaseSelectBuilder;
}

export interface SupabaseVenueClientLike {
  from(table: "venues"): SupabaseVenueTable;
  rpc(
    functionName: "transition_venue_status",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

type UnknownRecord = Record<string, unknown>;

function invalidCreatedVenue(): never {
  throw new Error("Venue creation failed.");
}

function recordValue(value: unknown): UnknownRecord {
  if (typeof value !== "object") invalidCreatedVenue();
  if (value === null) invalidCreatedVenue();
  if (Array.isArray(value)) invalidCreatedVenue();
  return value as UnknownRecord;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") invalidCreatedVenue();
  return value;
}

function uuidValue(value: unknown): string {
  const parsed = stringValue(value);
  if (!UUID_PATTERN.test(parsed)) invalidCreatedVenue();
  return parsed;
}

function revisionValue(value: unknown): number {
  if (typeof value !== "number") invalidCreatedVenue();
  if (!Number.isSafeInteger(value)) invalidCreatedVenue();
  if (value < 1) invalidCreatedVenue();
  return value;
}

function parseCreatedVenue(
  value: unknown,
  expectedProjectId: string,
): CreatedVenue {
  const row = recordValue(value);
  const projectId = uuidValue(row.project_id);
  if (projectId !== expectedProjectId) invalidCreatedVenue();

  const status = stringValue(row.status);
  if (status !== "research") invalidCreatedVenue();
  return {
    id: uuidValue(row.id),
    projectId,
    status,
    revision: revisionValue(row.revision),
  };
}

function transitionRevision(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error("Venue transition failed.");
  }
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("Venue transition failed.");
  }
  return value;
}

export class SupabaseVenueCommandAdapter implements VenueCommandPort {
  constructor(private readonly client: SupabaseVenueClientLike) {}

  async createVenue(input: VenueQuickAddInput): Promise<CreatedVenue> {
    try {
      const { data, error } = await this.client
        .from("venues")
        .insert({
          project_id: input.projectId,
          name: input.name,
          code: input.code,
          website_url: input.websiteUrl,
          city: input.city,
        })
        .select("id,project_id,status,revision")
        .single();
      if (error !== null) invalidCreatedVenue();
      return parseCreatedVenue(data, input.projectId);
    } catch {
      throw new Error("Venue creation failed.");
    }
  }

  async transitionVenue(input: VenueTransitionInput): Promise<number> {
    try {
      const { data, error } = await this.client.rpc("transition_venue_status", {
        target_project_id: input.projectId,
        target_venue_id: input.venueId,
        target_status: input.status,
        target_rejection_reason: input.rejectionReason,
        target_expected_revision: input.expectedRevision,
      });
      if (error !== null) throw new Error("Venue transition failed.");
      return transitionRevision(data);
    } catch {
      throw new Error("Venue transition failed.");
    }
  }
}

import { describe, expect, it } from "vitest";
import {
  SupabaseVenueOfferAdapter,
  type SupabaseVenueOfferClientLike,
} from "./supabase-venue-offer-adapter";
import {
  SupabaseVenueAvailabilityAdapter,
  type SupabaseVenueAvailabilityClientLike,
} from "./supabase-venue-availability-adapter";
import {
  SupabaseVenueAccessAdapter,
  type SupabaseVenueAccessClientLike,
} from "./supabase-venue-access-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const actorId = "33333333-3333-4333-8333-333333333333";
type Result = { readonly data: unknown; readonly error: unknown };

class Builder implements PromiseLike<Result> {
  constructor(private readonly result: Result) {}
  eq(): Builder {
    return this;
  }
  order(): Builder {
    return this;
  }
  range(): PromiseLike<Result> {
    return Promise.resolve(this.result);
  }
  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

function offerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "41111111-1111-4111-8111-111111111111",
    project_id: projectId,
    venue_id: venueId,
    name: "Quote",
    status: "quoted",
    valid_from: null,
    valid_to: null,
    weekday: null,
    base_amount_minor: 100_000,
    currency: "EUR",
    tax_mode: "unknown",
    tax_rate_basis_points: null,
    included_guest_count: null,
    extra_guest_amount_minor: null,
    deposit_amount_minor: null,
    deposit_refundable: null,
    security_deposit_minor: null,
    security_deposit_refundable: null,
    included_start_time: null,
    included_end_time: null,
    included_end_day_offset: 0,
    extra_hour_amount_minor: null,
    source_id: null,
    notes: null,
    revision: 1,
    ...overrides,
  };
}

function availabilityRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "51111111-1111-4111-8111-111111111111",
    project_id: projectId,
    venue_id: venueId,
    date_option_id: null,
    event_date: "2027-06-12",
    status: "available",
    option_expires_at: null,
    observed_at: "2026-10-01T10:00:00.000Z",
    source_id: null,
    notes: null,
    created_at: "2026-10-01T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-10-01T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

function routeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "61111111-1111-4111-8111-111111111111",
    project_id: projectId,
    venue_id: venueId,
    reference_origin_id: null,
    route_type: "reference_to_venue",
    origin_label: "Paris",
    destination_label: "Venue",
    mode: "car",
    duration_minutes: 45,
    distance_meters: null,
    transfers_count: null,
    observed_at: "2026-10-01T10:00:00.000Z",
    source_id: null,
    notes: null,
    reference_origin_address_snapshot: null,
    reference_origin_latitude_snapshot: null,
    reference_origin_longitude_snapshot: null,
    created_at: "2026-10-01T10:01:00.000Z",
    created_by: actorId,
    updated_at: "2026-10-01T10:01:00.000Z",
    updated_by: actorId,
    revision: 1,
    ...overrides,
  };
}

describe("WP-2.11 project-wide commercial decision adapter", () => {
  it("lists project offers and rejects substituted Venue identity", async () => {
    let result: Result = { data: [offerRow()], error: null };
    const client = {
      from: () => ({ select: () => new Builder(result) }),
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as unknown as SupabaseVenueOfferClientLike;
    const adapter = new SupabaseVenueOfferAdapter(client);
    await expect(adapter.listProjectOffers(projectId)).resolves.toMatchObject([
      { projectId, venueId },
    ]);
    result = { data: [offerRow({ venue_id: "bad" })], error: null };
    await expect(adapter.listProjectOffers(projectId)).rejects.toThrow(
      "Invalid venue commercial response.",
    );
    result = { data: [null], error: null };
    await expect(adapter.listProjectOffers(projectId)).rejects.toThrow(
      "Invalid venue commercial response.",
    );
    result = { data: null, error: null };
    await expect(adapter.listProjectOffers(projectId)).rejects.toThrow(
      "Venue offer query failed.",
    );
  });
});

describe("WP-2.11 project-wide availability/access decision adapters", () => {
  it("lists selected-date availability and rejects date substitution", async () => {
    let result: Result = { data: [availabilityRow()], error: null };
    const client = {
      from: () => ({ select: () => new Builder(result) }),
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as unknown as SupabaseVenueAvailabilityClientLike;
    const adapter = new SupabaseVenueAvailabilityAdapter(client);
    await expect(
      adapter.listProjectAvailability(projectId, "2027-06-12"),
    ).resolves.toMatchObject([{ projectId, venueId }]);
    result = {
      data: [availabilityRow({ event_date: "2027-07-10" })],
      error: null,
    };
    await expect(
      adapter.listProjectAvailability(projectId, "2027-06-12"),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });

    result = { data: null, error: null };
    await expect(
      adapter.listProjectAvailability(projectId, "2027-06-12"),
    ).rejects.toMatchObject({ code: "persistence_failed" });

    result = { data: [availabilityRow(), availabilityRow()], error: null };
    await expect(
      adapter.listProjectAvailability(projectId, "2027-06-12"),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
  });

  it("lists project access routes and rejects query shape failure", async () => {
    let result: Result = { data: [routeRow()], error: null };
    const client = {
      from: () => ({ select: () => new Builder(result) }),
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as unknown as SupabaseVenueAccessClientLike;
    const adapter = new SupabaseVenueAccessAdapter(client);
    await expect(
      adapter.listProjectAccessRoutes(projectId),
    ).resolves.toMatchObject([{ projectId, venueId, mode: "car" }]);
    result = { data: null, error: null };
    await expect(
      adapter.listProjectAccessRoutes(projectId),
    ).rejects.toMatchObject({ code: "persistence_failed" });

    result = { data: [routeRow(), routeRow()], error: null };
    await expect(
      adapter.listProjectAccessRoutes(projectId),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });

    result = { data: [routeRow({ observed_at: "bad" })], error: null };
    await expect(
      adapter.listProjectAccessRoutes(projectId),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
  });
});

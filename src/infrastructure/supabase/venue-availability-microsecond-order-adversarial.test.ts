import { expect, it } from "vitest";
import {
  SupabaseVenueAvailabilityAdapter,
  type SupabaseVenueAvailabilityClientLike,
} from "./supabase-venue-availability-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const actorId = "33333333-3333-4333-8333-333333333333";
const olderId = "11111111-1111-4111-8111-111111111111";
const newerId = "22222222-2222-4222-8222-222222222222";

type Result = { readonly data: unknown; readonly error: unknown };

function row(id: string, observedAt: string) {
  return {
    id,
    project_id: projectId,
    venue_id: venueId,
    date_option_id: null,
    event_date: "2027-06-12",
    status: "available",
    option_expires_at: null,
    observed_at: observedAt,
    source_id: null,
    notes: null,
    created_at: "2026-09-08T10:01:00.000500Z",
    created_by: actorId,
    updated_at: "2026-09-08T10:01:00.000500Z",
    updated_by: actorId,
    revision: 1,
  };
}

class QueryBuilder implements PromiseLike<Result> {
  constructor(private readonly result: Result) {}

  eq(): QueryBuilder {
    return this;
  }

  order(): PromiseLike<Result> {
    return Promise.resolve(this.result);
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class FakeClient implements SupabaseVenueAvailabilityClientLike {
  from() {
    return {
      select: () =>
        new QueryBuilder({
          data: [
            row(newerId, "2026-09-08T10:00:00.000999Z"),
            row(olderId, "2026-09-08T10:00:00.000001Z"),
          ],
          error: null,
        }),
    };
  }

  rpc(): PromiseLike<Result> {
    return Promise.resolve({ data: null, error: null });
  }
}

it("preserves PostgreSQL microsecond observed_at recency before UUID tie-break", async () => {
  const adapter = new SupabaseVenueAvailabilityAdapter(new FakeClient());

  const history = await adapter.listVenueAvailabilityHistory(
    projectId,
    venueId,
  );

  expect(history.map((record) => record.id)).toEqual([newerId, olderId]);
});

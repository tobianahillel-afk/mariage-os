import { expect, it } from "vitest";
import {
  SupabaseSelectedWeddingDateAdapter,
  type SupabaseSelectedWeddingDateClientLike,
} from "./supabase-selected-wedding-date-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const dateId = "22222222-2222-4222-8222-222222222222";
type Result = { readonly data: unknown; readonly error: unknown };

class Builder implements PromiseLike<Result> {
  readonly filters: { column: string; value: string }[] = [];

  constructor(private readonly result: Result) {}

  eq(column: string, value: string): Builder {
    this.filters.push({ column, value });
    return this;
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class Client implements SupabaseSelectedWeddingDateClientLike {
  result: Result = {
    data: [
      {
        id: dateId,
        project_id: projectId,
        event_date: "2027-06-12",
        status: "selected",
      },
    ],
    error: null,
  };
  lastBuilder: Builder | null = null;

  from() {
    return {
      select: () => {
        const builder = new Builder(this.result);
        this.lastBuilder = builder;
        return builder;
      },
    };
  }
}

it("reads exactly one selected project wedding date", async () => {
  const client = new Client();
  await expect(
    new SupabaseSelectedWeddingDateAdapter(client).getSelectedEventDate(
      projectId,
    ),
  ).resolves.toBe("2027-06-12");
  expect(client.lastBuilder?.filters).toEqual([
    { column: "project_id", value: projectId },
    { column: "status", value: "selected" },
  ]);
});

it("returns null when no wedding date is selected", async () => {
  const client = new Client();
  client.result = { data: [], error: null };
  await expect(
    new SupabaseSelectedWeddingDateAdapter(client).getSelectedEventDate(
      projectId,
    ),
  ).resolves.toBeNull();
});

it("fails closed on provider, multiplicity and selected-row substitution", async () => {
  const client = new Client();
  const adapter = new SupabaseSelectedWeddingDateAdapter(client);
  const invalid: readonly Result[] = [
    { data: [], error: { message: "down" } },
    { data: null, error: null },
    {
      data: [
        {
          id: dateId,
          project_id: projectId,
          event_date: "2027-06-12",
          status: "selected",
        },
        {
          id: crypto.randomUUID(),
          project_id: projectId,
          event_date: "2027-07-10",
          status: "selected",
        },
      ],
      error: null,
    },
    {
      data: [
        {
          id: "bad",
          project_id: projectId,
          event_date: "2027-06-12",
          status: "selected",
        },
      ],
      error: null,
    },
  ];
  for (const result of invalid) {
    client.result = result;
    await expect(adapter.getSelectedEventDate(projectId)).rejects.toThrow(
      "Selected wedding date query failed.",
    );
  }
});

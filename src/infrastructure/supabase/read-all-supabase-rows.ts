const SUPABASE_PAGE_SIZE = 1_000;

export interface SupabaseRowsPage {
  readonly data: unknown;
  readonly error: unknown;
}

export type SupabaseRowsPageReader = (
  from: number,
  to: number,
) => PromiseLike<SupabaseRowsPage>;

export class SupabasePaginationError extends Error {
  constructor() {
    super("Supabase paged query failed.");
    this.name = "SupabasePaginationError";
  }
}

export async function readAllSupabaseRows(
  readPage: SupabaseRowsPageReader,
): Promise<readonly unknown[]> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await readPage(
      from,
      from + SUPABASE_PAGE_SIZE - 1,
    );
    if (error !== null || !Array.isArray(data)) {
      throw new SupabasePaginationError();
    }
    rows.push(...data);
    if (data.length < SUPABASE_PAGE_SIZE) return rows;
  }
}

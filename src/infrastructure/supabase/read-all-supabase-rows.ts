const SUPABASE_PAGE_SIZE = 1_000;
const MAX_SUPABASE_PAGE_COUNT = 100;

function rowId(value: unknown): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    typeof (value as { readonly id?: unknown }).id !== "string"
  ) {
    return null;
  }
  return (value as { readonly id: string }).id;
}

function fullPageBoundarySignature(rows: readonly unknown[]): string | null {
  if (rows.length !== SUPABASE_PAGE_SIZE) return null;
  const first = rowId(rows[0]);
  const last = rowId(rows[rows.length - 1]);
  return first === null || last === null ? null : `${first}\u0000${last}`;
}

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
  let previousFullPageSignature: string | null = null;
  for (let pageIndex = 0; pageIndex < MAX_SUPABASE_PAGE_COUNT; pageIndex += 1) {
    const from = pageIndex * SUPABASE_PAGE_SIZE;
    const { data, error } = await readPage(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error !== null || !Array.isArray(data)) {
      throw new SupabasePaginationError();
    }
    const signature = fullPageBoundarySignature(data);
    if (signature !== null && signature === previousFullPageSignature) {
      throw new SupabasePaginationError();
    }
    rows.push(...data);
    if (data.length < SUPABASE_PAGE_SIZE) return rows;
    previousFullPageSignature = signature;
  }
  throw new SupabasePaginationError();
}

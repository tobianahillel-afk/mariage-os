import { describe, expect, it, vi } from "vitest";
import {
  readAllSupabaseRows,
  SupabasePaginationError,
} from "./read-all-supabase-rows";

describe("readAllSupabaseRows", () => {
  it("reads one short page with the canonical inclusive range", async () => {
    const readPage = vi
      .fn()
      .mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], error: null });

    await expect(readAllSupabaseRows(readPage)).resolves.toHaveLength(2);
    expect(readPage).toHaveBeenCalledWith(0, 999);
    expect(readPage).toHaveBeenCalledTimes(1);
  });

  it("continues after a full page without dropping the boundary", async () => {
    const first = Array.from({ length: 1_000 }, (_, id) => ({ id }));
    const readPage = vi
      .fn()
      .mockResolvedValueOnce({ data: first, error: null })
      .mockResolvedValueOnce({
        data: [{ id: 1_000 }, { id: 1_001 }],
        error: null,
      });

    const rows = await readAllSupabaseRows(readPage);
    expect(rows).toHaveLength(1_002);
    expect(readPage).toHaveBeenNthCalledWith(1, 0, 999);
    expect(readPage).toHaveBeenNthCalledWith(2, 1_000, 1_999);
  });

  it("fails closed when a provider repeats the same full page", async () => {
    const repeated = Array.from({ length: 1_000 }, (_, id) => ({
      id: `row-${id}`,
    }));
    const readPage = vi.fn().mockResolvedValue({
      data: repeated,
      error: null,
    });

    await expect(readAllSupabaseRows(readPage)).rejects.toBeInstanceOf(
      SupabasePaginationError,
    );
    expect(readPage).toHaveBeenCalledTimes(2);
  });

  it("fails closed when full pages never terminate", async () => {
    let page = 0;
    const readPage = vi.fn().mockImplementation(() => {
      const start = page * 1_000;
      page += 1;
      return Promise.resolve({
        data: Array.from({ length: 1_000 }, (_, offset) => start + offset),
        error: null,
      });
    });

    await expect(readAllSupabaseRows(readPage)).rejects.toBeInstanceOf(
      SupabasePaginationError,
    );
    expect(readPage).toHaveBeenCalledTimes(100);
  });

  it.each([
    [{ data: [], error: { message: "provider" } }],
    [{ data: null, error: null }],
  ])("fails closed on an invalid provider page", async (page) => {
    const readPage = vi.fn().mockResolvedValue(page);
    await expect(readAllSupabaseRows(readPage)).rejects.toBeInstanceOf(
      SupabasePaginationError,
    );
  });
});

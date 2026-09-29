import { expect, it, vi } from "vitest";
import {
  SupabaseTagAdapter,
  type SupabaseTagClientLike,
} from "./supabase-tag-adapter";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tagId = "aa200000-0000-4000-8000-000000000001";
const venueId = "aa100000-0000-4000-8000-000000000001";
const linkId = "aa300000-0000-4000-8000-000000000001";

const tagRow = {
  id: tagId,
  project_id: projectId,
  key: "garden",
  label: "Jardin 🌿",
  revision: 1,
  deleted_at: null,
};
const linkRow = {
  id: linkId,
  project_id: projectId,
  tag_id: tagId,
  target_type: "venue",
  target_id: venueId,
};

function fakeClient(data: unknown, error: unknown = null) {
  const filters = {
    eq: vi.fn(),
    is: vi.fn(),
    not: vi.fn(),
  };
  const query = Object.assign(Promise.resolve({ data, error }), {
    eq: filters.eq,
    is: filters.is,
    not: filters.not,
    select: vi.fn(),
  });
  filters.eq.mockReturnValue(query);
  filters.is.mockReturnValue(query);
  filters.not.mockReturnValue(query);
  query.select.mockReturnValue(query);
  const table = {
    select: vi.fn().mockReturnValue(query),
    insert: vi.fn().mockReturnValue(query),
    update: vi.fn().mockReturnValue(query),
    delete: vi.fn().mockReturnValue(query),
  };
  const client: SupabaseTagClientLike = {
    from: vi.fn().mockReturnValue(table),
  };
  return { client, table, filters };
}

it("accepts an exact create receipt and rejects a substituted project", async () => {
  const valid = fakeClient([tagRow]);
  const adapter = new SupabaseTagAdapter(valid.client);
  await expect(
    adapter.createTag({
      projectId,
      tagId,
      key: "garden",
      label: "Jardin 🌿",
    }),
  ).resolves.toMatchObject({ id: tagId, projectId, key: "garden" });
  expect(valid.table.insert).toHaveBeenCalledWith({
    id: tagId,
    project_id: projectId,
    key: "garden",
    label: "Jardin 🌿",
  });
  const swapped = fakeClient([
    { ...tagRow, project_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
  ]);
  await expect(
    new SupabaseTagAdapter(swapped.client).createTag({
      projectId,
      tagId,
      key: "garden",
      label: "Jardin 🌿",
    }),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("does not surface a deleted or duplicate tag in an active list", async () => {
  const deleted = fakeClient([
    { ...tagRow, deleted_at: "2026-09-29T00:00:00Z" },
  ]);
  await expect(
    new SupabaseTagAdapter(deleted.client).listActiveTags(projectId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  expect(deleted.filters.is).toHaveBeenCalledWith("deleted_at", null);
  const duplicate = fakeClient([tagRow, tagRow]);
  await expect(
    new SupabaseTagAdapter(duplicate.client).listActiveTags(projectId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("binds link and unlink receipts to the requested tag and Venue", async () => {
  const input = { projectId, tagId, venueId, linkId };
  const valid = fakeClient([linkRow]);
  await expect(
    new SupabaseTagAdapter(valid.client).linkVenueTag(input),
  ).resolves.toMatchObject({ id: linkId, projectId, tagId, venueId });
  const swapped = fakeClient([
    { ...linkRow, tag_id: "aa200000-0000-4000-8000-000000000002" },
  ]);
  await expect(
    new SupabaseTagAdapter(swapped.client).unlinkVenueTag(input),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  const absent = fakeClient([]);
  await expect(
    new SupabaseTagAdapter(absent.client).unlinkVenueTag(input),
  ).rejects.toMatchObject({ code: "conflict" });
});

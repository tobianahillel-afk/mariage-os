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

const tagInput = { projectId, tagId, key: "garden", label: "Jardin 🌿" };
const linkInput = { projectId, tagId, venueId, linkId };

it("classifies provider failures and refuses malformed create receipts", async () => {
  for (const [error, code] of [
    [{ code: "23505" }, "conflict"],
    [{ code: "40001" }, "conflict"],
    [{ code: "42501" }, "persistence_failed"],
    [{ code: 7 }, "persistence_failed"],
    [null, "conflict"],
    ["network", "persistence_failed"],
  ] as const) {
    const client = fakeClient(null, error);
    // A null provider error means the row shape itself must fail closed.
    await expect(
      new SupabaseTagAdapter(client.client).createTag(tagInput),
    ).rejects.toMatchObject({ code });
  }
  for (const data of [
    null,
    [],
    [tagRow, tagRow],
    [{ ...tagRow, id: linkId }],
    [{ ...tagRow, key: "other" }],
    [{ ...tagRow, label: "Other" }],
    [{ ...tagRow, revision: 2 }],
    [{ ...tagRow, deleted_at: "2026-09-29T00:00:00Z" }],
  ]) {
    await expect(
      new SupabaseTagAdapter(fakeClient(data).client).createTag(tagInput),
    ).rejects.toMatchObject({
      code:
        data === null || (Array.isArray(data) && data.length !== 1)
          ? "conflict"
          : "persistence_failed",
    });
  }
});

it("applies revision and state filters to each tag change", async () => {
  const base = { projectId, tagId, expectedRevision: 1 };
  const renamed = fakeClient([{ ...tagRow, label: "New", revision: 2 }]);
  await expect(
    new SupabaseTagAdapter(renamed.client).changeTag({
      ...base,
      action: "rename",
      label: "New",
    }),
  ).resolves.toMatchObject({ label: "New", revision: 2 });
  expect(renamed.table.update).toHaveBeenCalledWith({ label: "New" });
  expect(renamed.filters.eq).toHaveBeenCalledWith("revision", 1);
  expect(renamed.filters.is).toHaveBeenCalledWith("deleted_at", null);
  const deleted = fakeClient([
    { ...tagRow, revision: 2, deleted_at: "2026-09-29T00:00:00Z" },
  ]);
  await expect(
    new SupabaseTagAdapter(deleted.client).changeTag({
      ...base,
      action: "soft_delete",
    }),
  ).resolves.toMatchObject({ revision: 2 });
  expect(deleted.table.update).toHaveBeenCalledWith({
    deleted_at: expect.any(String),
  });
  const restored = fakeClient([{ ...tagRow, revision: 2 }]);
  await expect(
    new SupabaseTagAdapter(restored.client).changeTag({
      ...base,
      action: "restore",
    }),
  ).resolves.toMatchObject({ deletedAt: null, revision: 2 });
  expect(restored.table.update).toHaveBeenCalledWith({ deleted_at: null });
  expect(restored.filters.not).toHaveBeenCalledWith("deleted_at", "is", null);
  await expect(
    new SupabaseTagAdapter(fakeClient([]).client).changeTag({
      ...base,
      action: "rename",
      label: "New",
    }),
  ).rejects.toMatchObject({ code: "conflict" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient(null, { code: "23505" }).client,
    ).changeTag({ ...base, action: "restore" }),
  ).rejects.toMatchObject({ code: "conflict" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient([{ ...tagRow, revision: 2 }]).client,
    ).changeTag({ ...base, action: "rename" }),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("rejects inconsistent lifecycle receipts after an update", async () => {
  const base = { projectId, tagId, expectedRevision: 1 };
  for (const [change, row] of [
    [
      { action: "rename", label: "New" },
      { ...tagRow, revision: 1, label: "New" },
    ],
    [
      { action: "rename", label: "New" },
      { ...tagRow, revision: 2, label: "Wrong" },
    ],
    [
      { action: "rename", label: "New" },
      {
        ...tagRow,
        revision: 2,
        label: "New",
        deleted_at: "2026-09-29T00:00:00Z",
      },
    ],
    [{ action: "soft_delete" }, { ...tagRow, revision: 2 }],
    [
      { action: "restore" },
      { ...tagRow, revision: 2, deleted_at: "2026-09-29T00:00:00Z" },
    ],
  ] as const) {
    await expect(
      new SupabaseTagAdapter(fakeClient([row]).client).changeTag({
        ...base,
        ...change,
      }),
    ).rejects.toMatchObject({ code: "persistence_failed" });
  }
  await expect(
    new SupabaseTagAdapter(
      fakeClient([{ ...tagRow, id: linkId }]).client,
    ).changeTag({ ...base, action: "restore" }),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("reads only well-formed active definitions and rejects duplicate identity or key", async () => {
  await expect(
    new SupabaseTagAdapter(fakeClient([tagRow]).client).listActiveTags(
      projectId,
    ),
  ).resolves.toMatchObject([{ id: tagId, key: "garden" }]);
  for (const data of [null, { id: tagId }]) {
    await expect(
      new SupabaseTagAdapter(fakeClient(data).client).listActiveTags(projectId),
    ).rejects.toMatchObject({ code: "persistence_failed" });
  }
  await expect(
    new SupabaseTagAdapter(
      fakeClient(null, { code: "42501" }).client,
    ).listActiveTags(projectId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient([{ ...tagRow, key: "Garden" }]).client,
    ).listActiveTags(projectId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient([tagRow, { ...tagRow, id: linkId }]).client,
    ).listActiveTags(projectId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient([tagRow, { ...tagRow, key: "other" }]).client,
    ).listActiveTags(projectId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

it("validates each Venue link and assignment read", async () => {
  const validLink = fakeClient([linkRow]);
  await expect(
    new SupabaseTagAdapter(validLink.client).unlinkVenueTag(linkInput),
  ).resolves.toBeUndefined();
  expect(validLink.table.delete).toHaveBeenCalled();
  expect(validLink.filters.eq).toHaveBeenCalledWith("target_type", "venue");
  await expect(
    new SupabaseTagAdapter(fakeClient([linkRow]).client).listVenueAssignments(
      projectId,
      venueId,
    ),
  ).resolves.toMatchObject([{ id: linkId, tagId }]);
  for (const method of ["linkVenueTag", "unlinkVenueTag"] as const) {
    await expect(
      new SupabaseTagAdapter(fakeClient(null, { code: "23505" }).client)[
        method
      ](linkInput),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(
      new SupabaseTagAdapter(fakeClient([]).client)[method](linkInput),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(
      new SupabaseTagAdapter(
        fakeClient([{ ...linkRow, target_type: "vendor" }]).client,
      )[method](linkInput),
    ).rejects.toMatchObject({ code: "persistence_failed" });
  }
  await expect(
    new SupabaseTagAdapter(
      fakeClient(null, { code: "42501" }).client,
    ).listVenueAssignments(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  await expect(
    new SupabaseTagAdapter(fakeClient(null).client).listVenueAssignments(
      projectId,
      venueId,
    ),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient([linkRow, linkRow]).client,
    ).listVenueAssignments(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient([
        linkRow,
        { ...linkRow, id: "aa300000-0000-4000-8000-000000000002" },
      ]).client,
    ).listVenueAssignments(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
  await expect(
    new SupabaseTagAdapter(
      fakeClient([{ ...linkRow, target_id: linkId }]).client,
    ).listVenueAssignments(projectId, venueId),
  ).rejects.toMatchObject({ code: "persistence_failed" });
});

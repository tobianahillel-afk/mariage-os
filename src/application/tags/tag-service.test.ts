import { expect, it, vi } from "vitest";
import type {
  ProjectTagRecord,
  VenueTagAssignmentRecord,
} from "@domain/tags/project-tag";
import { TagPersistenceError, type TagPort } from "./tag-port";
import { TagService } from "./tag-service";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tagId = "aa200000-0000-4000-8000-000000000001";
const venueId = "aa100000-0000-4000-8000-000000000001";
const linkId = "aa300000-0000-4000-8000-000000000001";

const tag: ProjectTagRecord = {
  id: tagId,
  projectId,
  key: "garden",
  label: "Jardin 🌿",
  revision: 1,
  deletedAt: null,
};
const assignment: VenueTagAssignmentRecord = {
  id: linkId,
  projectId,
  tagId,
  targetType: "venue",
  venueId,
};

function makePort(): TagPort {
  return {
    createTag: vi.fn().mockResolvedValue(tag),
    changeTag: vi.fn().mockResolvedValue({ ...tag, revision: 2 }),
    listActiveTags: vi.fn().mockResolvedValue([tag]),
    linkVenueTag: vi.fn().mockResolvedValue(assignment),
    unlinkVenueTag: vi.fn().mockResolvedValue(undefined),
    listVenueAssignments: vi.fn().mockResolvedValue([assignment]),
  };
}

it("normalizes dictionary input before persistence and rejects unsafe input", async () => {
  const port = makePort();
  const service = new TagService(port);
  expect(
    await service.createTag({
      projectId,
      tagId,
      key: "  Garden  ",
      label: "  Jardin 🌿  ",
    }),
  ).toEqual({ ok: true, value: tag });
  expect(port.createTag).toHaveBeenCalledWith({
    projectId,
    tagId,
    key: "garden",
    label: "Jardin 🌿",
  });
  expect(
    await service.createTag({ projectId, tagId, key: "-bad", label: "Safe" }),
  ).toEqual({ ok: false, error: "invalid_key" });
  expect(
    await service.renameTag({
      projectId,
      tagId,
      expectedRevision: 1,
      label: "bad\u0085label",
    }),
  ).toEqual({ ok: false, error: "invalid_label" });
  expect(port.changeTag).not.toHaveBeenCalled();
});

it("keeps explicit lifecycle actions and optimistic revisions", async () => {
  const port = makePort();
  const service = new TagService(port);
  expect(
    await service.softDeleteTag({ projectId, tagId, expectedRevision: 1 }),
  ).toEqual({ ok: true, value: { ...tag, revision: 2 } });
  expect(port.changeTag).toHaveBeenCalledWith({
    projectId,
    tagId,
    expectedRevision: 1,
    action: "soft_delete",
  });
  expect(
    await service.restoreTag({ projectId, tagId, expectedRevision: 0 }),
  ).toEqual({ ok: false, error: "invalid_revision" });
  vi.mocked(port.changeTag).mockRejectedValueOnce(
    new TagPersistenceError("conflict"),
  );
  expect(
    await service.restoreTag({ projectId, tagId, expectedRevision: 2 }),
  ).toEqual({ ok: false, error: "conflict" });
});

it("fails closed if an assignment cannot be matched to an active project tag", async () => {
  const port = makePort();
  const service = new TagService(port);
  expect(await service.listVenueTags(projectId, venueId)).toEqual({
    ok: true,
    value: [{ assignment, tag }],
  });
  vi.mocked(port.listActiveTags).mockResolvedValueOnce([]);
  expect(await service.listVenueTags(projectId, venueId)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
  expect(
    await service.linkVenueTag({
      projectId,
      venueId: "foreign",
      tagId,
      linkId,
    }),
  ).toEqual({ ok: false, error: "invalid_identity" });
});

it("validates both identifiers and the label before creating a tag", async () => {
  const port = makePort();
  const service = new TagService(port);
  for (const draft of [
    { projectId: "invalid", tagId, key: "garden", label: "Garden" },
    { projectId, tagId: "invalid", key: "garden", label: "Garden" },
  ]) {
    expect(await service.createTag(draft)).toEqual({
      ok: false,
      error: "invalid_identity",
    });
  }
  expect(
    await service.createTag({
      projectId,
      tagId,
      key: "garden",
      label: "\u0085",
    }),
  ).toEqual({ ok: false, error: "invalid_label" });
  vi.mocked(port.createTag).mockRejectedValueOnce(
    new TagPersistenceError("conflict"),
  );
  expect(
    await service.createTag({
      projectId,
      tagId,
      key: "garden",
      label: "Garden",
    }),
  ).toEqual({ ok: false, error: "conflict" });
  vi.mocked(port.createTag).mockRejectedValueOnce(new Error("network"));
  expect(
    await service.createTag({
      projectId,
      tagId,
      key: "garden",
      label: "Garden",
    }),
  ).toEqual({ ok: false, error: "persistence_failed" });
});

it("validates rename and restore preconditions and propagates lifecycle errors", async () => {
  const port = makePort();
  const service = new TagService(port);
  const base = { projectId, tagId, expectedRevision: 1 };
  expect(await service.renameTag({ ...base, label: " New name " })).toEqual({
    ok: true,
    value: { ...tag, revision: 2 },
  });
  expect(port.changeTag).toHaveBeenCalledWith({
    ...base,
    action: "rename",
    label: "New name",
  });
  expect(await service.renameTag({ ...base, label: "\u0085" })).toEqual({
    ok: false,
    error: "invalid_label",
  });
  expect(
    await service.renameTag({ ...base, expectedRevision: 0, label: "Valid" }),
  ).toEqual({ ok: false, error: "invalid_revision" });
  expect(
    await service.renameTag({ ...base, projectId: "invalid", label: "Valid" }),
  ).toEqual({ ok: false, error: "invalid_identity" });
  expect(await service.softDeleteTag({ ...base, tagId: "invalid" })).toEqual({
    ok: false,
    error: "invalid_identity",
  });
  expect(await service.restoreTag({ ...base, projectId: "invalid" })).toEqual({
    ok: false,
    error: "invalid_identity",
  });
  expect(await service.restoreTag(base)).toEqual({
    ok: true,
    value: { ...tag, revision: 2 },
  });
  expect(port.changeTag).toHaveBeenCalledWith({ ...base, action: "restore" });
  vi.mocked(port.changeTag).mockRejectedValueOnce(new Error("network"));
  expect(await service.softDeleteTag(base)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

it("validates and returns current tag definitions", async () => {
  const port = makePort();
  const service = new TagService(port);
  expect(await service.listActiveTags("invalid")).toEqual({
    ok: false,
    error: "invalid_identity",
  });
  expect(await service.listActiveTags(projectId)).toEqual({
    ok: true,
    value: [tag],
  });
  vi.mocked(port.listActiveTags).mockRejectedValueOnce(
    new TagPersistenceError("persistence_failed"),
  );
  expect(await service.listActiveTags(projectId)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

it("validates and returns current Venue assignments", async () => {
  const port = makePort();
  const service = new TagService(port);
  const input = { projectId, venueId, tagId, linkId };
  expect(await service.linkVenueTag(input)).toEqual({
    ok: true,
    value: assignment,
  });
  expect(await service.unlinkVenueTag(input)).toEqual({
    ok: true,
    value: true,
  });
  for (const changed of [
    { projectId: "invalid" },
    { venueId: "invalid" },
    { tagId: "invalid" },
    { linkId: "invalid" },
  ]) {
    expect(await service.linkVenueTag({ ...input, ...changed })).toEqual({
      ok: false,
      error: "invalid_identity",
    });
    expect(await service.unlinkVenueTag({ ...input, ...changed })).toEqual({
      ok: false,
      error: "invalid_identity",
    });
  }
  vi.mocked(port.linkVenueTag).mockRejectedValueOnce(
    new TagPersistenceError("conflict"),
  );
  expect(await service.linkVenueTag(input)).toEqual({
    ok: false,
    error: "conflict",
  });
  vi.mocked(port.unlinkVenueTag).mockRejectedValueOnce(new Error("network"));
  expect(await service.unlinkVenueTag(input)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
  expect(await service.listVenueTags("invalid", venueId)).toEqual({
    ok: false,
    error: "invalid_identity",
  });
  expect(await service.listVenueTags(projectId, "invalid")).toEqual({
    ok: false,
    error: "invalid_identity",
  });
  vi.mocked(port.listVenueAssignments).mockRejectedValueOnce(
    new Error("network"),
  );
  expect(await service.listVenueTags(projectId, venueId)).toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

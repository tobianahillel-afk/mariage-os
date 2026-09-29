import { expect, it } from "vitest";
import {
  parseProjectTagRow,
  parseVenueTagAssignmentRow,
} from "./parse-project-tag-row";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const tagId = "aa200000-0000-4000-8000-000000000001";
const venueId = "aa100000-0000-4000-8000-000000000001";
const otherVenueId = "bb100000-0000-4000-8000-000000000001";
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

it("binds a tag to expected project/identity and canonical data", () => {
  expect(parseProjectTagRow(tagRow, projectId, tagId)).toMatchObject({
    id: tagId,
    projectId,
    key: "garden",
    deletedAt: null,
  });
  expect(() =>
    parseProjectTagRow({ ...tagRow, project_id: otherProjectId }, projectId),
  ).toThrow();
  expect(() =>
    parseProjectTagRow({ ...tagRow, id: otherVenueId }, projectId, tagId),
  ).toThrow();
  expect(() =>
    parseProjectTagRow({ ...tagRow, key: "Garden" }, projectId),
  ).toThrow();
  expect(() =>
    parseProjectTagRow({ ...tagRow, label: "bad\nlabel" }, projectId),
  ).toThrow();
  expect(() =>
    parseProjectTagRow({ ...tagRow, revision: "1" }, projectId),
  ).toThrow();
});

it("rejects a substituted project, tag, target type or Venue", () => {
  expect(
    parseVenueTagAssignmentRow(linkRow, projectId, venueId, {
      linkId,
      tagId,
    }),
  ).toMatchObject({ projectId, tagId, venueId });
  for (const changed of [
    { project_id: otherProjectId },
    { tag_id: otherVenueId },
    { target_type: "vendor" },
    { target_id: otherVenueId },
    { id: otherVenueId },
  ]) {
    expect(() =>
      parseVenueTagAssignmentRow(
        { ...linkRow, ...changed },
        projectId,
        venueId,
        { linkId, tagId },
      ),
    ).toThrow();
  }
});

it("rejects malformed provider records before returning them to the caller", () => {
  for (const value of [null, [], "record"]) {
    expect(() => parseProjectTagRow(value, projectId)).toThrow();
  }
  for (const changed of [
    { id: "invalid" },
    { project_id: "invalid" },
    { revision: 0 },
    { deleted_at: "invalid" },
    { deleted_at: 4 },
  ]) {
    expect(() =>
      parseProjectTagRow({ ...tagRow, ...changed }, projectId),
    ).toThrow();
  }
  expect(
    parseProjectTagRow(
      { ...tagRow, deleted_at: "2026-09-29T00:00:00Z" },
      projectId,
    ).deletedAt,
  ).toBe("2026-09-29T00:00:00Z");
  expect(() => parseVenueTagAssignmentRow(null, projectId, venueId)).toThrow();
  expect(() =>
    parseVenueTagAssignmentRow(
      { ...linkRow, tag_id: "invalid" },
      projectId,
      venueId,
    ),
  ).toThrow();
  expect(() =>
    parseVenueTagAssignmentRow(
      { ...linkRow, id: "invalid" },
      projectId,
      venueId,
    ),
  ).toThrow();
  expect(() =>
    parseVenueTagAssignmentRow(linkRow, projectId, venueId, {
      linkId: otherVenueId,
    }),
  ).toThrow();
  expect(() =>
    parseVenueTagAssignmentRow(linkRow, projectId, venueId, {
      tagId: otherVenueId,
    }),
  ).toThrow();
  expect(parseVenueTagAssignmentRow(linkRow, projectId, venueId)).toMatchObject(
    { id: linkId },
  );
});

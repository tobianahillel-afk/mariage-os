import { expect, it } from "vitest";

import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  assertLocalVenueVisitDraftScope,
  createLocalVenueVisitDraftCachedRecord,
  parseLocalVenueVisitDraft,
  type LocalVenueVisitDraft,
} from "./local-venue-visit-draft";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const deviceId = "33333333-3333-4333-8333-333333333333";
const venueId = "d2111111-1111-4111-8111-111111111111";
const scope = createLocalProjectScope(userId, projectId, deviceId);

function draft(
  overrides: Partial<LocalVenueVisitDraft> = {},
): LocalVenueVisitDraft {
  return {
    venueId,
    projectId,
    userId,
    deviceId,
    draftRevision: 1,
    questionSetRevision: 1,
    questions: [
      {
        questionId: "access-loading",
        prompt: "Accès livraison praticable ?",
        response: null,
      },
      {
        questionId: "capacity-seated",
        prompt: "Capacité assise vérifiée ?",
        response: "180 personnes",
      },
    ],
    notes: "Vérifier le groupe électrogène.",
    measurements: [
      {
        key: "ceiling_height",
        value: 4.2,
        unit: "m",
      },
    ],
    personalRatingIntent: 4,
    createdAt: "2026-10-05T01:00:00.000Z",
    updatedAt: "2026-10-05T01:05:00.000Z",
    ...overrides,
  };
}

it("parses and serializes a valid Venue visit draft", () => {
  const expected = draft();
  expect(parseLocalVenueVisitDraft(expected)).toEqual(expected);
  expect(createLocalVenueVisitDraftCachedRecord(scope, expected)).toEqual({
    key: `venue_visit_draft:${venueId}`,
    recordType: "venue_visit_draft",
    entityId: venueId,
    projectId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: expected,
  });
});

it("accepts a null personal rating intent", () => {
  expect(
    parseLocalVenueVisitDraft(draft({ personalRatingIntent: null }))
      .personalRatingIntent,
  ).toBeNull();
});

it.each([
  ["primitive record", 4],
  ["null record", null],
  ["array record", []],
  ["non-string notes", { ...draft(), notes: 12 }],
  ["empty Venue id", { ...draft(), venueId: "" }],
  ["invalid Venue id", { ...draft(), venueId: "not-a-uuid" }],
  ["fractional draft revision", { ...draft(), draftRevision: 1.5 }],
  ["zero draft revision", { ...draft(), draftRevision: 0 }],
  ["fractional question-set revision", { ...draft(), questionSetRevision: 1.5 }],
  ["zero question-set revision", { ...draft(), questionSetRevision: 0 }],
  ["invalid timestamp", { ...draft(), createdAt: "not-a-date" }],
  [
    "non-canonical timestamp",
    { ...draft(), createdAt: "2026-10-05T01:00:00Z" },
  ],
  [
    "reversed timestamps",
    {
      ...draft(),
      createdAt: "2026-10-05T01:05:00.000Z",
      updatedAt: "2026-10-05T01:00:00.000Z",
    },
  ],
  ["non-array questions", { ...draft(), questions: "nope" }],
  [
    "invalid question record",
    { ...draft(), questions: [null] },
  ],
  [
    "empty question id",
    {
      ...draft(),
      questions: [{ questionId: "", prompt: "Question", response: null }],
    },
  ],
  [
    "empty question prompt",
    {
      ...draft(),
      questions: [{ questionId: "q", prompt: "", response: null }],
    },
  ],
  [
    "invalid question response",
    {
      ...draft(),
      questions: [{ questionId: "q", prompt: "Question", response: 42 }],
    },
  ],
  [
    "duplicate question ids",
    {
      ...draft(),
      questions: [
        { questionId: "q", prompt: "A", response: null },
        { questionId: "q", prompt: "B", response: null },
      ],
    },
  ],
  ["non-array measurements", { ...draft(), measurements: "nope" }],
  [
    "invalid measurement record",
    { ...draft(), measurements: [null] },
  ],
  [
    "empty measurement key",
    {
      ...draft(),
      measurements: [{ key: "", value: 1, unit: "m" }],
    },
  ],
  [
    "non-number measurement",
    {
      ...draft(),
      measurements: [{ key: "height", value: "4", unit: "m" }],
    },
  ],
  [
    "non-finite measurement",
    {
      ...draft(),
      measurements: [{ key: "height", value: Number.NaN, unit: "m" }],
    },
  ],
  [
    "empty measurement unit",
    {
      ...draft(),
      measurements: [{ key: "height", value: 4, unit: "" }],
    },
  ],
  [
    "duplicate measurement keys",
    {
      ...draft(),
      measurements: [
        { key: "height", value: 4, unit: "m" },
        { key: "height", value: 5, unit: "m" },
      ],
    },
  ],
  ["fractional rating", { ...draft(), personalRatingIntent: 4.5 }],
  ["rating below range", { ...draft(), personalRatingIntent: 0 }],
  ["rating above range", { ...draft(), personalRatingIntent: 6 }],
] as const)("rejects %s", (_label, value) => {
  expect(() => parseLocalVenueVisitDraft(value)).toThrow("Venue visit draft");
});

it.each([
  ["projectId", "41111111-1111-4111-8111-111111111111"],
  ["userId", "51111111-1111-4111-8111-111111111111"],
  ["deviceId", "61111111-1111-4111-8111-111111111111"],
] as const)("fails closed on foreign %s", (field, value) => {
  const parsed = parseLocalVenueVisitDraft({
    ...draft(),
    [field]: value,
  });
  expect(() => assertLocalVenueVisitDraftScope(parsed, scope)).toThrow(
    "another local scope",
  );
});

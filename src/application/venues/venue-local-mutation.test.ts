import { describe, expect, it } from "vitest";
import {
  createLocalProjectScope,
} from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";
import {
  retryableVenueMutation,
  retryableVenueVisitMutation,
  venueReplayCommand,
  VENUE_CORE_UPDATE_MUTATION,
  VENUE_STATUS_MUTATION,
  VENUE_VISIT_FACT_OBSERVATION_MUTATION,
  VENUE_VISIT_MEMBER_RATING_MUTATION,
  VENUE_VISIT_NOTE_MUTATION,
} from "@application/venues/venue-local-mutation";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const venueId = "44444444-4444-4444-8444-444444444444";
const operationId = "55555555-5555-4555-8555-555555555555";
const createdAt = "2026-09-29T17:30:00.000Z";

function mutation(
  mutationType = VENUE_CORE_UPDATE_MUTATION,
  payload: PendingMutationEnvelope["payload"] = {
    name: "Venue Local",
    code: null,
    websiteUrl: "https://example.invalid",
    city: "Paris",
  },
): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType,
    baseRevision: "2",
    payload,
    createdAt,
    priorityClass: "essential_structured",
  });
}

describe("Venue persisted mutation replay commands", () => {
  it("reconstructs core and rejected-status commands", () => {
    expect(venueReplayCommand(mutation(), scope)).toEqual({
      kind: "core",
      input: {
        projectId: scope.projectId,
        venueId,
        expectedRevision: 2,
        operationId,
        deviceId: scope.deviceId,
        name: "Venue Local",
        code: null,
        websiteUrl: "https://example.invalid",
        city: "Paris",
      },
    });
    expect(
      venueReplayCommand(
        mutation(VENUE_STATUS_MUTATION, {
          status: "rejected",
          rejectionReason: "Too small",
        }),
        scope,
      ),
    ).toMatchObject({
      kind: "status",
      input: { status: "rejected", rejectionReason: "Too small" },
    });
  });

  it("accepts non-rejected status with null reason", () => {
    expect(
      venueReplayCommand(
        mutation(VENUE_STATUS_MUTATION, {
          status: "shortlist",
          rejectionReason: null,
        }),
        scope,
      ),
    ).toMatchObject({
      kind: "status",
      input: { status: "shortlist", rejectionReason: null },
    });
  });
});

describe("Venue persisted mutation scope validation", () => {
  it.each([
    ["project", { projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
    ["user", { userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }],
    ["device", { deviceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }],
    ["entity type", { entityType: "project_preferences" }],
    ["null entity", { entityId: null }],
  ] as const)("rejects foreign or invalid %s scope", (_label, patch) => {
    expect(() =>
      venueReplayCommand({ ...mutation(), ...patch }, scope),
    ).toThrow("Invalid persisted Venue mutation");
  });
});

describe("Venue persisted mutation payload validation", () => {
  it.each([
    ["number payload", { payload: 7 }],
    ["null payload", { payload: null }],
    ["array payload", { payload: [] }],
    ["null revision", { baseRevision: null }],
    ["zero revision", { baseRevision: "0" }],
    ["unsafe revision", { baseRevision: "9007199254740992" }],
    ["unknown command", { mutationType: "unknown_command" }],
  ] as const)("rejects %s", (_label, patch) => {
    expect(() =>
      venueReplayCommand({ ...mutation(), ...patch }, scope),
    ).toThrow("Invalid persisted Venue mutation");
  });

  it.each([
    [
      "non-string core name",
      { name: 1, code: null, websiteUrl: null, city: null },
    ],
    [
      "non-string nullable core value",
      { name: "Venue", code: 3, websiteUrl: null, city: null },
    ],
    ["non-string status", { status: 4, rejectionReason: null }],
    ["unknown status", { status: "not_a_status", rejectionReason: null }],
    ["rejected without reason", { status: "rejected", rejectionReason: null }],
    ["non-rejected with reason", { status: "shortlist", rejectionReason: "x" }],
    ["non-string reason", { status: "rejected", rejectionReason: 7 }],
  ] as const)("rejects %s", (_label, payload) => {
    const type =
      "name" in payload ? VENUE_CORE_UPDATE_MUTATION : VENUE_STATUS_MUTATION;
    expect(() => venueReplayCommand(mutation(type, payload), scope)).toThrow(
      "Invalid persisted Venue mutation",
    );
  });
});

describe("Venue pending mutation retry classification", () => {
  it.each(["pending", "sending", "failed_retryable"] as const)(
    "retries %s Venue mutation",
    (status) => {
      expect(retryableVenueMutation({ ...mutation(), status })).toBe(true);
    },
  );

  it.each(["conflict", "failed_permanent"] as const)(
    "does not retry %s Venue mutation",
    (status) => {
      expect(retryableVenueMutation({ ...mutation(), status })).toBe(false);
    },
  );

  it("does not retry another entity type", () => {
    expect(
      retryableVenueMutation({
        ...mutation(),
        entityType: "project_preferences",
      }),
    ).toBe(false);
  });
});

describe("Venue visit persisted mutation replay commands", () => {
  it("reconstructs note, fact-observation and member-rating commands", () => {
    const noteOperationId = "61111111-1111-4111-8111-111111111111";
    const factOperationId = "62222222-2222-4222-8222-222222222222";
    const ratingOperationId = "63333333-3333-4333-8333-333333333333";

    expect(
      venueReplayCommand(
        createPendingMutationEnvelope(scope, {
          operationId: noteOperationId,
          entityType: "venue",
          entityId: venueId,
          mutationType: VENUE_VISIT_NOTE_MUTATION,
          baseRevision: null,
          payload: {
            interactionId: noteOperationId,
            contactId: "64444444-4444-4444-8444-444444444444",
            interactionType: "in_person_visit_note",
            occurredAt: createdAt,
            summary: "Accès traiteur à confirmer.",
            nextFollowUpAt: "2026-09-30T17:30:00.000Z",
            sourceId: "65555555-5555-4555-8555-555555555555",
          },
          createdAt,
          priorityClass: "essential_structured",
        }),
        scope,
      ),
    ).toMatchObject({
      kind: "visit_note",
      input: {
        projectId: scope.projectId,
        venueId,
        interactionId: noteOperationId,
        contactId: "64444444-4444-4444-8444-444444444444",
        sourceId: "65555555-5555-4555-8555-555555555555",
      },
    });

    expect(
      venueReplayCommand(
        createPendingMutationEnvelope(scope, {
          operationId: factOperationId,
          entityType: "venue",
          entityId: venueId,
          mutationType: VENUE_VISIT_FACT_OBSERVATION_MUTATION,
          baseRevision: null,
          payload: {
            factId: "66666666-6666-4666-8666-666666666666",
            observationId: factOperationId,
            value: 12.5,
            rawValueText: "12.5 m",
            evidenceLevel: "observed",
            confidence: "high",
            observedAt: createdAt,
            note: "Mesuré sur place.",
            supersedesObservationId:
              "67777777-7777-4777-8777-777777777777",
          },
          createdAt,
          priorityClass: "essential_structured",
        }),
        scope,
      ),
    ).toMatchObject({
      kind: "fact_observation",
      input: {
        projectId: scope.projectId,
        factId: "66666666-6666-4666-8666-666666666666",
        observationId: factOperationId,
        supersedesObservationId:
          "67777777-7777-4777-8777-777777777777",
      },
    });

    expect(
      venueReplayCommand(
        createPendingMutationEnvelope(scope, {
          operationId: ratingOperationId,
          entityType: "venue",
          entityId: venueId,
          mutationType: VENUE_VISIT_MEMBER_RATING_MUTATION,
          baseRevision: "0",
          payload: {
            dimensionKey: "love_score",
            rating: 8.5,
            expectedRevision: 0,
          },
          createdAt,
          priorityClass: "essential_structured",
        }),
        scope,
      ),
    ).toEqual({
      kind: "member_rating",
      input: {
        projectId: scope.projectId,
        venueId,
        dimensionKey: "love_score",
        rating: 8.5,
        expectedRevision: 0,
        operationId: ratingOperationId,
        deviceId: scope.deviceId,
      },
    });
  });

  it.each([
    [
      "note base revision",
      VENUE_VISIT_NOTE_MUTATION,
      "1",
      {
        interactionId: operationId,
        contactId: null,
        interactionType: "in_person_visit_note",
        occurredAt: createdAt,
        summary: "x",
        nextFollowUpAt: null,
        sourceId: null,
      },
    ],
    [
      "note identity mismatch",
      VENUE_VISIT_NOTE_MUTATION,
      null,
      {
        interactionId: "69999999-9999-4999-8999-999999999999",
        contactId: null,
        interactionType: "in_person_visit_note",
        occurredAt: createdAt,
        summary: "x",
        nextFollowUpAt: null,
        sourceId: null,
      },
    ],
    [
      "fact identity mismatch",
      VENUE_VISIT_FACT_OBSERVATION_MUTATION,
      null,
      {
        factId: "66666666-6666-4666-8666-666666666666",
        observationId: "69999999-9999-4999-8999-999999999999",
        value: 1,
        rawValueText: null,
        evidenceLevel: "observed",
        confidence: "high",
        observedAt: createdAt,
        note: null,
        supersedesObservationId: null,
      },
    ],
    [
      "rating revision mismatch",
      VENUE_VISIT_MEMBER_RATING_MUTATION,
      "1",
      {
        dimensionKey: "love_score",
        rating: 8,
        expectedRevision: 0,
      },
    ],
    [
      "rating non-finite",
      VENUE_VISIT_MEMBER_RATING_MUTATION,
      "0",
      {
        dimensionKey: "love_score",
        rating: Number.NaN,
        expectedRevision: 0,
      },
    ],
    [
      "rating invalid expected revision",
      VENUE_VISIT_MEMBER_RATING_MUTATION,
      "0",
      {
        dimensionKey: "love_score",
        rating: 8,
        expectedRevision: -1,
      },
    ],
  ] as const)(
    "rejects invalid visit %s",
    (_label, mutationType, baseRevisionValue, payload) => {
      expect(() =>
        venueReplayCommand(
          {
            ...mutation(mutationType, payload),
            baseRevision: baseRevisionValue,
          },
          scope,
        ),
      ).toThrow("Invalid persisted Venue mutation");
    },
  );

  it.each([
    [VENUE_VISIT_NOTE_MUTATION, null],
    [VENUE_VISIT_FACT_OBSERVATION_MUTATION, null],
    [VENUE_VISIT_MEMBER_RATING_MUTATION, "0"],
  ] as const)(
    "classifies %s as visit-only retry work",
    (mutationType, revision) => {
      const candidate = {
        ...mutation(mutationType, {}),
        baseRevision: revision,
      };
      expect(retryableVenueMutation(candidate)).toBe(false);
      expect(retryableVenueVisitMutation(candidate)).toBe(true);
      expect(
        retryableVenueVisitMutation({ ...candidate, status: "conflict" }),
      ).toBe(false);
    },
  );
});

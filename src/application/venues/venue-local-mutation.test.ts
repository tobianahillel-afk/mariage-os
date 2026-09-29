import { describe, expect, it } from "vitest";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";
import {
  retryableVenueMutation,
  venueReplayCommand,
  VENUE_CORE_UPDATE_MUTATION,
  VENUE_STATUS_MUTATION,
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

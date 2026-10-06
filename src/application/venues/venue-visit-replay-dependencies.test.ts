import { describe, expect, it } from "vitest";

import {
  retryableVenueVisitMutation,
  venueReplayCommand,
} from "@application/venues/venue-local-mutation";
import {
  addReplayFailureBlockers,
  createReplayDependencyBlockers,
  hasReplayBlockedDependency,
  orderStructuredReplayEntries,
  type StructuredReplayEntry,
  type StructuredVenueReplayCommand,
} from "@application/venues/venue-visit-replay-dependencies";
import type { PendingMutationEnvelope } from "@application/local-data/local-records";
import {
  factMutation,
  noteMutation,
  ratingMutation,
  scope,
  venueId,
} from "../../../tests/support/venue-visit-structured-replay-test-support";

function entry(mutation: PendingMutationEnvelope): StructuredReplayEntry {
  return {
    mutation,
    command: venueReplayCommand(
      mutation,
      scope,
    ) as StructuredVenueReplayCommand,
  };
}

describe("structured replay dependency ordering", () => {
  it("orders independent entries by timestamp then operation id", () => {
    const early = entry(
      noteMutation(
        "11111111-1111-4111-8111-111111111113",
        "2026-10-06T11:59:00.000Z",
      ),
    );
    const sameTimeHigh = entry(
      noteMutation(
        "f1111111-1111-4111-8111-111111111111",
        "2026-10-06T12:00:00.000Z",
      ),
    );
    const sameTimeLow = entry(
      noteMutation(
        "11111111-1111-4111-8111-111111111111",
        "2026-10-06T12:00:00.000Z",
      ),
    );

    expect(
      orderStructuredReplayEntries([sameTimeHigh, sameTimeLow, early]).map(
        (candidate) => candidate.mutation.operationId,
      ),
    ).toEqual([
      early.mutation.operationId,
      sameTimeLow.mutation.operationId,
      sameTimeHigh.mutation.operationId,
    ]);
  });

  it("orders Fact supersession and Rating revisions before UUID tie-breaking", () => {
    const timestamp = "2026-10-06T12:00:00.000Z";
    const factFirstId = "f2222222-2222-4222-8222-222222222222";
    const factSecondId = "12222222-2222-4222-8222-222222222222";
    const ratingFirstId = "f3333333-3333-4333-8333-333333333333";
    const ratingSecondId = "13333333-3333-4333-8333-333333333333";

    const factFirst = entry(factMutation(factFirstId, timestamp));
    const factSecond = entry(
      factMutation(factSecondId, timestamp, factFirstId),
    );
    const ratingFirst = entry(
      ratingMutation(ratingFirstId, timestamp, "love_score", 0),
    );
    const ratingSecond = entry(
      ratingMutation(ratingSecondId, timestamp, "love_score", 1),
    );

    const ordered = orderStructuredReplayEntries([
      factSecond,
      ratingSecond,
      factFirst,
      ratingFirst,
    ]).map((candidate) => candidate.mutation.operationId);

    expect(ordered.indexOf(factFirstId)).toBeLessThan(
      ordered.indexOf(factSecondId),
    );
    expect(ordered.indexOf(ratingFirstId)).toBeLessThan(
      ordered.indexOf(ratingSecondId),
    );
  });

  it("does not invent dependencies across unrelated Rating series or command kinds", () => {
    const timestamp = "2026-10-06T12:00:00.000Z";
    const note = entry(
      noteMutation("21111111-1111-4111-8111-111111111111", timestamp),
    );
    const love = entry(
      ratingMutation(
        "31111111-1111-4111-8111-111111111111",
        timestamp,
        "love_score",
        2,
      ),
    );
    const logistics = entry(
      ratingMutation(
        "41111111-1111-4111-8111-111111111111",
        timestamp,
        "logistics_score",
        0,
      ),
    );

    expect(
      orderStructuredReplayEntries([love, note, logistics]),
    ).toHaveLength(3);
  });

  it("marks a corrupt Fact dependency cycle invalid instead of replaying arbitrarily", () => {
    const timestamp = "2026-10-06T12:00:00.000Z";
    const firstId = "52222222-2222-4222-8222-222222222222";
    const secondId = "62222222-2222-4222-8222-222222222222";
    const first = entry(factMutation(firstId, timestamp, secondId));
    const second = entry(factMutation(secondId, timestamp, firstId));

    const ordered = orderStructuredReplayEntries([first, second]);

    expect(ordered).toHaveLength(2);
    expect(ordered.every((candidate) => candidate.command === null)).toBe(true);
  });

  it("keeps an already-invalid entry orderable without making it a dependency", () => {
    const mutation = noteMutation(
      "71111111-1111-4111-8111-111111111111",
      "2026-10-06T12:00:00.000Z",
    );
    const invalid: StructuredReplayEntry = { mutation, command: null };
    const valid = entry(
      noteMutation(
        "81111111-1111-4111-8111-111111111111",
        "2026-10-06T12:01:00.000Z",
      ),
    );

    expect(orderStructuredReplayEntries([valid, invalid])).toEqual([
      invalid,
      valid,
    ]);
  });
});

describe("structured replay dependency blockers", () => {
  it("retains malformed and Fact failures as Fact-operation blockers", () => {
    const blockers = createReplayDependencyBlockers();
    const malformedMutation = noteMutation(
      "91111111-1111-4111-8111-111111111111",
    );
    const malformed: StructuredReplayEntry = {
      mutation: malformedMutation,
      command: null,
    };
    const fact = entry(
      factMutation("a2222222-2222-4222-8222-222222222222"),
    );

    addReplayFailureBlockers(blockers, malformed);
    addReplayFailureBlockers(blockers, fact);

    expect(blockers.factOperationIds).toEqual(
      new Set([malformedMutation.operationId, fact.mutation.operationId]),
    );
  });

  it("keeps the earliest failed Rating revision as the series floor", () => {
    const blockers = createReplayDependencyBlockers();
    const later = entry(
      ratingMutation(
        "a3333333-3333-4333-8333-333333333333",
        "2026-10-06T12:00:00.000Z",
        "love_score",
        3,
      ),
    );
    const earlier = entry(
      ratingMutation(
        "b3333333-3333-4333-8333-333333333333",
        "2026-10-06T12:01:00.000Z",
        "love_score",
        1,
      ),
    );
    const newest = entry(
      ratingMutation(
        "c3333333-3333-4333-8333-333333333333",
        "2026-10-06T12:02:00.000Z",
        "love_score",
        4,
      ),
    );
    const note = entry(
      noteMutation("d1111111-1111-4111-8111-111111111111"),
    );

    addReplayFailureBlockers(blockers, later);
    addReplayFailureBlockers(blockers, earlier);
    addReplayFailureBlockers(blockers, newest);
    addReplayFailureBlockers(blockers, note);

    expect(
      blockers.ratingRevisionFloor.get(`${venueId}:love_score`),
    ).toBe(1);
  });

  it("detects blocked Fact supersession and Rating revisions while allowing unrelated work", () => {
    const blockers = createReplayDependencyBlockers();
    const predecessorId = "e2222222-2222-4222-8222-222222222222";
    const predecessor = entry(factMutation(predecessorId));
    const successor = entry(
      factMutation(
        "f2222222-2222-4222-8222-222222222222",
        "2026-10-06T12:01:00.000Z",
        predecessorId,
      ),
    );
    const independentFact = entry(
      factMutation("12222222-2222-4222-8222-222222222224"),
    );
    const ratingFloor = entry(
      ratingMutation(
        "23333333-3333-4333-8333-333333333333",
        "2026-10-06T12:00:00.000Z",
        "love_score",
        1,
      ),
    );
    const ratingBlocked = entry(
      ratingMutation(
        "33333333-3333-4333-8333-333333333334",
        "2026-10-06T12:01:00.000Z",
        "love_score",
        2,
      ),
    );
    const ratingBeforeFloor = entry(
      ratingMutation(
        "43333333-3333-4333-8333-333333333334",
        "2026-10-06T11:59:00.000Z",
        "love_score",
        0,
      ),
    );
    const ratingOtherSeries = entry(
      ratingMutation(
        "53333333-3333-4333-8333-333333333334",
        "2026-10-06T12:02:00.000Z",
        "logistics_score",
        2,
      ),
    );
    const note = entry(
      noteMutation("61111111-1111-4111-8111-111111111111"),
    );

    addReplayFailureBlockers(blockers, predecessor);
    addReplayFailureBlockers(blockers, ratingFloor);

    expect(
      hasReplayBlockedDependency(
        blockers,
        successor.command as StructuredVenueReplayCommand,
      ),
    ).toBe(true);
    expect(
      hasReplayBlockedDependency(
        blockers,
        independentFact.command as StructuredVenueReplayCommand,
      ),
    ).toBe(false);
    expect(
      hasReplayBlockedDependency(
        blockers,
        ratingBlocked.command as StructuredVenueReplayCommand,
      ),
    ).toBe(true);
    expect(
      hasReplayBlockedDependency(
        blockers,
        ratingBeforeFloor.command as StructuredVenueReplayCommand,
      ),
    ).toBe(false);
    expect(
      hasReplayBlockedDependency(
        blockers,
        ratingOtherSeries.command as StructuredVenueReplayCommand,
      ),
    ).toBe(false);
    expect(
      hasReplayBlockedDependency(
        blockers,
        note.command as StructuredVenueReplayCommand,
      ),
    ).toBe(false);
  });

  it("recognizes retryable fixtures used by dependency tests", () => {
    expect(retryableVenueVisitMutation(noteMutation())).toBe(true);
  });
});

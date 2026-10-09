import { expect, it } from "vitest";
import type { VenueFactObservationRecord } from "@application/facts/venue-fact-evidence-service";
import type { VenueInteractionRecord } from "@domain/venues/venue-interaction";
import type { VenueMemberRatingRecord } from "./venue-member-opinion-service";
import { VenueVisitStructuredReplayCoordinator } from "./venue-visit-structured-replay-coordinator";
import {
  MemoryLocalStore,
  RemoteHarness,
  factMutation,
  noteMutation,
  ratingMutation,
  seed,
} from "../../../tests/support/venue-visit-structured-replay-test-support";

it.each([
  ["note", noteMutation()],
  ["fact", factMutation()],
  ["rating", ratingMutation()],
] as const)(
  "retains a %s after a malformed successful null provider acknowledgement",
  async (_label, mutation) => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    await seed(local, mutation);

    const replay = new VenueVisitStructuredReplayCoordinator({
      local,
      interactions: {
        ...remote.interactions,
        appendVenueInteraction: async () =>
          null as unknown as VenueInteractionRecord,
      },
      facts: {
        ...remote.facts,
        appendObservation: async () =>
          null as unknown as VenueFactObservationRecord,
      },
      memberOpinions: {
        ...remote.memberOpinions,
        saveVenueRating: async () =>
          null as unknown as VenueMemberRatingRecord,
      },
      now: () => "2026-10-09T00:00:00.000Z",
    });

    await expect(replay.replayPending()).resolves.toEqual([
      {
        operationId: mutation.operationId,
        state: "failed_permanent",
        error: "provider_response_invalid",
      },
    ]);
    expect(local.pending.get(mutation.operationId)).toMatchObject({
      status: "failed_permanent",
      lastErrorCode: "provider_response_invalid",
    });
    expect(local.pending.has(mutation.operationId)).toBe(true);
    expect(remote.factLinks).toHaveLength(0);
  },
);

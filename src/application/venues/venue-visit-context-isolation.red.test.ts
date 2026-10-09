import { expect, it } from "vitest";
import type { VenueFactContext } from "@application/facts/venue-fact-evidence-service";
import { VenueVisitStructuredReplayCoordinator } from "./venue-visit-structured-replay-coordinator";
import {
  MemoryLocalStore,
  RemoteHarness,
  factMutation,
  factOperationId,
  scope,
  seed,
} from "../../../tests/support/venue-visit-structured-replay-test-support";

const foreignId = "91111111-1111-4111-8111-111111111111";

it.each([
  {
    label: "project",
    corrupt: (context: VenueFactContext): VenueFactContext => ({
      ...context,
      projectId: foreignId,
    }),
  },
  {
    label: "fact identity",
    corrupt: (context: VenueFactContext): VenueFactContext => ({
      ...context,
      factId: foreignId,
    }),
  },
  {
    label: "definition project",
    corrupt: (context: VenueFactContext): VenueFactContext => ({
      ...context,
      definition: { ...context.definition, projectId: foreignId },
    }),
  },
])(
  "refuses a foreign %s in the provider's fact context before mutation",
  async ({ corrupt }) => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    await seed(local, factMutation());

    const replay = new VenueVisitStructuredReplayCoordinator({
      local,
      interactions: remote.interactions,
      facts: {
        ...remote.facts,
        getFactContext: async (projectId, factId) =>
          corrupt(await remote.facts.getFactContext(projectId, factId)),
      },
      memberOpinions: remote.memberOpinions,
      now: () => "2026-10-09T00:00:00.000Z",
    });

    await expect(replay.replayPending()).resolves.toEqual([
      {
        operationId: factOperationId,
        state: "failed_permanent",
        error: "provider_response_invalid",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
    expect(remote.factLinks).toHaveLength(0);
    expect(local.pending.get(factOperationId)).toMatchObject({
      status: "failed_permanent",
      lastErrorCode: "provider_response_invalid",
    });
  },
);

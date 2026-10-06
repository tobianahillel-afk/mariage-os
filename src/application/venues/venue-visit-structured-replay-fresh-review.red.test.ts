import { describe, expect, it } from "vitest";
import { VenueFactPersistenceError } from "@application/facts/venue-fact-persistence-error";
import {
  MemoryLocalStore,
  RemoteHarness,
  coordinator,
  factMutation,
  factOperationId,
  ratingMutation,
  ratingOperationId,
  seed,
} from "../../../tests/support/venue-visit-structured-replay-test-support";

describe("Venue visit structured replay retained dependency blockers", () => {
  it("keeps a superseding Fact blocked when its predecessor is already conflict", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const secondId = "12222222-2222-4222-8222-222222222223";
    const first = {
      ...factMutation(factOperationId, "2026-10-06T12:02:00.000Z"),
      status: "conflict" as const,
      lastErrorCode: "conflict",
    };
    const second = {
      ...factMutation(secondId, "2026-10-06T12:03:00.000Z", factOperationId),
      status: "failed_retryable" as const,
      lastErrorCode: "dependency_pending",
    };
    await seed(local, first, second);

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: secondId,
        state: "pending",
        error: "dependency_pending",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
  });

  it("keeps a later rating blocked when its predecessor is already permanent", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const secondId = "13333333-3333-4333-8333-333333333334";
    const first = {
      ...ratingMutation(
        ratingOperationId,
        "2026-10-06T12:02:00.000Z",
        "love_score",
        0,
      ),
      status: "failed_permanent" as const,
      lastErrorCode: "replay_identity_mismatch",
    };
    const second = {
      ...ratingMutation(secondId, "2026-10-06T12:03:00.000Z", "love_score", 1),
      status: "failed_retryable" as const,
      lastErrorCode: "dependency_pending",
    };
    await seed(local, first, second);

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: secondId,
        state: "pending",
        error: "dependency_pending",
      },
    ]);
    expect(remote.ratings).toHaveLength(0);
  });
});

describe("Venue visit structured replay dependency ordering", () => {
  it("orders a Fact predecessor before its superseder at the same timestamp", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const firstId = "f2222222-2222-4222-8222-222222222222";
    const secondId = "12222222-2222-4222-8222-222222222222";
    const timestamp = "2026-10-06T12:04:00.000Z";
    await seed(
      local,
      factMutation(secondId, timestamp, firstId),
      factMutation(firstId, timestamp),
    );

    await coordinator(local, remote).replayPending();

    expect(
      remote.observations.map(
        (entry) => (entry as { readonly observationId: string }).observationId,
      ),
    ).toEqual([firstId, secondId]);
  });

  it("orders rating revisions before UUID tie-breaking at the same timestamp", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const firstId = "f3333333-3333-4333-8333-333333333333";
    const secondId = "13333333-3333-4333-8333-333333333333";
    const timestamp = "2026-10-06T12:05:00.000Z";
    await seed(
      local,
      ratingMutation(secondId, timestamp, "love_score", 1),
      ratingMutation(firstId, timestamp, "love_score", 0),
    );

    await coordinator(local, remote).replayPending();

    expect(remote.ratings.map((entry) => entry.operationId)).toEqual([
      firstId,
      secondId,
    ]);
  });
});

describe("Venue visit structured replay source provenance", () => {
  it("fails permanently when the persisted source is not an in-person visit", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.factSourceType = "official_website";
    await seed(local, factMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: factOperationId,
        state: "failed_permanent",
        error: "fact_source_type_mismatch",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
    expect(remote.factLinks).toHaveLength(0);
    expect(local.pending.get(factOperationId)).toMatchObject({
      status: "failed_permanent",
      lastErrorCode: "fact_source_type_mismatch",
    });
  });
});


describe("Venue visit structured replay source-read trust boundary", () => {
  it.each([
    [
      "project",
      "99999999-9999-4999-8999-999999999999",
      null,
    ],
    [
      "source",
      null,
      "98888888-8888-4888-8888-888888888888",
    ],
  ] as const)(
    "fails permanently when the provider returns another %s identity",
    async (_label, projectOverride, sourceOverride) => {
      const local = new MemoryLocalStore();
      const remote = new RemoteHarness();
      remote.factSourceProjectIdOverride = projectOverride;
      remote.factSourceIdOverride = sourceOverride;
      await seed(local, factMutation());

      await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
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

  it("keeps the measurement pending when source lookup is temporarily unavailable", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.factSourceReadError = new VenueFactPersistenceError(
      "backend_unavailable",
      "offline",
    );
    await seed(local, factMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: factOperationId,
        state: "pending",
        error: "backend_unavailable",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
    expect(local.pending.get(factOperationId)).toMatchObject({
      status: "failed_retryable",
      lastErrorCode: "backend_unavailable",
    });
  });

  it("maps an unknown source lookup failure to retryable persistence failure", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.factSourceReadError = new Error("provider");
    await seed(local, factMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: factOperationId,
        state: "pending",
        error: "persistence_failed",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
    expect(local.pending.get(factOperationId)).toMatchObject({
      status: "failed_retryable",
      lastErrorCode: "persistence_failed",
    });
  });
});

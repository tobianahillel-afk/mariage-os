import { describe, expect, it } from "vitest";
import {
  MemoryLocalStore,
  RemoteHarness,
  coordinator,
  factId,
  factMutation,
  factSourceId,
  factOperationId,
  noteId,
  noteMutation,
  ratingMutation,
  ratingOperationId,
  scope,
  seed,
  venueId,
} from "../../../tests/support/venue-visit-structured-replay-test-support";

describe("Venue visit structured replay success", () => {
  it("replays note, measurement and rating in durable queue order", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    await seed(local, ratingMutation(), noteMutation(), factMutation());

    const result = await coordinator(local, remote).replayPending();

    expect(result.map((entry) => entry.state)).toEqual([
      "synced",
      "synced",
      "synced",
    ]);
    expect(remote.calls).toEqual([
      `note:${noteId}`,
      `fact:${factOperationId}`,
      `link:${factOperationId}:${factSourceId}`,
      `rating:${ratingOperationId}`,
    ]);
    expect(remote.notes[0]).toMatchObject({
      projectId: scope.projectId,
      venueId,
      interactionId: noteId,
    });
    expect(remote.observations[0]).toMatchObject({
      projectId: scope.projectId,
      factId,
      observationId: factOperationId,
    });
    expect(remote.factLinks[0]).toEqual({
      projectId: scope.projectId,
      observationId: factOperationId,
      sourceId: factSourceId,
      isPrimary: true,
    });
    expect(remote.ratings[0]).toMatchObject({
      projectId: scope.projectId,
      venueId,
      operationId: ratingOperationId,
      deviceId: scope.deviceId,
    });
    expect(local.pending.size).toBe(0);
  });

  it("uses operation id as deterministic tie-break for equal timestamps", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const first = "10000000-0000-4000-8000-000000000001";
    const second = "f0000000-0000-4000-8000-000000000001";
    const timestamp = "2026-10-06T12:00:00.000Z";
    await seed(
      local,
      noteMutation(second, timestamp),
      noteMutation(first, timestamp),
    );

    await coordinator(local, remote).replayPending();

    expect(remote.notes.map((input) => input.interactionId)).toEqual([
      first,
      second,
    ]);
  });
});

describe("Venue visit structured replay dependencies", () => {
  it("blocks a superseding Fact observation while its predecessor is retryable", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const secondId = "62222222-2222-4222-8222-222222222223";
    remote.factMode = "backend_unavailable";
    await seed(
      local,
      factMutation(),
      factMutation(secondId, "2026-10-06T12:02:00.000Z", factOperationId),
    );

    const result = await coordinator(local, remote).replayPending();

    expect(result).toEqual([
      {
        operationId: factOperationId,
        state: "pending",
        error: "backend_unavailable",
      },
      {
        operationId: secondId,
        state: "pending",
        error: "dependency_pending",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
    expect(local.pending.get(secondId)).toMatchObject({
      status: "failed_retryable",
      lastErrorCode: "dependency_pending",
    });
  });
});

describe("Venue visit structured replay rating dependencies", () => {
  it("blocks a later rating revision after an earlier retryable failure", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const secondId = "63333333-3333-4333-8333-333333333334";
    remote.ratingMode = "failure";
    await seed(
      local,
      ratingMutation(),
      ratingMutation(secondId, "2026-10-06T12:03:00.000Z", "love_score", 1),
    );

    const result = await coordinator(local, remote).replayPending();

    expect(result.map((entry) => [entry.operationId, entry.error])).toEqual([
      [ratingOperationId, "persistence_failed"],
      [secondId, "dependency_pending"],
    ]);
    expect(remote.ratings).toHaveLength(1);
    expect(local.pending.get(secondId)).toMatchObject({
      status: "failed_retryable",
      lastErrorCode: "dependency_pending",
    });
  });

  it("continues a provably independent note after a Fact retryable failure", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.factMode = "backend_unavailable";
    await seed(
      local,
      factMutation(),
      noteMutation(noteId, "2026-10-06T12:03:00.000Z"),
    );

    const result = await coordinator(local, remote).replayPending();

    expect(result.map((entry) => entry.state)).toEqual(["pending", "synced"]);
    expect(remote.notes).toHaveLength(1);
  });
});

describe("Venue visit structured replay note failures", () => {
  it("retains a replay-conflicting note as conflict", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.noteMode = "conflict";
    await seed(local, noteMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: noteId,
        state: "conflict",
        error: "replay_conflict",
      },
    ]);
    expect(local.pending.get(noteId)).toMatchObject({
      status: "conflict",
      lastErrorCode: "replay_conflict",
    });
  });

  it("marks an invalid normalized note permanent before persistence", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const candidate = noteMutation();
    await seed(local, {
      ...candidate,
      payload: {
        ...(candidate.payload as Record<string, unknown>),
        interactionType: "",
      },
    });

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: noteId,
        state: "failed_permanent",
        error: "invalid_interaction_type",
      },
    ]);
    expect(remote.notes).toHaveLength(0);
    expect(local.pending.get(noteId)).toMatchObject({
      status: "failed_permanent",
      lastErrorCode: "invalid_interaction_type",
    });
  });

  it("retains a generic note provider failure as retryable", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.noteMode = "failure";
    await seed(local, noteMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: noteId,
        state: "pending",
        error: "persistence_failed",
      },
    ]);
    expect(local.pending.get(noteId)?.status).toBe("failed_retryable");
  });
});

describe("Venue visit structured replay Fact failures", () => {
  it.each([
    ["conflict", "conflict", "conflict"],
    ["backend_unavailable", "pending", "backend_unavailable"],
    ["persistence_failed", "pending", "persistence_failed"],
    ["authorization_failed", "failed_permanent", "authorization_failed"],
  ] as const)(
    "maps Fact %s safely",
    async (mode, expectedState, expectedError) => {
      const local = new MemoryLocalStore();
      const remote = new RemoteHarness();
      remote.factMode = mode;
      await seed(local, factMutation());

      await expect(coordinator(local, remote).replayPending()).resolves.toEqual(
        [
          {
            operationId: factOperationId,
            state: expectedState,
            error: expectedError,
          },
        ],
      );
    },
  );

  it("retains a Fact observation when its in-person source link cannot persist", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.factLinkMode = "persistence_failed";
    await seed(local, factMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: factOperationId,
        state: "pending",
        error: "persistence_failed",
      },
    ]);
    expect(remote.observations).toHaveLength(1);
    expect(remote.factLinks).toHaveLength(1);
    expect(local.pending.get(factOperationId)?.status).toBe("failed_retryable");
  });
});

describe("Venue visit structured replay rating failures", () => {
  it("retains a rating serialization conflict as conflict", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.ratingMode = "conflict";
    await seed(local, ratingMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: ratingOperationId,
        state: "conflict",
        error: "conflict",
      },
    ]);
    expect(local.pending.get(ratingOperationId)).toMatchObject({
      status: "conflict",
      lastErrorCode: "conflict",
    });
  });

  it("keeps rating provider failure retryable", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.ratingMode = "failure";
    await seed(local, ratingMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: ratingOperationId,
        state: "pending",
        error: "persistence_failed",
      },
    ]);
  });

  it("marks deterministic receipt mismatch permanent", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.ratingMode = "replay_identity_mismatch";
    await seed(local, ratingMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: ratingOperationId,
        state: "failed_permanent",
        error: "replay_identity_mismatch",
      },
    ]);
    expect(local.pending.get(ratingOperationId)?.status).toBe(
      "failed_permanent",
    );
  });
});

describe("Venue visit structured replay rating ACK validation", () => {
  it.each([
    ["author", { userId: "69999999-9999-4999-8999-999999999999" }],
    ["dimension", { dimensionKey: "logistics_score_personal" }],
    ["rating", { rating: 6 }],
    ["revision", { revision: 7 }],
  ] as const)(
    "retains the local rating when provider ACK has mismatched %s",
    async (_label, override) => {
      const local = new MemoryLocalStore();
      const remote = new RemoteHarness();
      remote.ratingResponseOverride = override;
      await seed(local, ratingMutation());

      await expect(coordinator(local, remote).replayPending()).resolves.toEqual(
        [
          {
            operationId: ratingOperationId,
            state: "failed_permanent",
            error: "provider_response_invalid",
          },
        ],
      );
      expect(local.pending.has(ratingOperationId)).toBe(true);
    },
  );
});

describe("Venue visit structured replay rating validation", () => {
  it("marks invalid rating intent permanent before provider mutation", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    await seed(
      local,
      ratingMutation(ratingOperationId, undefined, "typo_score"),
    );

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: ratingOperationId,
        state: "failed_permanent",
        error: "rating_dimension_invalid",
      },
    ]);
    expect(remote.ratings).toHaveLength(0);
  });
});

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
      ...factMutation(
        secondId,
        "2026-10-06T12:03:00.000Z",
        factOperationId,
      ),
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
      ...ratingMutation(
        secondId,
        "2026-10-06T12:03:00.000Z",
        "love_score",
        1,
      ),
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

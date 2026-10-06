import { describe, expect, it } from "vitest";
import {
  MemoryLocalStore,
  RemoteHarness,
  coordinator,
  factId,
  factMutation,
  factOperationId,
  noteId,
  noteMutation,
  ratingMutation,
  ratingOperationId,
  scope,
  seed,
  venueId,
} from "./venue-visit-structured-replay-test-support";

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

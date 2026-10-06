import { describe, expect, it } from "vitest";
import {
  MemoryLocalStore,
  RemoteHarness,
  coordinator,
  factMutation,
  factOperationId,
  noteId,
  noteMutation,
  seed,
} from "./venue-visit-structured-replay-test-support";

describe("Venue visit structured replay scope validation", () => {
  it("fails closed when the fact belongs to another Venue", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.factVenueId = "48888888-8888-4888-8888-888888888888";
    await seed(local, factMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: factOperationId,
        state: "failed_permanent",
        error: "fact_scope_mismatch",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
    expect(local.pending.get(factOperationId)?.status).toBe("failed_permanent");
  });

  it("keeps an unclassified fact-context failure retryable", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.factMode = "context_failure";
    await seed(local, factMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: factOperationId,
        state: "pending",
        error: "persistence_failed",
      },
    ]);
    expect(remote.observations).toHaveLength(0);
    expect(local.pending.get(factOperationId)?.status).toBe("failed_retryable");
  });
});

describe("Venue visit structured replay local validation", () => {
  it("marks corrupt persisted commands permanent without network dispatch", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    const corrupt = {
      ...noteMutation(),
      payload: {
        ...(noteMutation().payload as Record<string, unknown>),
        interactionId: "69999999-9999-4999-8999-999999999999",
      },
    };
    await seed(local, corrupt);

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: noteId,
        state: "failed_permanent",
        error: "invalid_local_mutation",
      },
    ]);
    expect(remote.calls).toHaveLength(0);
  });
});

describe("Venue visit structured replay local write durability", () => {
  it("does not send when the sending-state write is not durable", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    local.failPutCalls.add(1);
    await seed(local, noteMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: noteId,
        state: "pending",
        error: "local_durability_unavailable",
      },
    ]);
    expect(remote.calls).toHaveLength(0);
  });

  it("reports pending when a remote failure cannot be persisted locally", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    remote.noteMode = "failure";
    local.failPutCalls.add(2);
    await seed(local, noteMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: noteId,
        state: "pending",
        error: "local_durability_unavailable",
      },
    ]);
  });
});

describe("Venue visit structured replay settlement durability", () => {
  it("keeps the operation pending when acknowledged settlement cannot be removed", async () => {
    const local = new MemoryLocalStore();
    const remote = new RemoteHarness();
    local.failRemove = true;
    await seed(local, noteMutation());

    await expect(coordinator(local, remote).replayPending()).resolves.toEqual([
      {
        operationId: noteId,
        state: "pending",
        error: "settlement_pending",
      },
    ]);
    expect(local.pending.has(noteId)).toBe(true);
  });
});

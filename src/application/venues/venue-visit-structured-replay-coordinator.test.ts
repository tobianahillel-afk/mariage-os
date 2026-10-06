import { describe, expect, it } from "vitest";
import { VenueFactPersistenceError } from "@application/facts/venue-fact-persistence-error";
import type {
  CreateVenueFactSourceInput,
  LinkObservationSourceInput,
  ResolveVenueFactObservationInput,
  UpdateVenueFactSourceInput,
  VenueFactContext,
  VenueFactEvidencePort,
  VenueFactObservationRecord,
} from "@application/facts/venue-fact-evidence-service";
import type {
  LocalProjectMetadata,
  LocalProjectStore,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type CachedRecordEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";
import { VenueInteractionPersistenceError } from "@application/venues/venue-interaction-persistence-error";
import type {
  NormalizedAppendVenueInteractionInput,
  VenueInteractionPort,
} from "@application/venues/venue-interaction-service";
import {
  VENUE_VISIT_FACT_OBSERVATION_MUTATION,
  VENUE_VISIT_MEMBER_RATING_MUTATION,
  VENUE_VISIT_NOTE_MUTATION,
} from "@application/venues/venue-local-mutation";
import { VenueMemberOpinionPersistenceError } from "@application/venues/venue-member-opinion-persistence-error";
import type {
  SaveVenueMemberPreferenceInput,
  SaveVenueMemberRatingInput,
  VenueMemberOpinionPort,
  VenueMemberRatingRecord,
} from "@application/venues/venue-member-opinion-service";
import { VenueVisitStructuredReplayCoordinator } from "@application/venues/venue-visit-structured-replay-coordinator";
import type { VenueInteractionRecord } from "@domain/venues/venue-interaction";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
const venueId = "44444444-4444-4444-8444-444444444444";
const factId = "55555555-5555-4555-8555-555555555555";
const noteId = "61111111-1111-4111-8111-111111111111";
const factOperationId = "62222222-2222-4222-8222-222222222222";
const ratingOperationId = "63333333-3333-4333-8333-333333333333";
const now = "2026-10-06T13:30:00.000Z";

class MemoryLocalStore implements LocalProjectStore {
  readonly scope = scope;
  readonly pending = new Map<string, PendingMutationEnvelope>();
  readonly cached = new Map<string, CachedRecordEnvelope>();
  readonly failPutCalls = new Set<number>();
  failRemove = false;
  putCalls = 0;

  async getMetadata(): Promise<LocalProjectMetadata> {
    return {
      key: "scope",
      localSchemaVersion: 2,
      appVersionLastOpened: "test",
      projectId: scope.projectId,
      userId: scope.userId,
      deviceId: scope.deviceId,
      lastSuccessfulSyncAt: null,
      backendSchemaVersionLastSeen: null,
      serviceWorkerBuildLastSeen: null,
    };
  }

  async putCachedRecord(record: CachedRecordEnvelope): Promise<void> {
    this.cached.set(record.key, record);
  }

  async putCachedRecordIfRefreshSafe(
    record: CachedRecordEnvelope,
  ): Promise<boolean> {
    this.cached.set(record.key, record);
    return true;
  }

  async getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null> {
    return this.cached.get(`${recordType}:${entityId}`) ?? null;
  }

  async listCachedRecords(
    recordType: string,
  ): Promise<readonly CachedRecordEnvelope[]> {
    return [...this.cached.values()].filter(
      (record) => record.recordType === recordType,
    );
  }

  async addPendingMutation(mutation: PendingMutationEnvelope): Promise<void> {
    this.pending.set(mutation.operationId, mutation);
  }

  async addPendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    this.pending.set(mutation.operationId, mutation);
    this.cached.set(record.key, record);
  }

  async putPendingMutation(
    mutation: PendingMutationEnvelope,
    record?: CachedRecordEnvelope,
  ): Promise<void> {
    this.putCalls += 1;
    if (this.failPutCalls.has(this.putCalls)) throw new Error("local write");
    this.pending.set(mutation.operationId, mutation);
    if (record !== undefined) this.cached.set(record.key, record);
  }

  async settlePendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void> {
    this.pending.delete(mutation.operationId);
    this.cached.set(record.key, record);
  }

  async removePendingMutation(operationId: string): Promise<void> {
    if (this.failRemove) throw new Error("local remove");
    this.pending.delete(operationId);
  }

  async getPendingMutation(
    operationId: string,
  ): Promise<PendingMutationEnvelope | null> {
    return this.pending.get(operationId) ?? null;
  }

  async listPendingMutations(): Promise<readonly PendingMutationEnvelope[]> {
    return [...this.pending.values()];
  }

  async readSyncCounters(): Promise<LocalSyncCounters> {
    return {
      pendingCount: this.pending.size,
      conflictCount: 0,
      retryableFailureCount: 0,
      permanentFailureCount: 0,
      unsyncedBinaryCount: 0,
    };
  }

  close(): void {}
}

type NoteMode = "success" | "conflict" | "failure";
type FactMode =
  | "success"
  | "conflict"
  | "backend_unavailable"
  | "context_failure"
  | "persistence_failed"
  | "authorization_failed";
type RatingMode = "success" | "failure" | "conflict";

class RemoteHarness {
  readonly calls: string[] = [];
  readonly notes: NormalizedAppendVenueInteractionInput[] = [];
  readonly observations: unknown[] = [];
  readonly ratings: SaveVenueMemberRatingInput[] = [];

  noteMode: NoteMode = "success";
  factMode: FactMode = "success";
  ratingMode: RatingMode = "success";
  factVenueId = venueId;

  readonly interactions: VenueInteractionPort = {
    appendVenueInteraction: async (input) => {
      this.calls.push(`note:${input.interactionId}`);
      this.notes.push(input);
      if (this.noteMode === "conflict") {
        throw new VenueInteractionPersistenceError("conflict", "replay");
      }
      if (this.noteMode === "failure") {
        throw new Error("provider");
      }
      return interactionRecord(input);
    },
    listVenueInteractionHistory: async () => [],
  };

  readonly facts: VenueFactEvidencePort = {
    getFactContext: async () => {
      if (this.factMode === "backend_unavailable") {
        throw new VenueFactPersistenceError("backend_unavailable", "offline");
      }
      if (this.factMode === "context_failure") {
        throw new Error("provider");
      }
      return factContext(this.factVenueId);
    },
    createSource: async (_input: CreateVenueFactSourceInput) => {
      throw new Error("not used");
    },
    updateSource: async (_input: UpdateVenueFactSourceInput) => {
      throw new Error("not used");
    },
    appendObservation: async (input) => {
      this.calls.push(`fact:${input.observationId}`);
      this.observations.push(input);
      if (this.factMode === "conflict") {
        throw new VenueFactPersistenceError("conflict", "replay");
      }
      if (this.factMode === "persistence_failed") {
        throw new VenueFactPersistenceError("persistence_failed", "provider");
      }
      if (this.factMode === "authorization_failed") {
        throw new VenueFactPersistenceError("authorization_failed", "denied");
      }
      return observationRecord(input);
    },
    linkObservationSource: async (_input: LinkObservationSourceInput) => {
      throw new Error("not used");
    },
    resolveFromObservation: async (
      _input: ResolveVenueFactObservationInput,
    ) => {
      throw new Error("not used");
    },
  };

  readonly memberOpinions: VenueMemberOpinionPort = {
    getOwnVenuePreference: async () => null,
    listVenueRatings: async () => [],
    saveVenuePreference: async (_input: SaveVenueMemberPreferenceInput) => {
      throw new Error("not used");
    },
    saveVenueRating: async (input) => {
      this.calls.push(`rating:${input.operationId}`);
      this.ratings.push(input);
      if (this.ratingMode === "conflict") {
        throw new VenueMemberOpinionPersistenceError(
          "conflict",
          "revision conflict",
        );
      }
      if (this.ratingMode === "failure") throw new Error("provider");
      return ratingRecord(input);
    },
  };
}

function factContext(contextVenueId = venueId): VenueFactContext {
  return {
    factId,
    projectId: scope.projectId,
    venueId: contextVenueId,
    definition: {
      id: "56666666-6666-4666-8666-666666666666",
      projectId: scope.projectId,
      entityType: "venue",
      systemDefined: false,
      revision: 1,
      key: "visit_width",
      label: "Visit width",
      valueType: "number",
      unit: "m",
      priority: "important",
      weight: 1,
      freshnessPolicy: null,
      optionsJson: null,
      evaluationRuleJson: null,
    },
  };
}

function observationRecord(
  input: Parameters<VenueFactEvidencePort["appendObservation"]>[0],
): VenueFactObservationRecord {
  return {
    id: input.observationId,
    projectId: input.projectId,
    factId: input.factId,
    value: input.value,
    rawValueText: input.rawValueText,
    evidenceLevel: input.evidenceLevel,
    confidence: input.confidence,
    observedAt: input.observedAt,
    note: input.note,
    status: "active",
    supersededByObservationId: null,
    createdBy: scope.userId,
  };
}

function interactionRecord(
  input: NormalizedAppendVenueInteractionInput,
): VenueInteractionRecord {
  return {
    id: input.interactionId,
    projectId: input.projectId,
    parentType: "venue",
    venueId: input.venueId,
    contactId: input.contactId,
    interactionType: input.interactionType,
    occurredAt: input.occurredAt,
    summary: input.summary,
    nextFollowUpAt: input.nextFollowUpAt,
    sourceId: input.sourceId,
    createdAt: now,
    createdBy: scope.userId,
    updatedAt: now,
    updatedBy: scope.userId,
    revision: 1,
  };
}

function ratingRecord(
  input: SaveVenueMemberRatingInput,
): VenueMemberRatingRecord {
  return {
    id: "67777777-7777-4777-8777-777777777777",
    projectId: input.projectId,
    userId: scope.userId,
    venueId: input.venueId,
    dimensionKey: input.dimensionKey,
    rating: input.rating,
    revision: input.expectedRevision + 1,
  };
}

function noteMutation(
  operationId = noteId,
  createdAt = "2026-10-06T12:00:00.000Z",
): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: VENUE_VISIT_NOTE_MUTATION,
    baseRevision: null,
    payload: {
      interactionId: operationId,
      contactId: null,
      interactionType: "in_person_visit_note",
      occurredAt: createdAt,
      summary: "Accès traiteur à confirmer.",
      nextFollowUpAt: null,
      sourceId: null,
    },
    createdAt,
    priorityClass: "essential_structured",
  });
}

function factMutation(
  operationId = factOperationId,
  createdAt = "2026-10-06T12:01:00.000Z",
): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: VENUE_VISIT_FACT_OBSERVATION_MUTATION,
    baseRevision: null,
    payload: {
      factId,
      observationId: operationId,
      value: 12.5,
      rawValueText: "12.5 m",
      evidenceLevel: "observed",
      confidence: "high",
      observedAt: createdAt,
      note: "Mesure prise sur place.",
      supersedesObservationId: null,
    },
    createdAt,
    priorityClass: "essential_structured",
  });
}

function ratingMutation(
  operationId = ratingOperationId,
  createdAt = "2026-10-06T12:02:00.000Z",
  dimensionKey = "love_score",
): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: VENUE_VISIT_MEMBER_RATING_MUTATION,
    baseRevision: "0",
    payload: {
      dimensionKey,
      rating: 8.5,
      expectedRevision: 0,
    },
    createdAt,
    priorityClass: "essential_structured",
  });
}

function coordinator(
  local: MemoryLocalStore,
  remote: RemoteHarness,
): VenueVisitStructuredReplayCoordinator {
  return new VenueVisitStructuredReplayCoordinator({
    local,
    interactions: remote.interactions,
    facts: remote.facts,
    memberOpinions: remote.memberOpinions,
    now: () => now,
  });
}

async function seed(
  local: MemoryLocalStore,
  ...mutations: PendingMutationEnvelope[]
): Promise<void> {
  for (const mutation of mutations) {
    await local.addPendingMutation(mutation);
  }
}

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

describe("Venue visit structured replay remote failures", () => {
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
});

describe("Venue visit structured replay fact-scope lookup failures", () => {
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

describe("Venue visit structured replay local durability", () => {
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

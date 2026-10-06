import { VenueFactPersistenceError } from "@application/facts/venue-fact-persistence-error";
import type {
  LinkObservationSourceInput,
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
  SaveVenueMemberRatingInput,
  VenueMemberOpinionPort,
  VenueMemberRatingRecord,
} from "@application/venues/venue-member-opinion-service";
import { VenueVisitStructuredReplayCoordinator } from "@application/venues/venue-visit-structured-replay-coordinator";
import type { VenueInteractionRecord } from "@domain/venues/venue-interaction";

export const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);
export const venueId = "44444444-4444-4444-8444-444444444444";
export const factId = "55555555-5555-4555-8555-555555555555";
export const factSourceId = "58888888-8888-4888-8888-888888888888";
export const noteId = "61111111-1111-4111-8111-111111111111";
export const factOperationId = "62222222-2222-4222-8222-222222222222";
export const ratingOperationId = "63333333-3333-4333-8333-333333333333";
const now = "2026-10-06T13:30:00.000Z";

export class MemoryLocalStore implements LocalProjectStore {
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
type RatingMode =
  "success" | "failure" | "conflict" | "replay_identity_mismatch";
type FactLinkMode = "success" | "persistence_failed" | "authorization_failed";

export class RemoteHarness {
  readonly calls: string[] = [];
  readonly notes: NormalizedAppendVenueInteractionInput[] = [];
  readonly observations: unknown[] = [];
  readonly factLinks: LinkObservationSourceInput[] = [];
  readonly ratings: SaveVenueMemberRatingInput[] = [];

  noteMode: NoteMode = "success";
  factMode: FactMode = "success";
  factLinkMode: FactLinkMode = "success";
  ratingMode: RatingMode = "success";
  factVenueId = venueId;
  ratingResponseOverride: Partial<VenueMemberRatingRecord> = {};

  readonly interactions: VenueInteractionPort = {
    appendVenueInteraction: async (input) => {
      this.calls.push(`note:${input.interactionId}`);
      this.notes.push(input);
      if (this.noteMode === "conflict") {
        throw new VenueInteractionPersistenceError("conflict", "replay");
      }
      if (this.noteMode === "failure") throw new Error("provider");
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
    createSource: async () => {
      throw new Error("not used");
    },
    updateSource: async () => {
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
    linkObservationSource: async (input) => {
      this.calls.push(`link:${input.observationId}:${input.sourceId}`);
      this.factLinks.push(input);
      if (this.factLinkMode === "persistence_failed") {
        throw new VenueFactPersistenceError("persistence_failed", "provider");
      }
      if (this.factLinkMode === "authorization_failed") {
        throw new VenueFactPersistenceError("authorization_failed", "denied");
      }
      return {
        projectId: input.projectId,
        observationId: input.observationId,
        sourceId: input.sourceId,
        isPrimary: input.isPrimary,
      };
    },
    resolveFromObservation: async () => {
      throw new Error("not used");
    },
  };

  readonly memberOpinions: VenueMemberOpinionPort = {
    getOwnVenuePreference: async () => null,
    listVenueRatings: async () => [],
    saveVenuePreference: async () => {
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
      if (this.ratingMode === "replay_identity_mismatch") {
        throw new VenueMemberOpinionPersistenceError(
          "replay_identity_mismatch",
          "receipt mismatch",
        );
      }
      if (this.ratingMode === "failure") throw new Error("provider");
      return { ...ratingRecord(input), ...this.ratingResponseOverride };
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

export function noteMutation(
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

export function factMutation(
  operationId = factOperationId,
  createdAt = "2026-10-06T12:01:00.000Z",
  supersedesObservationId: string | null = null,
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
      sourceId: factSourceId,
      sourceType: "in_person_visit",
      value: 12.5,
      rawValueText: "12.5 m",
      evidenceLevel: "observed",
      confidence: "high",
      observedAt: createdAt,
      note: "Mesure prise sur place.",
      supersedesObservationId,
    },
    createdAt,
    priorityClass: "essential_structured",
  });
}

export function ratingMutation(
  operationId = ratingOperationId,
  createdAt = "2026-10-06T12:02:00.000Z",
  dimensionKey = "love_score",
  expectedRevision = 0,
): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "venue",
    entityId: venueId,
    mutationType: VENUE_VISIT_MEMBER_RATING_MUTATION,
    baseRevision: String(expectedRevision),
    payload: {
      dimensionKey,
      rating: 8.5,
      expectedRevision,
    },
    createdAt,
    priorityClass: "essential_structured",
  });
}

export function coordinator(
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

export async function seed(
  local: MemoryLocalStore,
  ...mutations: PendingMutationEnvelope[]
): Promise<void> {
  for (const mutation of mutations) {
    await local.addPendingMutation(mutation);
  }
}

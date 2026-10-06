import type {
  LocalProjectMetadata,
  LocalProjectStore,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import type {
  CachedRecordEnvelope,
  PendingMutationEnvelope,
} from "@application/local-data/local-records";

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

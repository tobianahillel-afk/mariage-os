import type { LocalOfflinePin } from "@application/local-data/local-offline-pin";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type {
  CachedRecordEnvelope,
  PendingMutationEnvelope,
} from "@application/local-data/local-records";

export interface LocalProjectMetadata {
  readonly key: "scope";
  readonly localSchemaVersion: number;
  readonly appVersionLastOpened: string;
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly lastSuccessfulSyncAt: string | null;
  readonly backendSchemaVersionLastSeen: string | null;
  readonly serviceWorkerBuildLastSeen: string | null;
}

export interface LocalSyncCounters {
  readonly pendingCount: number;
  readonly conflictCount: number;
  readonly retryableFailureCount: number;
  readonly permanentFailureCount: number;
  readonly unsyncedBinaryCount: number;
}

export interface LocalProjectStore {
  readonly scope: LocalProjectScope;
  getMetadata(): Promise<LocalProjectMetadata>;
  putCachedRecord(record: CachedRecordEnvelope): Promise<void>;
  putCachedRecordIfRefreshSafe(record: CachedRecordEnvelope): Promise<boolean>;
  getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null>;
  listCachedRecords(
    recordType: string,
  ): Promise<readonly CachedRecordEnvelope[]>;
  putOfflinePinWithCachedRecord(
    pin: LocalOfflinePin,
    record: CachedRecordEnvelope,
  ): Promise<void>;
  getOfflinePin(
    entityType: string,
    entityId: string,
  ): Promise<LocalOfflinePin | null>;
  addPendingMutation(mutation: PendingMutationEnvelope): Promise<void>;
  addPendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void>;
  putPendingMutation(
    mutation: PendingMutationEnvelope,
    record?: CachedRecordEnvelope,
  ): Promise<void>;
  settlePendingMutationWithCachedRecord(
    mutation: PendingMutationEnvelope,
    record: CachedRecordEnvelope,
  ): Promise<void>;
  removePendingMutation(operationId: string): Promise<void>;
  getPendingMutation(
    operationId: string,
  ): Promise<PendingMutationEnvelope | null>;
  listPendingMutations(): Promise<readonly PendingMutationEnvelope[]>;
  readSyncCounters(): Promise<LocalSyncCounters>;
  close(): void;
}

export interface LocalProjectStoreFactory {
  open(
    scope: LocalProjectScope,
    appVersion: string,
  ): Promise<LocalProjectStore>;
}

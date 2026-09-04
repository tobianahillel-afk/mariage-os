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
}

export interface LocalProjectStore {
  readonly scope: LocalProjectScope;
  getMetadata(): Promise<LocalProjectMetadata>;
  putCachedRecord(record: CachedRecordEnvelope): Promise<void>;
  getCachedRecord(
    recordType: string,
    entityId: string,
  ): Promise<CachedRecordEnvelope | null>;
  addPendingMutation(mutation: PendingMutationEnvelope): Promise<void>;
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

import {
  parseLocalProjectMetadata,
} from "@application/local-data/persisted-local-data-parser";
import type {
  LocalProjectMetadata,
} from "@application/local-data/local-project-store";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";

import {
  LOCAL_SCHEMA_VERSION,
  METADATA_STORE,
  runRequest,
} from "./indexeddb-project-store-io";

function createMetadata(
  scope: LocalProjectScope,
  appVersion: string,
): LocalProjectMetadata {
  return {
    key: "scope",
    localSchemaVersion: LOCAL_SCHEMA_VERSION,
    appVersionLastOpened: appVersion,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    lastSuccessfulSyncAt: null,
    backendSchemaVersionLastSeen: null,
    serviceWorkerBuildLastSeen: null,
  };
}

function assertScopeIdentity(
  value: LocalProjectMetadata,
  scope: LocalProjectScope,
): void {
  if (
    value.projectId !== scope.projectId ||
    value.userId !== scope.userId ||
    value.deviceId !== scope.deviceId
  ) {
    throw new Error("Local IndexedDB scope metadata is inconsistent.");
  }
}

function assertMigratableSchema(value: LocalProjectMetadata): void {
  if (
    value.localSchemaVersion < 1 ||
    value.localSchemaVersion > LOCAL_SCHEMA_VERSION
  ) {
    throw new Error("Local IndexedDB scope metadata is inconsistent.");
  }
}

function assertScopeMetadata(
  value: LocalProjectMetadata,
  scope: LocalProjectScope,
): void {
  assertScopeIdentity(value, scope);
  if (value.localSchemaVersion !== LOCAL_SCHEMA_VERSION) {
    throw new Error("Local IndexedDB scope metadata is inconsistent.");
  }
}

export async function initializeIndexedDbProjectMetadata(
  database: IDBDatabase,
  scope: LocalProjectScope,
  appVersion: string,
): Promise<void> {
  const raw = await runRequest<unknown>(
    database,
    METADATA_STORE,
    "readonly",
    (store) => store.get("scope"),
  );
  const existing =
    raw === undefined ? undefined : parseLocalProjectMetadata(raw);

  if (existing !== undefined) {
    assertScopeIdentity(existing, scope);
    assertMigratableSchema(existing);
  }

  if (
    existing === undefined ||
    existing.localSchemaVersion !== LOCAL_SCHEMA_VERSION ||
    existing.appVersionLastOpened !== appVersion
  ) {
    const metadata = {
      ...(existing ?? createMetadata(scope, appVersion)),
      localSchemaVersion: LOCAL_SCHEMA_VERSION,
      appVersionLastOpened: appVersion,
    };
    await runRequest<IDBValidKey>(
      database,
      METADATA_STORE,
      "readwrite",
      (store) => store.put(metadata),
    );
  }
}

export async function getIndexedDbProjectMetadata(
  database: IDBDatabase,
  scope: LocalProjectScope,
): Promise<LocalProjectMetadata> {
  const raw = await runRequest<unknown>(
    database,
    METADATA_STORE,
    "readonly",
    (store) => store.get("scope"),
  );
  if (raw === undefined) {
    throw new Error("Local IndexedDB scope metadata is missing.");
  }
  const metadata = parseLocalProjectMetadata(raw);
  assertScopeMetadata(metadata, scope);
  return metadata;
}

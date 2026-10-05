import {
  assertLocalVenueVisitDraftScope,
  createLocalVenueVisitDraftCachedRecord,
  parseLocalVenueVisitDraft,
  type LocalVenueVisitDraft,
} from "@application/local-data/local-venue-visit-draft";
import { parseCachedRecordEnvelope } from "@application/local-data/persisted-local-data-parser";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type { CachedRecordEnvelope } from "@application/local-data/local-records";

import { assertCachedRecordScope } from "./indexeddb-project-store-validation";
import { CACHE_STORE } from "./indexeddb-project-store-io";

function storageError(): Error {
  return new Error("Local IndexedDB Venue visit draft transaction failed.");
}

function assertDraftTarget(
  record: CachedRecordEnvelope,
  draft: LocalVenueVisitDraft,
): void {
  if (
    record.recordType !== "venue_visit_draft" ||
    record.entityId !== draft.venueId
  ) {
    throw new Error("Venue visit draft target does not match cache key.");
  }
}

function sameDraft(
  current: LocalVenueVisitDraft,
  next: LocalVenueVisitDraft,
): boolean {
  return JSON.stringify(current) === JSON.stringify(next);
}

function validateReplacement(
  currentValue: unknown,
  nextRecord: CachedRecordEnvelope,
  scope: LocalProjectScope,
): void {
  if (currentValue === undefined) return;

  const currentRecord = parseCachedRecordEnvelope(currentValue);
  assertCachedRecordScope(currentRecord, scope);
  const currentDraft = parseLocalVenueVisitDraft(currentRecord.payload);
  const nextDraft = parseLocalVenueVisitDraft(nextRecord.payload);
  assertLocalVenueVisitDraftScope(currentDraft, scope);
  assertLocalVenueVisitDraftScope(nextDraft, scope);
  assertDraftTarget(currentRecord, currentDraft);
  assertDraftTarget(nextRecord, nextDraft);

  if (currentDraft.draftRevision > nextDraft.draftRevision) {
    throw new Error("Venue visit draft update is stale.");
  }
  if (
    currentDraft.draftRevision === nextDraft.draftRevision &&
    !sameDraft(currentDraft, nextDraft)
  ) {
    throw new Error("Venue visit draft revision was reused with new content.");
  }
}

export function putIndexedDbVenueVisitDraft(
  database: IDBDatabase,
  scope: LocalProjectScope,
  draft: LocalVenueVisitDraft,
): Promise<void> {
  const record = createLocalVenueVisitDraftCachedRecord(scope, draft);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CACHE_STORE, "readwrite");
    const store = transaction.objectStore(CACHE_STORE);
    let validationError: unknown = null;
    const fail = (): void => reject(storageError());
    const currentRequest = store.get(record.key);

    currentRequest.onerror = fail;
    currentRequest.onsuccess = () => {
      try {
        validateReplacement(currentRequest.result, record, scope);
      } catch (error) {
        validationError = error;
        return;
      }
      const writeRequest = store.put(record);
      writeRequest.onerror = fail;
    };
    transaction.onerror = fail;
    transaction.onabort = fail;
    transaction.oncomplete = () => {
      if (validationError !== null) {
        reject(validationError);
        return;
      }
      resolve();
    };
  });
}

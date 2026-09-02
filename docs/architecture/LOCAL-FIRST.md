# Local-First Interaction Model

## Goal

Cloud collaboration must not make every click feel remote. Mariage OS uses a local-first interaction model while keeping Supabase as the shared cloud source of truth.

## Write path

For an ordinary editable field:

1. Validate locally.
2. Update the local application state immediately.
3. Persist the local mutation to IndexedDB.
4. Mark it `pending`.
5. Queue synchronization.
6. Attempt the remote mutation.
7. On cloud acknowledgement, mark it `synced` and store the returned revision/checkpoint.
8. On a true conflict, mark it `conflict` and require policy/human resolution.
9. On transient failure, keep the local value and retry according to sync policy.

The user should see clear state such as:

- `✓ Synced`
- `Synchronizing…`
- `Offline · 3 changes pending`
- `Conflict requires review`
- `Sync error · work saved locally`

## Read path

Prefer useful local state immediately when available, then refresh from the cloud when online.

A network refresh must not cause disruptive visual replacement of fields currently being edited.

## Local persistence

IndexedDB is required for meaningful local persistence. `localStorage` is insufficient for project datasets, binary/cache metadata and transactional queues.

## Draft safety

Long forms and quick-capture flows should auto-save drafts locally. Closing a tab or locking a phone must not erase already-entered data when it can be reasonably persisted.

## Remote acknowledgement

An optimistic edit must not be represented as cloud-confirmed before acknowledgement.

## Priority synchronization

When bandwidth is constrained, sync structured critical information before large media uploads.

Suggested priority:

1. permissions/session-sensitive metadata where applicable;
2. decisions and payments;
3. guest/task/venue/vendor structured changes;
4. notes and ordinary metadata;
5. thumbnails/previews;
6. large original media.

## Idempotency

Queued operations need stable operation IDs so retries do not create duplicate side effects.

## Reconnection

After reconnection:

1. revalidate session;
2. obtain remote changes since checkpoint;
3. reconcile remote/local versions;
4. replay safe pending mutations;
5. isolate genuine conflicts;
6. update local checkpoint;
7. report success/failures visibly.

## Limitations

Local-first does not mean every cloud-only workflow becomes fully available offline. Live map tiles, external links, initial authentication and uncached remote media may be unavailable.

The application must degrade clearly rather than fail ambiguously.

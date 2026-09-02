# Synchronization Model

## Objective

Two owners may edit the same project from multiple devices, sometimes concurrently or after periods offline. Synchronization must favor data integrity over silent convenience.

## Entity revision

Shared mutable entities should expose a revision/version field or equivalent concurrency token.

A mutation records at minimum:

- unique operation ID;
- project ID;
- entity type and ID;
- user ID;
- device ID;
- base revision;
- semantic patch/action;
- local timestamp;
- sync status.

## Sync statuses

- `local` — local draft not queued/shared yet where applicable;
- `pending` — persisted locally, awaiting remote acknowledgement;
- `synced` — cloud acknowledged;
- `conflict` — requires deterministic/human resolution;
- `error` — failed and requires retry/action.

## Merge classes

### Append-safe

Examples:

- partner-specific rating;
- adding a photo;
- adding a note;
- creating a new task.

Concurrent additions merge automatically when IDs differ.

### Idempotent state change

Examples:

- completing an already-completed task;
- acknowledging the same notification.

Repeated application should not create duplicate effects.

### Independent field update

Two edits to different fields of the same entity can merge if no invariant is violated.

### Semantic conflict

Examples:

- both owners change the same retained venue capacity to different values;
- delete versus edit;
- both change the same shared due date from the same base revision;
- conflicting retained fact resolution.

These require explicit policy or user resolution.

## Delete versus edit

Deletion is normally soft. If one device edits an entity that another has deleted, synchronization must surface the conflict rather than silently resurrect or erase work.

## Ordering

Do not rely solely on client timestamps for correctness. Device clocks can differ. Use server acknowledgements/revisions for authoritative ordering where required.

## Realtime

Realtime events improve freshness but are not the source of durability. If an event is missed, a normal synchronization/read refresh must reconstruct the correct state.

## Conflict UX

Conflict messages use human language, not database terms.

Example:

> “This information was changed on two devices.”

Show:

- current cloud value and author/time;
- pending local value and author/time;
- relevant source/confidence if applicable;
- choices to retain one, preserve both as observations, or mark `to verify` where the domain supports it.

## Import interaction

Bulk imports use the same semantic conflict rules. Imported data cannot bypass stronger retained-value policies.

## Testing requirements

The synchronization suite must cover at minimum:

- simultaneous independent edits;
- simultaneous same-field edits;
- duplicate retry;
- out-of-order delivery;
- delayed acknowledgement;
- network disconnect/reconnect;
- session expiration during pending writes;
- soft delete/edit race;
- large offline queue;
- import versus manual edit;
- realtime event missed then recovered by refresh.

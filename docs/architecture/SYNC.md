# Synchronization Model

Status: **Normative V1 synchronization contract**

## Objective

Two owners may edit the same project from several devices, including after periods offline. Synchronization favors integrity and explicit recovery over silent convenience.

## Mutation envelope

A queued shared mutation records at minimum:

- unique `operation_id` UUID;
- `project_id`;
- entity type/ID;
- authenticated user ID;
- local non-authenticating device ID;
- base server revision for revisioned update;
- semantic action/patch payload;
- local creation timestamp;
- retry metadata;
- priority class;
- sync status.

## Sync statuses

- `local` — local draft not yet queued/shared where feature supports drafts;
- `pending` — durable local mutation waiting remote acknowledgement;
- `sending` — currently attempted;
- `synced` — acknowledged;
- `conflict` — explicit resolution needed;
- `failed_retryable`;
- `failed_permanent`.

UI collapses these into human states such as synchronized / syncing / offline-pending / conflict / error.

## Local durability rule

For local-first supported edits, user-visible success occurs only after the new working value/operation is durably persisted locally. A DOM-only optimistic change is not sufficient.

## Server idempotence

Operations whose retry could cause duplicate side effects use `operation_id` receipts/transaction semantics. Repeating a previously accepted operation ID returns/recognizes the prior semantic result rather than applying it twice.

## Merge classes

### Append-safe

Examples:

- new photo/media record;
- new fact observation;
- new task;
- distinct timeline item;
- separate Inbox capture.

Concurrent unique IDs merge.

### Per-member isolated state

Examples:

- each partner's own rating;
- own favorite/personal note;
- own decision approval.

A member may update only their own row. Concurrent edits by different members do not conflict because identities differ.

### Idempotent transition

Examples:

- mark already-done task done;
- accept already-accepted invitation by same authorized user;
- conversion retry already resolved to same target.

Repeated application has no duplicate effect.

### Independent field merge

Two updates from same base touching disjoint merge-safe fields can merge only if resulting entity still satisfies invariants. Merge engine records final revision/history.

### Observation-preserving conflict

For factual evidence, two different credible values may both be valuable. Rather than choosing one silently, preserve separate observations and mark/resolve retained fact according to evidence rules.

### Human semantic conflict

Examples:

- same shared due date changed differently;
- same guest assigned to different tables;
- same active budget scenario switched differently;
- same candidate date selection changed;
- delete vs edit;
- final decision outcome conflict.

Surface explicit resolution or use protected atomic command semantics.

### Protected command conflict

Operations that mutate several rows/invariants do not synchronize as arbitrary generic patches. Examples:

- select wedding date;
- activate budget scenario;
- accept partner invitation;
- final owner changes;
- finalize certain decisions;
- import apply/rollback transaction.

Queued command includes base/precondition context; server revalidates authorization/current state. If preconditions changed, return typed conflict requiring re-evaluation rather than replaying blindly.

## Delete vs edit

Deletion is normally soft. Edit against a remotely deleted entity is conflict. Do not silently resurrect/delete. Resolution options depend on domain: restore then apply edit, discard edit, preserve note elsewhere, etc.

## Foreign-key/context change conflict

If parent/category/table is removed while an offline child edit references it, server rejects with typed referential conflict. Client retains pending data for user resolution; it does not drop the edit.

## Ordering

Client timestamps support display/debug only. Authoritative mutation ordering uses server revision/transaction result. No clock-based last-write-wins for high-integrity state.

## Realtime

Realtime is a freshness hint, not durability. Missing/out-of-order events must be repaired by normal repository reconciliation/refresh. Realtime listener never directly bypasses domain normalization/authorization assumptions.

## Reconnect sequence

After offline/session gap:

1. ensure authenticated session;
2. revalidate active project membership;
3. fetch/reconcile remote revisions for affected entities/scope;
4. classify each pending operation;
5. apply safe/idempotent operations in priority/dependency order;
6. pause explicit conflicts;
7. continue independent operations when safe;
8. refresh affected derived views;
9. expose final pending/conflict/error state.

Do not simply push all stale local snapshots wholesale.

## Queue priority

Default priority:

1. security/session-critical metadata;
2. essential structured edits (guests/payments/tasks/decisions/facts);
3. metadata/doc references;
4. large media uploads.

A huge photo upload must not block a tiny RSVP/payment edit.

## Conflict UX

Human-language panel shows:

- current cloud value/state;
- local intended change;
- authors/times when safe;
- relevant source/confidence/context;
- choices appropriate to domain.

Possible actions:

- keep cloud;
- apply local after rebase;
- preserve both as observations;
- mark to verify;
- restore deleted entity then apply;
- re-run protected command with current state.

## Imports

Bulk import produces a merge plan against current revisions/evidence. If project changes between preview and commit, apply phase detects stale preview and revalidates/re-previews affected conflicts; a stale preview is not a license to overwrite current data.

## Session expiry/logout

- token expiry keeps durable queue intact;
- no sync until reauth/membership revalidation;
- safe logout requires pending queue resolution (sync/export/discard explicitly) then purges private local project cache.

## Tests

At minimum:

- independent concurrent fields;
- same-field conflict;
- separate partner ratings;
- two table assignments same guest;
- delete/edit;
- parent deleted before child reconnect;
- duplicate operation retry;
- out-of-order/duplicate realtime;
- delayed acknowledgement;
- network disconnect/restart/reconnect;
- session expiration + reauth;
- membership revoked while offline;
- protected date/scenario command stale precondition;
- import preview stale before apply;
- large queue prioritization;
- media upload not blocking structured sync;
- missed realtime repaired by refresh;
- no confirmed edit silently disappears.
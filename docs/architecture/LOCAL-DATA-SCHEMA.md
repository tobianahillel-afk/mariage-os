# Local IndexedDB Working Schema

Status: **Normative local-first architecture reference**

The local database is not an independent business source of truth. It is the durable per-device working cache, offline store, draft store and synchronization queue that allows the UI to continue functioning when network/cloud availability is poor.

Concrete IndexedDB library choice is deferred to Lot 0/1, but these logical stores and semantics are required.

---

## 1. Local metadata

### `local_meta`

Key/value or singleton records for:

- `local_schema_version`
- `app_version_last_opened`
- `project_id`
- `user_id`
- `device_id`
- `last_successful_sync_at`
- `last_full_refresh_at`
- `backend_schema_version_last_seen`
- `service_worker_build_last_seen`

No auth refresh/access token is duplicated here if the Auth SDK/browser storage already manages it securely.

---

## 2. Entity cache stores

Locally cached project entities mirror only fields required by the frontend/domain layer, not necessarily raw Supabase rows one-to-one.

Recommended logical stores:

- `projects`
- `project_members`
- `venues`
- `venue_spaces`
- `venue_offers`
- `venue_availabilities`
- `fact_definitions`
- `facts`
- `fact_observations`
- `sources`
- `vendors`
- `vendor_offers`
- `contacts`
- `interactions`
- `households`
- `guests`
- `tasks`
- `task_dependencies`
- `task_links`
- `decisions`
- `decision_options`
- `decision_approvals`
- `decision_links`
- `budget_items`
- `payments`
- `milestones`
- `documents` metadata
- `media` metadata
- `media_links`
- `document_links`
- relevant `activity_log` window.

Each cached collaborative record retains at least:

- entity ID;
- project ID;
- server revision if synchronized;
- `updated_at`;
- local sync marker where needed.

---

## 3. Pending mutation queue

### `pending_mutations`

Required fields:

| Field | Meaning |
|---|---|
| `operation_id` UUID | stable idempotence key |
| `project_id` | target project |
| `user_id` | actor |
| `device_id` | originating device |
| `entity_type` | domain entity |
| `entity_id` | target/new entity UUID |
| `mutation_type` | create/update/delete/link/etc. |
| `base_revision` | server revision edit was based on, nullable for create |
| `patch_or_payload` | normalized mutation data |
| `created_at` | local creation time |
| `attempt_count` | retry metadata |
| `last_attempt_at` | nullable |
| `status` | `pending`,`sending`,`conflict`,`failed_retryable`,`failed_permanent` |
| `last_error_code` | safe typed error code only |
| `priority_class` | essential structured / metadata / media-related |

The queue survives browser/app restart.

An operation is removed/archived only after server acknowledgement or explicit safe cancellation/resolution.

---

## 4. Conflict store

### `sync_conflicts`

Fields:

- `id` UUID;
- `project_id`;
- `operation_id`;
- `entity_type`;
- `entity_id`;
- `field_keys` involved;
- local proposed value/patch;
- current remote value/revision;
- detected_at;
- resolution status;
- resolved_at/resolved_by;
- chosen resolution metadata.

Conflict payload must not contain unnecessary duplicated document/media binary content.

---

## 5. Drafts

### `drafts`

For multi-field forms not yet canonical records/updates.

Fields:

- `draft_id` UUID;
- `project_id`;
- `user_id`;
- `draft_type`;
- optional target entity ID;
- draft payload;
- created_at;
- updated_at;
- validation summary/version.

Drafts are user/device working state and are not automatically synchronized unless a future feature explicitly specifies shared drafts.

---

## 6. Offline pinning/cache policy

### `offline_pins`

Records explicitly retained for offline use:

- entity type/ID;
- pin reason (`manual`,`upcoming_visit`,`favorite`,`recent`);
- pinned_at;
- desired media policy (metadata/thumbnail/selected originals where feasible).

The cache manager may keep recent entities beyond explicit pins, but must not evict explicitly pinned essential metadata while within local storage policy.

---

## 7. Media local cache

Binary cache is separate from entity metadata.

Logical stores/cache entries track:

- media ID;
- derivative type (`thumbnail`,`preview`,`original`);
- blob/cache reference;
- byte size;
- cached_at;
- last_accessed_at;
- pinned boolean;
- hash/version/etag if available.

Automatic eviction preference:

1. remote/unpinned previews;
2. old thumbnails;
3. nonessential cached originals;
4. never silently discard unsynced locally created original media before upload/recovery choice.

---

## 8. Import working state

### `import_sessions_local`

Before cloud commit, store locally:

- import session UUID;
- raw-file hash/name/metadata (not necessarily raw file bytes);
- detected schema/type;
- mapping decisions;
- validation result;
- duplicate resolution decisions;
- computed merge plan;
- preview summary;
- created_at/updated_at.

Large raw files need not be persisted if browser/storage policy makes that unsafe; the UI must then clearly indicate that reselecting the file may be required after restart.

---

## 9. UI preferences

### `local_preferences`

Per-device values such as:

- last route;
- transient filter state;
- density preference;
- dismissed local informational prompts.

Cross-device preferences belong in a cloud user-preferences model if/when specified. Do not mix preferences with wedding domain truth.

---

## 10. Local migrations

Every local schema version has an explicit migration.

Migrations must preserve:

- pending mutations;
- unresolved conflicts;
- drafts;
- unsynced media references;
- required project identity metadata.

If migration fails, do not default to deleting IndexedDB while unsynced work may exist.

---

## 11. Cloud refresh/merge

Cloud refresh never blindly replaces the local database wholesale when pending edits exist.

High-level process:

1. fetch changed/needed remote state;
2. compare remote revisions with local synchronized base;
3. retain pending local mutations;
4. update unaffected cached entities;
5. detect conflicts;
6. rebase/merge safe pending operations where specified;
7. persist new local state atomically enough to survive restart.

---

## 12. Local-storage failure

If durable local storage is unavailable:

- show a clear degraded-state warning;
- do not claim offline safety;
- online cloud writes may continue only if the workflow can safely operate without queued durability;
- before reset/clear-storage recovery, surface export/reconciliation options for pending data.

---

## 13. Tests

Required tests include:

- pending edit survives process/reload;
- local schema migration preserves queue/drafts;
- remote refresh does not erase pending patch;
- conflict persists until resolved;
- offline pin survives ordinary cache eviction;
- unsynced media is not garbage-collected;
- large cache cleanup preserves essential structured records;
- same operation cannot be duplicated through restart/retry;
- session reauthentication reconnects existing queue safely.

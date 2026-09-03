# Local IndexedDB Working Schema

Status: **Normative V1 local-first architecture reference**

IndexedDB is the durable per-device working cache, offline store, draft store and synchronization queue. It is not an independent permanent business source of truth.

Concrete library choice is deferred; the logical stores/semantics below are required.

## 1. Local namespace and isolation

Every local database/cache namespace is scoped by authenticated account and project. At minimum local metadata tracks:

- `local_schema_version`;
- `app_version_last_opened`;
- `project_id`;
- `user_id`;
- `device_id`;
- last successful sync/full refresh;
- backend schema version last seen;
- service-worker build last seen.

Never show project A cached data after user/project switch to project B. Auth tokens are not duplicated in custom stores when provider SDK already manages them.

## 2. Cached project entities

Cached entities mirror the frontend/domain representation required for offline/read/merge behavior, not necessarily raw SQL rows one-to-one.

V1 logical cache includes where relevant:

### Identity/project planning
- `projects`;
- `project_members`;
- `wedding_date_options`;
- `project_reference_origins`;
- member activity cursor metadata;
- safe invitation metadata only when needed for onboarding UI (never raw reusable token material).

### Venues
- `venues`;
- `venue_spaces`;
- `venue_offers`;
- `offer_components`;
- `venue_availabilities`;
- `venue_access_routes`;
- `member_entity_preferences`;
- `member_ratings`.

### Facts/evidence
- `fact_definitions` including evaluation rules;
- `facts`;
- `fact_observations`;
- `observation_sources`;
- `sources`.

### Vendors/commercial
- `vendors`;
- `vendor_offers`;
- `contacts`;
- `interactions`;
- document version/readiness metadata required by the relevant feature contract.

### Guests/seating
- `guest_categories`;
- `households`;
- `guests`;
- `seating_sections`;
- `seating_tables`;
- `seating_assignments`.

### Work/capture
- `tasks`;
- `task_dependencies`;
- `task_links`;
- `decisions`;
- `decision_options`;
- `decision_approvals`;
- `decision_links`;
- `inbox_items`.

### Finance
- `budget_categories`;
- `budget_items`;
- `budget_scenarios`;
- `budget_scenario_items`;
- `payments`;
- `budget_links`.

### Planning/timeline
- `milestones`;
- `milestone_dependencies`;
- milestone/entity links required by physical schema;
- `event_timeline_items`;
- `event_timeline_dependencies`;
- `event_timeline_vendor_links`.

### Files/tags
- `documents` metadata;
- `media` metadata;
- `document_links`;
- `media_links`;
- `tags`;
- `entity_tags`.

### Import/history
- relevant `imports`/change summaries;
- `import_mapping_profiles` metadata needed by UI;
- `external_identifiers` only where the client/import workflow needs matching context;
- relevant bounded `activity_log` window.

Not every server table must be fully mirrored. Tables that are security/admin-only or never needed offline can be fetched on demand. Any exclusion must be explicit and must not break a V1 offline contract.

Each cached collaborative record retains:

- entity ID;
- project ID;
- server revision/concurrency token where applicable;
- server `updated_at`/ack metadata;
- local sync marker where needed.

## 3. Pending mutation queue

### `pending_mutations`

Required fields:

| Field | Meaning |
|---|---|
| `operation_id` UUID | stable idempotence key |
| `project_id` | target project |
| `user_id` | actor |
| `device_id` | originating device |
| `entity_type` | domain entity/command |
| `entity_id` | target/new UUID where applicable |
| `mutation_type` | domain command/create/update/delete/link/etc. |
| `base_revision` | synchronized revision used as edit base |
| `patch_or_payload` | normalized typed mutation |
| `created_at` | local creation time |
| `attempt_count` | retry metadata |
| `last_attempt_at` | nullable |
| `status` | `pending`,`sending`,`conflict`,`failed_retryable`,`failed_permanent` |
| `last_error_code` | safe typed error code |
| `priority_class` | essential structured / metadata / media-related |

Queue survives restart. An operation is removed/archived only after server acknowledgement or explicit safe cancellation/resolution.

Security/admin commands that cannot safely operate offline (initial project bootstrap, accepting an invitation, permanent project purge, sensitive MFA operations) must not be faked as ordinary offline mutations. UI marks them network/auth-required.

## 4. Conflict store

### `sync_conflicts`

Fields include conflict ID, project/operation/entity, affected field/semantic command, local proposal, remote/current revision/value, timestamps, resolution state/actor and resolution metadata.

Conflict payload excludes unnecessary binary contents.

Domain-aware resolutions may preserve both values as fact observations where appropriate rather than choosing a generic last-write winner.

## 5. Drafts

### `drafts`

Per-user/device working drafts for multi-field forms not yet canonical shared mutations:

- draft ID/project/user/type;
- optional entity target;
- payload;
- created/updated times;
- validation/schema version.

Drafts are not automatically shared unless explicitly specified.

## 6. Offline pinning

### `offline_pins`

Tracks entity ID/type, reason (`manual`,`upcoming_visit`,`favorite`,`recent`), timestamp and desired media policy.

Venue visit pins must include enough related data for the visit contract: venue, relevant spaces, checklist/criteria, selected facts/sources, contact/access summary and chosen media thumbnails as policy permits.

## 7. Local binary cache and unsynced media

Binary data is separate from entity metadata. Track media/document ID or temporary local ID, derivative type, blob reference, size, cached/last-accessed time, pin state and hash/version when known.

Eviction priority:

1. remote/unpinned previews;
2. old thumbnails;
3. nonessential cached originals;
4. never silently delete unsynced locally created originals/documents before upload or explicit recovery/discard choice.

## 8. Import working state

### `import_sessions_local`

Before cloud commit retain:

- local import UUID;
- file hash/name/type metadata;
- detected domain/schema/version/locale;
- selected mapping profile and field mapping;
- validation/errors;
- duplicate resolutions;
- merge plan;
- preview summary;
- created/updated times.

Large raw files need not be persisted if unsafe/unsupported; UI must tell the user re-selection may be needed after restart.

## 9. Local-only UI preferences

### `local_preferences`

Device-local values include last route, transient filter state, local density, dismissed informational prompts and non-shared display state.

Do not put shared/member semantic data here when a cloud model exists. In particular, member venue ratings/favorites and durable member activity cursors use cloud-backed project/member models and are only cached locally.

## 10. Derived caches

Compatibility scores, expected guest totals, budget summaries, progress, next-action ranking and similar values are derived.

They may be cached only if safely rebuildable and tagged with sufficient dependency/version information. A stale derived cache cannot masquerade as authoritative data after dependency changes.

## 11. Local migrations

Every local schema version has an explicit migration preserving:

- pending mutations;
- unresolved conflicts;
- drafts;
- unsynced media/file references;
- project/account identity namespace;
- offline pins;
- required cached entities used by pending patches.

Migration failure must not default to clearing storage while recoverable unsynced work exists.

## 12. Cloud refresh/merge

Remote refresh never wholesale-replaces local state while pending edits exist.

Process:

1. fetch changed/needed remote state;
2. compare server revisions with synchronized base;
3. retain pending local mutations/drafts;
4. update unaffected cache;
5. detect conflicts/invalidation;
6. rebase safe mutations where specified;
7. persist resulting state atomically enough to survive restart.

Realtime events are hints for freshness, not sole durability. A missed event is repaired by ordinary refresh/sync.

## 13. Logout/project switch

Before hiding/purging a project cache:

- stop subscriptions;
- freeze outbound sync during identity transition;
- detect pending work;
- require sync, explicit export/recovery, or explicit discard where allowed;
- clear visible project state before a new identity/project renders;
- purge private cached records according to frozen security policy once safe.

Member removal/revocation prevents future cloud access; device-local private remnants are handled by the local purge/session policy and cannot be assumed remotely erasable instantly.

## 14. Storage failure/degraded mode

If durable browser storage is unavailable:

- show explicit degraded-state warning;
- do not claim offline durability;
- permit online-only writes only when workflow can safely complete directly;
- never accept an edit as locally safe and then discard it;
- before destructive reset offer reconciliation/export for recoverable pending state.

## 15. Required tests

At minimum:

- pending edit survives reload;
- migration preserves queue/drafts/unsynced media;
- remote refresh cannot erase pending patch;
- conflict survives restart;
- venue offline pin survives ordinary eviction;
- seating/timeline/budget-scenario mutations can queue if their feature contract marks them offline-editable;
- same operation cannot duplicate through retry/restart;
- session reauthentication reconnects existing queue;
- project/account switch never reveals previous project cache;
- logout cannot silently destroy pending work;
- derived cache invalidates after dependency change;
- local schema can represent every V1 entity required by an offline-capable screen.

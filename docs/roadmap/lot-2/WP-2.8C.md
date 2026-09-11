# WP-2.8C — Recoverable Venue remote-media metadata lifecycle

## Identity

- Work Packet ID: `WP-2.8C`
- Lot: `2`
- Name: Recoverable Venue remote-media metadata lifecycle
- State: `PLANNED`
- Current pass: `PLAN`
- Primary bounded context: Documents/Media remote-reference metadata trash lifecycle
- Branch/PR: `lot-2/venues-core` / PR not opened yet

## Why this packet exists

`DELETION-RETENTION.md` freezes recoverable soft deletion for media/document metadata, while the WP-2.8 decomposition assigned remote create/list to A and private binary lifecycle to B but intentionally left remote-media metadata soft-delete/restore to C. WP-2.8C closes that responsibility without changing product scope.

WP-2.8A and WP-2.8B are both **ACCEPTED / COMPLETE**. WP-2.8B durable closure is `8317125183bc5521d6d4aac8e132f64a57aa4ca8` / CI `34616938470` — **5/5 SUCCESS**, clean-checkout included. No earlier packet is reopened by C.

## Scope

### Primary features / current-lot responsibility

- remaining recoverable-metadata slice of `FTR-024` after WP-2.8A/B;
- Lot-2 metadata-retention responsibility of `FTR-092` where it applies to Venue remote image references;
- `DELETION-RETENTION.md` media-metadata soft-delete/restore rule;
- `MED-007`, `MED-010`, `MED-013` where applicable;
- preserve accepted `MED-008` provenance/source-URL behavior as a regression invariant rather than claiming new provenance scope.

No standalone frozen `ACC-*` scenario exclusively owns remote-reference soft-delete/restore. C therefore uses packet-specific acceptance evidence while preserving the accepted A foundation toward `ACC-057`; it does **not** claim the later DOM/referrer rendering responsibility owned downstream.

### Exact WP-2.8C responsibility

- add `media.deleted_at timestamptz null` by a new forward-only migration;
- active remote-media reads exclude `deleted_at is not null` rows;
- soft-delete preserves media UUID, remote/source URLs, category, caption, creation identity and the existing same-project Venue `media_links` row;
- restore clears `deleted_at` and returns the same logical media/link identity;
- remote and private archived records remain independent; C never changes B private rows or Storage objects;
- one protected lifecycle transition command serves remote-media soft-delete and restore;
- live `media.write` authorization, project isolation, generic foreign/missing identity denial, optimistic revision control and fail-closed typed receipts;
- same-state soft-delete/restore is an idempotent successful replay, not a duplicate mutation;
- direct allow/deny and same-session downgrade/revocation evidence;
- ordinary active list/provider behavior cannot surface deleted media as active.

### Explicitly out of scope

- remote-media creation/replay/list foundation — already accepted in WP-2.8A;
- private Storage upload, hash, derivative, duplicate receipt or orphan recovery — already accepted in WP-2.8B;
- deleting or modifying remote third-party bytes;
- deleting a separate private archived media row because a remote reference is deleted;
- global trash UI or user-facing deleted-media browser;
- 30-day Empty-trash/physical purge scheduler or project purge workflow;
- gallery/detail presentation — WP-2.11;
- offline/local media lifecycle — WP-2.12/Lot 10;
- import/export/backup format mechanics;
- a generic cross-entity trash service or new Media bounded context.

## Dependencies / sequencing

- WP-2.8A: **ACCEPTED / COMPLETE**.
- WP-2.8B: **ACCEPTED / COMPLETE**; acceptance-governance `3b28c7b734a2258db455bbdabb567fcee2ee2bd1` / `34615830961` **5/5 SUCCESS**; durable closure `8317125183bc5521d6d4aac8e132f64a57aa4ca8` / `34616938470` **5/5 SUCCESS**.
- Default orchestration order remains WP-2.8A → WP-2.8B → WP-2.8C → WP-2.9.
- `MEDIA-LIFECYCLE-ADDENDUM.md`, `DELETION-RETENTION.md`, `PHYSICAL-SCHEMA-V1.md`, `RLS-MATRIX-V1.md`, `LOT-2-COVERAGE-MATRIX.md` and the historical WP-2.8 coverage addendum are governing inputs.
- Only one packet may be active.

## Activation specification freeze

This section resolves the remaining pre-READY concurrency/receipt ambiguity. The packet remains `PLANNED` until this specification-only commit is exact-head green and a **separate** `PLANNED → READY` governance transition passes its own exact-head CI.

### 1. Persisted lifecycle state

C adds exactly one canonical lifecycle field to `media`:

- `deleted_at is null` → active remote-reference metadata;
- `deleted_at is not null` → recoverably soft-deleted remote-reference metadata.

No `deleted`, `trashed`, `purged`, `restored` string status and no second trash table are introduced. Existing A/B `upload_status` semantics remain unchanged.

The new column is nullable for every media row, but the C public transition command is restricted to the accepted **A-style Venue remote-reference shape**: image media with non-null `remote_url`, null `storage_path`, no binary-derived/private derivative fields, `is_original=true`, `upload_status='ready'`, and an existing same-project Venue gallery link. B private media is not a legal C lifecycle target.

### 2. Retention and read semantics

Soft-delete changes only lifecycle/audit fields. It must not change:

- `id`, `project_id`;
- `remote_url`, `source_page_url`;
- `category`, `caption`;
- `media_type`, remote/private discriminator or upload state;
- creation metadata;
- the retained `media_links` Venue gallery relationship.

Restore clears `deleted_at` on that same row; it does not allocate a new media/link UUID.

`listVenueRemoteMedia(projectId, venueId)` is an **active** read and therefore adds `deleted_at is null` to its accepted A filters. The base authorized metadata/RLS layer may still permit an authorized future trash/recovery read; C does not add a trash UI/query surface. Deletion visibility is therefore enforced mechanically at the active provider query and acceptance test, not by pretending the deleted record ceased to exist.

### 3. Protected lifecycle command

C adds one narrow public command:

`transition_venue_remote_media_lifecycle(target_project_id, target_media_id, target_action, target_expected_revision)`

Exact public action allowlist:

- `soft_delete`;
- `restore`.

The command is `SECURITY DEFINER`, uses fixed trusted `search_path = pg_catalog` / fully qualified objects, and is executable by `authenticated` only. Direct client INSERT/UPDATE/DELETE on `media` and `media_links` stays revoked.

The command must:

1. require authenticated identity;
2. lock/validate the target project and verify live `media.write`;
3. validate a positive expected revision;
4. lock the target media row `FOR UPDATE`;
5. return generic `42501` for absent or foreign-project identity;
6. re-check live writer authorization after the target lock;
7. verify the row is the accepted A-style remote Venue image shape and has a retained same-project Venue gallery link;
8. never accept caller-owned URL/category/caption/link-target/project/audit payload;
9. apply the concurrency/replay rules below;
10. return a canonical typed lifecycle receipt.

An authorized same-project media UUID that exists but is not a legal A-style remote Venue reference (for example B private media) is a typed lifecycle conflict (`23505` mapping is acceptable). It must never cause private binary mutation. Missing/foreign identity remains generic/non-disclosing `42501`.

### 4. Optimistic concurrency and same-state replay

A real state change is optimistic-concurrency protected:

- if current lifecycle state differs from the requested target state, `current revision` must equal `target_expected_revision`;
- stale real transitions fail with SQLSTATE `40001` and map through the existing Media `conflict → replay_conflict` boundary;
- an actual soft-delete/restore mutation increments `revision` exactly once and updates `updated_at` / `updated_by` exactly once.

C intentionally freezes a stronger same-state replay rule because the packet explicitly requires retry-safe delete/restore:

- `soft_delete` when already deleted succeeds as a **no-op replay**;
- `restore` when already active succeeds as a **no-op replay**;
- a same-state replay does not change `deleted_at`, revision or audit fields;
- a same-state replay may succeed even when the supplied expected revision is an older positive revision from the acknowledged/lost request; the receipt returns the **current** revision/state so the caller can reconcile;
- an old revision never authorizes the opposite/currently-unmet transition: if a real state change is needed, revision equality is mandatory.

This provides retry idempotence without introducing an operation-receipt table, operation ID or second lifecycle subsystem. It is deliberately packet-specific and does not change the separate Venue-offer transition contract.

### 5. Lifecycle receipt

The public command returns an object with exactly the lifecycle identity needed by the application boundary:

- `action`: `soft_delete` or `restore`;
- `replayed`: boolean (`false` for actual mutation, `true` for target-state no-op replay);
- `media`: canonical current remote-media row including `deleted_at` and positive current `revision`;
- `link`: the retained canonical Venue `gallery` link for that media.

The Supabase boundary fails closed unless the receipt proves:

- expected action and replay boolean shape;
- expected project/media identity;
- A-style remote-row shape;
- positive safe-integer revision;
- `deleted_at` is a valid timestamp for `soft_delete`, and `null` for `restore`;
- retained link uses the same project/media and remains `target_type='venue'`, `relationship_type='gallery'`;
- no substituted/wrong-project/malformed row is accepted.

Existing A create/list parsing is broadened only enough to accept positive remote-media revisions and the new deleted-at field. Active A list still accepts only non-deleted rows.

### 6. Authorization / security controls

C reuses the accepted media permission model and relevant A controls rather than creating a new permission key.

Authorization/security evidence must cover at minimum:

- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020` as applicable;
- `SEC-AUTH-012`, `SEC-AUTH-013`;
- applicable `SEC-AUTHZ-001..009`;
- `SEC-VAL-001..004`, `SEC-VAL-008` for lifecycle identity/action/revision/provider trust boundaries;
- `SEC-INJ-001`, `SEC-INJ-002`;
- `SEC-SRV-001` regression: C performs no server-side remote URL fetch;
- `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`.

C does not add a new URL-edit surface, so A's URL-validation rules remain regression inputs rather than new C validation scope.

### 7. Forward-only migration rule

Implementation must add a new migration after the accepted A/B migration chain. Historical migrations `20260909205000_*`, `20260909230000_*`, `20260909232500_*`, `2026091007*`, `20260910090000_*`, `20260910111500_*`, `20260910125000_*` and `20260911133000_*` are immutable history and must not be edited.

## Sizing review after activation freeze

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| meaningfully changed Documents/Media remote lifecycle | 1 | 3 | 3 |
| new persistent entity/table | 0 | 1 | 0 |
| forward-only media lifecycle migration family | 1 | 1 | 1 |
| new public protected lifecycle command | 1 | 2 | 2 |
| changed privileged authorization/read boundary | 1 | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **8** |

Cohesion review: **PASS**. C reuses `media`, `media_links`, `MediaService`, `MediaPort`, the A Supabase adapter and existing permission/error boundaries. No operation-receipt entity/table, new service architecture, Storage capability, UI workflow or offline subsystem is introduced. If implementation discovers one, stop and re-size/split before product code.

## Pre-implementation brief

```text
Current gate/lot:
  Lot 2 IN_PROGRESS. WP-2.8A/B ACCEPTED. WP-2.8C remains PLANNED until separate READY governance is earned.
Current Work Packet/pass:
  WP-2.8C / PLAN — activation specification freeze.
Feature IDs:
  FTR-024; FTR-092 Lot-2 remote-metadata retention slice.
Requirement IDs:
  MED-007, MED-010, MED-013; preserve MED-008 provenance as regression; DELETION-RETENTION media rule.
Acceptance IDs:
  No standalone frozen ACC for this exact lifecycle. Preserve A foundation toward ACC-057; C uses packet-specific delete/restore acceptance and does not claim DOM rendering.
Primary user job:
  Remove a retained Venue remote image from active results without destroying metadata/link identity, then restore the same record later.
Routes/screens:
  None.
Authoritative domain entities:
  media, media_links; Venue only as retained same-project gallery target.
Cloud tables/RPC/storage:
  media.deleted_at via new forward-only migration; one transition_venue_remote_media_lifecycle RPC; media_links retained; no Storage object mutation.
Local stores/offline class:
  None; server-required online lifecycle transition.
Permission keys/security requirements:
  Existing media.write transition authorization and media.read metadata/list authorization; relevant AUTHZ/SEC set above.
Critical invariants:
  no hard delete; active list excludes deleted; same UUID/link survives restore; remote payload/provenance unchanged; private B media untouched; same-state no-op replay; real stale transition rejected; foreign/missing non-disclosing.
Import/export/backup impact:
  No format/mechanics work in C. deleted_at becomes canonical metadata that later export/backup implementations must preserve according to their own packet contracts.
Tests required:
  create→delete→active-list-hidden→restore→same identity; same-state stale replay no-op; real stale opposite transition rejected; revision/audit mutation exactly once; payload/link preservation; private-media rejection; direct auth deny matrix; same-session downgrade/revocation; provider fail-closed; A/B regression suites; no remote fetch.
Files/modules expected to own the change:
  src/domain/documents/venue-remote-media.ts or a tightly scoped lifecycle peer; src/application/documents/media-service.ts; existing media persistence error boundary; src/infrastructure/supabase/supabase-media-adapter.ts plus lifecycle receipt parser; new forward-only Supabase migration; pgTAP/unit/provider tests.
Known deferred choices:
  trash UI; 30-day purge; physical binary deletion; private-media deletion; offline queue; WP-2.11 presentation; WP-2.12 visit flow; import/export/backup mechanics.
```

No material semantic question remains open after this freeze. READY is still a separate governance transition.

## Expected vertical slice

- UI/route: none.
- domain: active/deleted remote lifecycle state/receipt invariants in existing Documents/Media context.
- application: extend existing `MediaService`/`MediaPort` with typed soft-delete/restore calls; reuse existing `replay_conflict` boundary.
- infrastructure: extend A's Supabase media adapter and fail-closed parsers; no second media adapter architecture.
- cloud persistence: new `deleted_at`, protected lifecycle RPC, active-list filter, direct authorization/adversarial tests.
- local/offline: none.
- Storage/remote fetching: none.

## Verification plan

### Domain/application/provider

- active → deleted returns `replayed=false`, non-null deleted timestamp and next revision without changing remote payload/link identity;
- deleted → active returns `replayed=false`, null deleted timestamp and next revision;
- repeated delete and repeated restore return `replayed=true`, current revision and unchanged audit/revision;
- stale expected revision fails when an actual opposite transition is required;
- active list excludes deleted rows and restores the same row/link after restore;
- malformed/substituted/wrong-project/wrong-action/wrong-state lifecycle receipts fail closed;
- parser accepts positive revisions beyond 1 while preserving all A remote-shape validation;
- no lifecycle operation fetches or mutates remote bytes;
- accepted A create/replay/list and B private-media behavior remains green.

### Database / RLS / adversarial

- forward migration preserves accepted A remote and B private rows;
- `deleted_at` mutation is only through the protected C command for client identities;
- real mutation increments revision once and updates server audit identity/time once;
- same-state replay changes none of deleted_at/revision/audit fields;
- retained same-project `media_links` survives delete and restore unchanged;
- owner/editor writes only according to live `media.write`; viewer/read-only cannot lifecycle-transition;
- anon/outsider/project-B/revoked denied;
- foreign/missing known UUID is non-disclosing;
- same-session permission downgrade/revocation blocks a subsequent transition;
- same-project B private row cannot be transitioned by C and no Storage object is touched;
- client cannot use lifecycle command to rewrite project ID, URLs, category, caption, link target, creation metadata or private-upload fields;
- ordinary active query excludes deleted rows while authorized metadata retention remains recoverable;
- function EXECUTE grants, fixed search path and direct table mutation revocation are asserted.

### Acceptance responsibility

- Create a synthetic remote Venue image through accepted A; soft-delete it; prove it disappears from active results while metadata/link remains retained; replay delete; restore it; prove the identical media/link returns; replay restore.
- Prove optimistic-concurrency behavior: stale revision is rejected for a required state change but same-target replay succeeds without a second mutation.
- Prove remote metadata soft-delete/restore does not mutate any independent private archive object.
- Preserve `MED-008` source provenance through both transitions.
- Do not claim global trash UI, physical purge, offline lifecycle or DOM external-image rendering acceptance.

## Activation gate status

Activation specification freeze is **CLOSED IN CONTENT / CI PENDING** on the commit containing this document. WP-2.8C remains `PLANNED / PLAN` until that exact HEAD is **5/5 SUCCESS**. After that, the only permitted branch write is a separate `PLANNED → READY` governance transition; product implementation remains prohibited until the READY transition itself is exact-head green.

## Pass A — IMPLEMENT

Not started. Product code is prohibited until the separate READY exact-head gate passes.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

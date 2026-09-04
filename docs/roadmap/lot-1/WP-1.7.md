# Work Packet Record — WP-1.7

## Identity

- Work Packet ID: `WP-1.7`
- Lot: `1`
- Name: Project-scoped repositories, local cache and sync primitives
- State: `REVIEW_FAILED`
- Current pass: `B-REVIEW-FAILED / REPAIR`
- Primary bounded context: project/account-scoped local durability and synchronization foundation
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary Feature IDs

- `FTR-010` — global sync status and local durability indicator.
- `FTR-011` — Lot-1 local-state/pending-work foundation only; session-expiry/logout resolution remains WP-1.8 and later Lot-10 hardening.
- `FTR-012` — local project/account partition foundation used by personal cross-device preferences; cloud preference persistence was accepted in WP-1.5.

### Current-lot responsibilities covered

- explicit project/account context at local repository/store boundaries;
- native IndexedDB durability foundation with account+project partitioning;
- no cross-project/account cached-record or pending-operation reads through the bound local-store API;
- typed cached-record envelope carrying server revision/local sync metadata without provider types;
- stable UUID operation/device identity primitives and typed pending-mutation envelope;
- durable pending-mutation persistence sufficient to survive browser reload/reopen;
- application-level local durability/sync summary states compatible with the UX synchronization-state contract;
- compact global sync/local-durability indicator hook in the already-accepted private project shell;
- architecture/static/unit/property/real-browser IndexedDB evidence for the foundation.

### Requirements / Acceptance / Security IDs

- `SYN-001` / `SYN-002` — Lot-1 foundation portion for durable local acceptance and visible sync/local-durability state;
- `SYN-011` — project/account local-cache isolation foundation;
- `AUTHZ-017` — project/account switching must not leak cached/read-model data from another scope;
- `IAM-013` — pending-work/local-state foundation only; reauth/logout semantics remain WP-1.8;
- `QLT-001`, `QLT-002`, applicable `QLT-006` foundation evidence;
- FTR-010/011/012 contracts in `LOCAL-FIRST.md`, `LOCAL-DATA-SCHEMA.md`, `SYNC.md`, `OFFLINE.md`, `DATA-OWNERSHIP.md`, repository/service contracts and screen/interaction-state contracts.

### Explicitly out of scope for this packet

- full send/retry/backoff/idempotence-receipt engine, remote refresh coordinator and conflict resolution — Lot 10 (`FTR-083..088`);
- session-expiry state machine, reauthentication resume, explicit logout pending-work resolution and purge — WP-1.8;
- domain-specific Venue/Vendor/Guest/Budget/etc repositories or cached business records — their owning Lots;
- arbitrary cloud CRUD adapters or new Supabase tables/RPCs/RLS migrations;
- Storage/Realtime isolation — WP-1.9;
- service worker/offline install/pinned package/media queue behavior — later offline/media Lots;
- provider credentials, provider-send code, guest capability persistence or Lot 2+ product functionality.

## Dependency / sequencing

- Required prior packets/features: WP-1.2 tenancy baseline, WP-1.5 project/preferences persistence foundation and WP-1.6 protected shell are **ACCEPTED**.
- Downstream packets blocked by this packet: WP-1.8; WP-1.9 remains separately sequenced by Lot-1 orchestration.
- Shared interfaces/contracts relied on: explicit project context, Auth session user identity, native browser IndexedDB, UUID identity strategy, existing private shell composition.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 1 | 3 | 3 |
| persistent entity/table | 2 | 1 | 2 |
| offline/sync semantics | 1 | 2 | 2 |
| **Total** |  |  | **7** |

- Cohesion rationale: local scope, durable pending-operation envelope/store and the global durability/sync summary are one foundation because each is unsafe or misleading without the others. The packet deliberately excludes the later send/retry/conflict engine.

## Expected vertical slice

- UI/route: compact global local-durability/sync indicator in the protected project shell only; no public RSVP exposure.
- application command/query/service: explicit immutable local project scope, cached-record/pending-mutation contracts and deterministic sync-summary derivation.
- domain rules/invariants: UUID identity, immutable project/account scope, operation ID reuse prohibition by key semantics, no cloud-authorization inference from local state.
- ports/interfaces: narrow local cached-record/pending-mutation store interfaces with no Supabase/provider types.
- infrastructure adapters: native IndexedDB adapter bound to one account+project namespace.
- cloud persistence/RLS: none added; existing cloud authorization remains authoritative.
- local/offline behavior: durable IndexedDB writes, reload/reopen persistence, strict scope isolation, storage failure represented as non-durable/degraded rather than success.
- import/export/backup/versioning impact: none; local schema version metadata only, not backup/export semantics.
- UX/QIF/accessibility impact: text-based compact synchronization state, never color-only; user can distinguish synced/synchronizing/offline-pending/conflict/error-with-local-work-preserved and unavailable local durability.

## Pass A — IMPLEMENT

### Implementation evidence

- pure tests cover scope/UUID/envelope/sync-summary invariants;
- native IndexedDB adapter and deterministic contract tests cover scoped cached-record and pending-mutation persistence semantics;
- Playwright real-browser evidence covers reload/reopen persistence plus account/project isolation;
- private-shell sync/local-durability indicator and public-shell non-exposure regressions are covered;
- static/architecture/size/dead-code/security gates pass;
- exact implementation HEAD `413405b5ab5c560d5246955d394f11f0ef2f8a17` retained full CI run `33890804064`: Core, Local Supabase DB/RLS, Browser+mutation, privacy-safe preview and clean-checkout Full Verify all **SUCCESS**;
- clean-checkout Full Verify executed `npm run verify` successfully.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable tests written
- [x] no known untracked stub/TODO
- [x] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [x] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Fresh review performed after green Pass A. Result: **FAIL — three MAJOR findings**.

### `WP17-AR-001` — MAJOR — persisted IndexedDB rows are trusted by TypeScript cast instead of runtime parsing

`IndexedDbProjectStore` reads metadata, cached records and pending mutations from IndexedDB directly into typed generics and then performs only partial scope checks. Same-project malformed rows can therefore pass the boundary with invalid/missing keys, UUIDs, timestamps, enum values, counters or non-JSON payloads. A malformed mutation status also falls through the counter classifier as ordinary pending work.

This violates the normative runtime-input contract that explicitly treats IndexedDB/local cache after version/schema evolution as untrusted/version-sensitive input and requires parsing before use. The repair must introduce centralized fail-closed runtime parsers for all WP-1.7 persisted record shapes and adversarial tests for malformed/partial/stale rows. Scope checks remain necessary but are not sufficient.

### `WP17-AR-002` — MAJOR — blocked IndexedDB version/open lifecycle can leave protected startup unresolved indefinitely

The IndexedDB open wrapper handles `onerror`, `onupgradeneeded` and `onsuccess` but not `onblocked`; opened databases also do not close on `versionchange`. During a schema upgrade with another tab/connection holding the older database, the open request can remain blocked without resolving or rejecting. Protected startup awaits local-store opening before rendering the project shell, so this can leave the application blank indefinitely rather than entering an explicit degraded/recovery state.

The repair must make blocked/version-change behavior explicit and fail closed without deleting local work: close stale connections on version change and surface blocked upgrade/open as a controlled local-durability failure that the shell can represent. Regression tests must exercise the blocked and version-change paths.

### `WP17-AR-003` — MAJOR — global UI can claim “synchronized” without cloud freshness/acknowledgement evidence

`deriveSyncSummary` returns `synced` / “En ligne · synchronisé” whenever the browser is online and local pending/conflict/error counters are zero. Startup does not perform a remote refresh in WP-1.7, and the local metadata checkpoint `lastSuccessfulSyncAt` is not consulted. A cache can therefore be stale or never refreshed and still be represented as synchronized.

The full remote-refresh/replay engine remains correctly deferred to Lot 10; the WP-1.7 repair must not implement it. Instead the foundation must stop asserting cloud synchronization without evidence. It should distinguish “no local changes pending / online” from true acknowledged/fresh synchronization, or require an explicit proven sync/freshness signal before using the `synced` state. Tests must prove a never-synced/stale local store cannot masquerade as cloud-synchronized.

### Pass B result

- `WP17-AR-001`: **OPEN / MAJOR**.
- `WP17-AR-002`: **OPEN / MAJOR**.
- `WP17-AR-003`: **OPEN / MAJOR**.
- Pass B: **FAIL**.
- Packet state: `REVIEW_FAILED`.
- Required action: repair these findings only, rerun affected evidence and exact-head full verification, then perform a fresh Pass B review. No Pass C and no WP-1.8 work is permitted yet.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires all three Pass B findings closed by repair/evidence and a fresh clean adversarial review before mechanical EXPECTED vs IMPLEMENTED vs VERIFIED reconciliation.

## Handoff

- Current state: `REVIEW_FAILED`.
- Current/next pass: `B-REVIEW-FAILED / REPAIR`.
- Last green pre-review implementation verification: WP-1.7 Pass A run `33890804064` on implementation HEAD `413405b5ab5c560d5246955d394f11f0ef2f8a17`, all five jobs SUCCESS including clean-checkout `npm run verify`.
- Open findings: `WP17-AR-001`, `WP17-AR-002`, `WP17-AR-003` — all MAJOR.
- Next permitted action: repair WP-1.7 findings only, then fresh exact-head verification and fresh Pass B; WP-1.8 remains blocked until WP-1.7 acceptance.

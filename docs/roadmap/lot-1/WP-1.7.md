# Work Packet Record — WP-1.7

## Identity

- Work Packet ID: `WP-1.7`
- Lot: `1`
- Name: Project-scoped repositories, local cache and sync primitives
- State: `ACCEPTED`
- Current pass: `C-ACCEPTED`
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
- Downstream packet unblocked by acceptance: WP-1.8. WP-1.9 remains separately sequenced by Lot-1 orchestration.
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
- original implementation HEAD `413405b5ab5c560d5246955d394f11f0ef2f8a17` retained full CI run `33890804064`: Core, Local Supabase DB/RLS, Browser+mutation, privacy-safe preview and clean-checkout Full Verify all **SUCCESS**;
- after Pass-B repairs, exact implementation/review HEAD `46548702f304dbabcf4bd673a33afb1c0ec96a3d` retained full CI run `33895516028`: all five jobs **SUCCESS**, 28/28 Playwright E2E scenarios passed across Chromium/Firefox/WebKit/mobile Chromium, mutation passed, and clean-checkout Full Verify executed `npm run verify` successfully.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable tests written
- [x] no known untracked stub/TODO
- [x] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [x] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

The first fresh review after green Pass A failed with three MAJOR findings. All three were repaired, re-evidenced on exact implementation HEAD `46548702f304dbabcf4bd673a33afb1c0ec96a3d`, and the complete WP-1.7 surface was then reviewed again from the accepted WP-1.6 baseline through the repaired head.

### `WP17-AR-001` — CLOSED — runtime parsing of persisted IndexedDB values

Original finding: `IndexedDbProjectStore` trusted persisted metadata/cached records/pending mutations through TypeScript casts and partial scope checks.

Repair and review result:

- centralized fail-closed parsers now validate metadata, cached-record and pending-mutation shapes before application use;
- UUIDs, canonical timestamps, stable identifier names, enum/status/priority values, non-negative integer counters and nullable fields are validated;
- cached-record composite keys are recomputed/checked;
- payloads are constrained to bounded JSON-compatible graphs and reject cycles, symbols, exotic prototypes, non-finite numbers and unsupported values;
- scope checks remain enforced after parsing;
- malformed/partial/stale persisted-row tests and 100% global coverage are green.

Status: **CLOSED**.

### `WP17-AR-002` — CLOSED — blocked/version-change IndexedDB lifecycle

Original finding: an IndexedDB open/upgrade blocked by another tab could remain unresolved, and existing connections did not explicitly close on version change.

Repair and review result:

- `onblocked` rejects as an explicit local-durability failure;
- a connection that succeeds after the rejected blocked request is immediately closed;
- every successful connection installs `onversionchange` and closes when a newer schema requests upgrade;
- startup catches local-store failure only after cloud authorization succeeds and renders explicit degraded local durability rather than hanging or exposing stale project state;
- lifecycle regression tests exercise blocked-open and version-change paths;
- no reset/delete fallback was introduced, so pending local work is not silently erased.

Status: **CLOSED**.

### `WP17-AR-003` — CLOSED — truthful synchronization indicator

Original finding: online + zero local counters was represented as `synced` without cloud freshness/acknowledgement evidence.

Repair and review result:

- summary derivation now separates `online_idle` from true `synced`;
- `online_idle` is labelled `En ligne · aucune modification locale en attente` and makes no cloud-freshness claim;
- true `synced` requires an explicit `cloudSynchronized` signal;
- WP-1.7 bootstrap deliberately supplies `cloudSynchronized: false`, because no Lot-10 remote refresh/ack coordinator exists yet;
- E2E expectations were aligned with the truthful state and all 28 browser scenarios pass;
- no Lot-10 replay/refresh/conflict engine was pulled into this packet.

Status: **CLOSED**.

### Fresh complete Pass B result

Review dimensions rechecked after repair:

- account+project namespace isolation and live cloud authorization precedence;
- persisted-data parsing and corrupted-row fail-closed behavior;
- IndexedDB blocked/version-change/transaction failure behavior and local-work preservation;
- operation-ID uniqueness and pending-mutation reload durability;
- public RSVP non-exposure and protected-shell sequencing;
- truthful local durability/sync-state semantics;
- architecture boundaries and explicit exclusion of Lot-10 synchronization orchestration.

Result: **PASS — no unresolved BLOCKING or MAJOR finding**.

Non-blocking observation retained for later hardening: browser device identity currently lives in `localStorage` while the account+project IndexedDB metadata records that device UUID. If browser storage is selectively reset and those stores diverge, the implementation fails closed/degraded rather than attaching a mismatched queue. A deliberate recovery/re-association UX belongs with later session/local-recovery hardening; current WP-1.7 neither leaks cross-scope data nor deletes the preserved IndexedDB data.

### Pass B exit

- `WP17-AR-001`: **CLOSED**.
- `WP17-AR-002`: **CLOSED**.
- `WP17-AR-003`: **CLOSED**.
- Fresh Pass B: **PASS**.
- Exact repaired evidence: run `33895516028` on `46548702f304dbabcf4bd673a33afb1c0ec96a3d`, all five jobs SUCCESS including clean-checkout `npm run verify`.

## Pass C — ACCEPTANCE / RECONCILIATION

### Mechanical reconciliation

| Expected responsibility | Implemented | Verified evidence | Result |
|---|---|---|---|
| explicit project/account repository/store boundary | `LocalProjectScope`, `LocalProjectStore` and account+project IndexedDB namespace | architecture/static gates; scope/store unit tests | PASS |
| local account+project partitioning with no cross-scope cache/queue reads | namespace includes authenticated account+project; metadata plus cached-record/mutation scope assertions fail closed | unit corruption/foreign-scope tests; real-browser project-switch isolation E2E | PASS |
| durable operation IDs, revision/sync envelopes and reload persistence | UUID operation/device IDs, cached revision metadata, pending mutation envelope, IndexedDB `add` uniqueness and durable queue | unit/property tests; duplicate operation test; reload/reopen Playwright scenario | PASS |
| truthful global local-durability/sync primitive | deterministic `SyncSummary`, explicit degraded/pending/conflict/error/online-idle/synced states, `synced` gated by cloud proof | summary/unit tests; protected/public shell tests; 28/28 E2E | PASS |
| runtime safety for persisted local boundary | centralized strict parser before persisted metadata/cache/mutation values enter application logic | adversarial parser tests; 100% global coverage; mutation SUCCESS | PASS |
| blocked/version-change storage lifecycle degrades safely without reset | explicit `onblocked`, late-success close and `onversionchange` close | lifecycle tests; clean Full Verify | PASS |
| no local state used as cloud authorization authority | protected route resolves verified session + live project access before local store is opened/rendered | route/unit tests and member/outsider E2E | PASS |
| no Lot-10 sync engine or Lot-2+ business scope introduced | only foundations/counters/status/queue durability are implemented; remote replay/refresh/conflict orchestration remains absent | diff review from accepted WP-1.6 baseline; architecture/static gates | PASS |

Mechanical set result:

`required WP-1.7 responsibilities − implemented/evidenced responsibilities = ∅`

### Acceptance decision

- all expected WP-1.7 responsibilities are implemented or explicitly deferred by packet scope;
- all three Pass-B MAJOR findings are closed;
- fresh Pass B contains no unresolved BLOCKING/MAJOR;
- exact repaired implementation run `33895516028` is 5/5 SUCCESS including clean-checkout `npm run verify`;
- no out-of-scope Lot-10 synchronization coordinator or Lot-2+ feature implementation was introduced.

Result: **ACCEPTED**.

## Handoff

- Current state: `ACCEPTED`.
- Current/last pass: `C-ACCEPTED`.
- Acceptance implementation evidence: run `33895516028` on `46548702f304dbabcf4bd673a33afb1c0ec96a3d`, all five jobs SUCCESS including clean-checkout `npm run verify`.
- Findings: `WP17-AR-001`, `WP17-AR-002`, `WP17-AR-003` — all **CLOSED**; fresh Pass B **PASS**.
- Pass C: `required − implemented/evidenced = ∅`.
- Next permitted packet: WP-1.8, subject to its bounded Work Packet record and normal Pass A → B → C protocol. WP-1.9 and Lot 2+ remain forbidden until their sequencing gates are met.

# Work Packet Record — WP-1.7

## Identity

- Work Packet ID: `WP-1.7`
- Lot: `1`
- Name: Project-scoped repositories, local cache and sync primitives
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
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

### Planned implementation evidence

- pure tests for scope/UUID/envelope/sync-summary invariants;
- property tests for account+project partition keys and stable operation identity where useful;
- local-store contract tests with deterministic test doubles for application semantics;
- real Playwright IndexedDB tests proving persistence across reopen/reload and account/project isolation;
- private shell indicator tests and public-shell non-exposure regression;
- static/architecture/size/dead-code/security gates;
- full exact-head CI including clean-checkout `npm run verify` before Pass B.

### Pass A exit

- [ ] intended vertical slice exists
- [ ] applicable tests written
- [ ] no known untracked stub/TODO
- [ ] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [ ] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Not started. Fresh review must attack cross-account/project cache leakage, operation-ID collisions/reuse, malformed persisted data, IndexedDB failures/version behavior, misleading durability/sync UI, provider/auth-boundary drift, overreach into Lot 10 and test doubles that do not prove browser persistence.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires clean Pass B and mechanical EXPECTED vs IMPLEMENTED vs VERIFIED reconciliation with packet required-minus-evidenced = ∅.

## Handoff

- Current state: `IN_PROGRESS`.
- Current/next pass: `A-IMPLEMENT`.
- Last green verification: WP-1.6 acceptance run `33880216335` on implementation HEAD `61dca0718f8ff7372609d208050aba6a50271743`.
- Remaining blocker/finding: none; Pass A implementation is active.
- Next permitted action: implement WP-1.7 local project scope, IndexedDB durability, pending-operation envelope/store and private-shell sync/local-durability indicator only.

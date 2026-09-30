# WP-2.10 — Venue local cache and pending mutations

## Identity

- Work Packet ID: WP-2.10
- Lot: 2 — Venues core
- Name: Venue local cache and pending offline mutations
- State: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW — FAILED / WP210-AR-001 REMEDIATION CANDIDATE + WP210-AR-002 MAJOR OPEN`
- Primary bounded context: Venues + local-data/sync foundation
- Branch: `lot-2/venues-core`
- Activation base: `c5cfe273468eb56592f8fe8f0de9eb764d671a58`
- Activation-base CI: `36579954211` — five ordinary jobs SUCCESS including clean checkout; provider-only jobs skipped
- FIR: GitHub issue #42 — FTR-028 Venue local/offline foundation and mobile visit package
- Pass-A candidate: `eca752c145f9c59c1d0ca17d938569d8977fba92`
- Pass-A CI: `36713679555`, rerun attempt 2 — five ordinary jobs SUCCESS including clean checkout; provider-only jobs skipped

## Scope

### Primary Feature IDs

- FTR-028 — Lot-2 local/offline Venue foundation slice
- FTR-013 — local/read-model support for minimal Venue quick-add results

### Current-lot responsibilities covered

- cache essential Venue core records in the existing project/account-scoped IndexedDB store;
- keep cached Venue identity/status/core fields readable during temporary backend/network failure;
- persist supported local Venue edits before network acknowledgement;
- represent those edits as durable pending mutations with stable operation IDs/base revisions;
- make retry-safe Venue core update and lifecycle transition commands recognize the same operation ID after response loss;
- preserve pending Venue work across restart/session expiry;
- never expose one project/account's cached Venue records or queue under another local scope;
- retain cloud acknowledgement as the boundary for shared canonical truth;
- expose the existing sync counters/summary inputs needed by WP-2.11/WP-2.12 presentation;
- cache a successfully cloud-created quick-add Venue result. Canonical Venue creation itself remains online-confirmed in this packet because the frozen offline matrix does not require offline project/entity bootstrap and the accepted create path currently has no reviewed client-owned identity/receipt contract.

### Requirements / acceptance / security controls

- SYN-001, SYN-002, SYN-003, SYN-004 (Venue-local retry safety), SYN-007, SYN-008, SYN-009, SYN-010, SYN-011
- PWA-003 foundation, PWA-004 foundation, PWA-006 fallback behavior
- VEN-012 local/read-model handoff
- IAM-013 inherited pending-work preservation rule
- QLT-006 offline/reconnect/session-expiry automated coverage
- existing `venues.read` / `venues.write` authorization and project isolation remain unchanged

### Explicitly out of scope

- WP-2.11 gallery/table/detail/compare/deep-link UI;
- WP-2.12 mobile visit route/checklist/notes/measurements and full Venue offline-pin package;
- generic cross-domain sync/conflict engine, service-worker lifecycle and broad PWA hardening owned by Lot 10;
- automatic same-field merge/rebase beyond existing optimistic revision semantics;
- offline project bootstrap/membership/security-admin actions;
- offline private-media/document upload/finalization;
- Workers/Cloudflare provider changes;
- real/private wedding data.

## Dependency / sequencing

- Required prior packets: WP-2.1..WP-2.9A/B/C accepted.
- Downstream blocked: WP-2.11, then WP-2.12, then Lot-2 reconciliation/integration.
- Shared contracts: `LOCAL-FIRST.md`, `OFFLINE.md`, `SYNC.md`, `LOCAL-DATA-SCHEMA.md`, `PHYSICAL-SCHEMA-V1.md`, ADR 0003, existing `VenueRepositoryPort`, `VenueCommandPort`, `LocalProjectStore` and Supabase adapters.
- Accepted WP-2.1 SQL explicitly deferred operation receipts to the later sync packet; WP-2.10 owns that Venue-local closure.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 0 | 3 | 0 |
| persistent entity/table | 1 (`sync_mutation_receipts`) | 1 | 1 |
| migration family | 1 | 1 | 1 |
| RPC/public endpoint/capability command | 1 family | 2 | 2 |
| RLS/privileged authorization boundary | 1 receipt boundary | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 1 | 2 | 2 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **8** |

Cohesion: PASS. No split required.

## Expected vertical slice

- UI/route: no new production screen; WP-2.11/WP-2.12 consume the state later.
- application: Venue-local cache/queue/replay coordinator with typed mutation payloads and stable operation IDs.
- domain: existing Venue normalization/status/revision invariants remain authoritative.
- ports: extend only the minimum local-store and Venue mutation contracts needed for durable retry/ack/conflict state.
- infrastructure: IndexedDB support for replacing/removing mutation state and listing cached Venue records; Supabase Venue RPC/adapters gain receipt-aware retry semantics.
- cloud persistence: append-only migration creates the frozen-schema `sync_mutation_receipts` table (`operation_id` PK, project/user/device/entity/result revision), enables RLS, grants no direct browser table access, and lets the authorized Venue RPCs recognize/replay receipts. `activity_log` remains human-meaningful history and is not repurposed as the sync receipt store.
- local/offline: local durable write precedes remote attempt; response loss does not duplicate/reapply the same operation; stale revision becomes explicit conflict and local work remains retained.
- import/export/backup: no format change in this packet.
- UX/QIF: no route work; expose stable application sync state for downstream UI.

## RED-first gate

Pass A must start by proving the current implementation is insufficient in at least these cases:

1. response is lost after a successful Venue core update, then the same operation ID is retried;
2. response is lost after a successful Venue lifecycle transition, then the same operation ID is retried;
3. pending Venue mutation survives local-store reopen;
4. remote refresh cannot overwrite a cached Venue carrying a pending local mutation;
5. foreign project/user/device cache/queue remains rejected;
6. local durability unavailable produces a degraded result rather than false offline-success;
7. successful cloud acknowledgement removes/settles the pending mutation and updates cached revision.

The first two REDs must fail on the current server contract before receipt implementation. Do not weaken expected-revision checks to make them green.

## Pass A evidence — 2026-09-30

The required RED-first classes are now implemented and green for the intended reasons:

1. Venue core update can be retried after response loss with the same stable operation ID without incrementing revision twice;
2. lifecycle transition retry recognizes the same operation and does not duplicate activity history;
3. pending Venue work survives local-store close/reopen and a simulated session-expiry interruption;
4. remote refresh skips pending/conflicting cached Venue work;
5. foreign project/user/device local scope and cross-target settlement are rejected fail-closed;
6. local durability failure returns a degraded/pending-safe result rather than false offline success;
7. successful cloud acknowledgement atomically settles the pending mutation and writes the acknowledged cache revision.

The final Pass-A implementation also binds server receipts to the authenticated user, project, device, command class, entity and server result; preserves expected-revision conflict semantics; rejects changed-intent/cross-command operation-ID reuse; keeps the frozen physical receipt schema; makes pending intent/cache and failure-state/cache writes atomic; preserves sending state after acknowledgement-settlement failure; orders replay deterministically; and caches only cloud-confirmed quick-add Venues.

Exact implementation evidence:

- head: `eca752c145f9c59c1d0ca17d938569d8977fba92`;
- CI: `36713679555`, rerun attempt 2 — **5/5 SUCCESS**;
- unit/coverage: 201 files / 1,801 tests, 100% statements/branches/functions/lines;
- local DB/RLS/Pages integration: PASS, including Venue receipt pgTAP;
- browser: 40 E2E tests PASS;
- mutation: 82.50% score;
- `Full verify from clean checkout`: SUCCESS;
- provider-only AR-006 workflows: SKIPPED, as required for WP-2.10.

No production/private wedding data or external-provider mutation was used.

## Pass A — IMPLEMENT

### Planned evidence

- append-only canonical `sync_mutation_receipts` + Venue RPC idempotence migration with pgTAP allow/deny/replay/cross-user/cross-project tests;
- Supabase adapter tests for exact operation-ID forwarding and typed retry/conflict behavior;
- local-store tests for mutation replace/remove and cached Venue listing;
- application tests for cache-first reads, durable-before-network mutation, response-loss retry, restart/session-expiry retention, conflict retention and cross-project isolation;
- exact-head normal CI and clean-checkout verify.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable REDs turned green for the intended reason
- [x] no known untracked stub/TODO
- [x] packet moves to `REVIEW_PENDING`
- [x] current/next pass becomes `B-ADVERSARIAL-REVIEW`

## Handoff

- Current state: REVIEW_PENDING
- Current/next pass: B-ADVERSARIAL-REVIEW
- Pass-A green implementation: `eca752c145f9c59c1d0ca17d938569d8977fba92` / CI `36713679555` attempt 2, five ordinary jobs SUCCESS including clean checkout
- FIR: #42 — FTR-028 remains IN_PROGRESS because WP-2.12 owns downstream mobile-visit/offline-package completion
- Review findings: `WP210-AR-001` — MAJOR / remediation candidate green on exact-head CI but not closed until fresh Pass B; `WP210-AR-002` — MAJOR / OPEN — cloud refresh can overwrite a Venue mutation that becomes pending between the refresh cache read and cache write
- Pass-B record: `docs/roadmap/lot-2/WP-2.10-PASS-B-REVIEW-2026-09-30.md`
- Next permitted action: bounded RED-first remediation of WP210-AR-002 using an atomic queue-inspection + cache-write primitive, exact-head verification, then a new complete fresh Pass B over WP210-AR-001/002 and the full packet. No Pass C or WP-2.11 start is authorized.

## Pass B result — 2026-09-30

Fresh adversarial review failed on one MAJOR finding:
`WP210-AR-001`. See
`docs/roadmap/lot-2/WP-2.10-PASS-B-REVIEW-2026-09-30.md`.

The server receipt/replay boundary, scope isolation, durable-before-network
write, response-loss/restart behavior, pending-refresh protection and
cloud-confirmed quick-add cache passed review. The open finding is local:
settlement of one acknowledged mutation may overwrite the cached working value
of a later unresolved same-Venue mutation. State is `REVIEW_FAILED`; remediation
must preserve later local intent atomically before a new complete Pass B.

## Additional Pass-B finding — WP210-AR-002 — MAJOR / OPEN

The post-AR-001 remediation review found a second local TOCTOU. `refreshFromCloud()`
currently reads the cached Venue and later writes the cloud snapshot in a separate
transaction. A local mutation can become durable in between those operations, so
the refresh may overwrite a newly-pending working value with a synced cloud value.
Closed RED-only PRs #47/#48 reproduce the race without merging the red state.

Required remediation is bounded to an atomic local-store primitive that inspects
the scoped pending-mutation queue and conditionally writes the cloud cache record
inside one IndexedDB transaction. Malformed/foreign queue rows must fail closed.
WP210-AR-001 remains unclosed until a new complete fresh Pass B, even though its
current remediation candidate is exact-head green.

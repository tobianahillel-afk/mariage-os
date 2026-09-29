# WP-2.10 — Venue local cache and pending mutations

## Identity

- Work Packet ID: WP-2.10
- Lot: 2 — Venues core
- Name: Venue local cache and pending offline mutations
- State: `READY`
- Current pass: `PLAN` (next: `A-IMPLEMENT`)
- Primary bounded context: Venues + local-data/sync foundation
- Branch: `lot-2/venues-core`
- Activation base: `c5cfe273468eb56592f8fe8f0de9eb764d671a58`
- Activation-base CI: `36579954211` — five ordinary jobs SUCCESS including clean checkout; provider-only jobs skipped

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

## Pass A — IMPLEMENT

### Planned evidence

- append-only canonical `sync_mutation_receipts` + Venue RPC idempotence migration with pgTAP allow/deny/replay/cross-user/cross-project tests;
- Supabase adapter tests for exact operation-ID forwarding and typed retry/conflict behavior;
- local-store tests for mutation replace/remove and cached Venue listing;
- application tests for cache-first reads, durable-before-network mutation, response-loss retry, restart/session-expiry retention, conflict retention and cross-project isolation;
- exact-head normal CI and clean-checkout verify.

### Pass A exit

- [ ] intended vertical slice exists
- [ ] applicable REDs turned green for the intended reason
- [ ] no known untracked stub/TODO
- [ ] packet moves to `REVIEW_PENDING`
- [ ] current/next pass becomes `B-ADVERSARIAL-REVIEW`

## Handoff

- Current state: READY
- Current/next pass: A-IMPLEMENT
- Last green verification: activation base `c5cfe273...` / CI `36579954211`, five ordinary jobs SUCCESS
- Remaining blocker/finding: none; RED-first evidence required before production implementation
- Next permitted action: create failing WP-2.10 retry/offline tests against the accepted current contracts, then implement Pass A.
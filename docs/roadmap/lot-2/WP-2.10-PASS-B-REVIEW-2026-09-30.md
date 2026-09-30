# WP-2.10 — Fresh Pass B adversarial review — 2026-09-30

## Review identity

- Packet: WP-2.10 — Venue local cache and pending mutations
- Review base: `333f584fd00ca2830839540f43465d21072e7616`
- Pass-A implementation base: `eca752c145f9c59c1d0ca17d938569d8977fba92`
- Pass-A CI: `36713679555` rerun attempt 2 — 5/5 SUCCESS, clean checkout included
- Review-entry CI: `36715447094` — 5/5 SUCCESS, clean checkout included
- FIR: #42 / FTR-028
- Review type: complete fresh adversarial Pass B
- Verdict: **FAIL — WP210-AR-001 remediation candidate / WP210-AR-002 MAJOR OPEN**

## Contracts reconstructed independently

The review re-read the packet and normative contracts rather than accepting the
Pass-A conclusion:

- `docs/roadmap/lot-2/WP-2.10.md`;
- `docs/architecture/SYNC.md`;
- `docs/architecture/OFFLINE.md`;
- `docs/architecture/LOCAL-DATA-SCHEMA.md`;
- `docs/domain/INVARIANTS.md` — sync/local invariants 82–88;
- `docs/ACCEPTANCE-SCENARIOS.md` — ACC-008, ACC-010, ACC-011, ACC-012;
- `docs/ux/FORMS-AUTOSAVE.md`;
- `docs/security/AUTHENTICATION.md`;
- frozen physical receipt schema and the accepted WP-2.1..2.9 dependency chain.

## Review matrix

| Area | Result | Evidence / review conclusion |
|---|---|---|
| durable-before-network Venue edit | PASS | pending mutation + working cache are written atomically before the remote attempt; storage failure returns `durability_unavailable` and does not call the remote mutation |
| retry-safe server receipt | PASS | receipt is server-owned/no browser grants; replay is bound to operation/project/user/device/command/entity/result revision and expected-revision semantics remain authoritative |
| changed-intent / cross-command / cross-user / cross-project operation reuse | PASS | direct pgTAP denies the mismatches and no duplicate Venue revision/history side effect is accepted |
| restart / response-loss replay | PASS | stable operation ID and base revision survive local reopen; `sending` and retryable states are replayable |
| cloud refresh vs pending/conflict | PASS | refresh skips a cached Venue already marked pending/conflict |
| project/user/device local isolation | PASS | database scope metadata and mutation-scope parsing fail closed; project/account switch cannot open the same local namespace |
| local acknowledgement atomicity | **FAIL** | the settlement transaction is atomic for one operation, but always overwrites the cached record with that operation's acknowledgement even when a later unresolved mutation for the same Venue remains |
| session expiry | PASS for current packet boundary | queue survival/restart is covered; no production auto-sync consumer is introduced by WP-2.10, while remote RPCs still require live server authorization. UI/auth orchestration remains subject to downstream integration review |
| cloud-confirmed quick-add cache | PASS | create remains online-confirmed; local cache failure does not misreport cloud creation failure |
| provider / private-file / UI scope | PASS | no provider action, private-file queue or WP-2.11/2.12 route work is introduced |

## Finding WP210-AR-001 — MAJOR — OPEN

### Title

Acknowledging an older queued mutation can overwrite a newer unresolved local
Venue intent in the cache.

### Expected

Normative local-first rules require:

- unsynchronized work is not ordinary cache and is not silently evicted;
- a remote/cloud result must not wholesale-replace local state while pending
  work for that entity remains;
- a locally pending edit must remain user-visible/recoverable across a process
  restart;
- cloud acknowledgement is authoritative for shared truth, but does not erase a
  separate later local intent that has not yet been acknowledged or explicitly
  resolved.

### Observed

`IndexedDbProjectStore.settlePendingMutationWithCachedRecord()` calls
`runAtomicSettlementWithCache()`. The transaction:

1. looks up and validates only the operation being settled;
2. deletes that operation from `pending_mutations`;
3. unconditionally writes the supplied acknowledged record to
   `cached_records`.

It does not inspect whether another unresolved mutation in the same scoped
database targets the same `recordType/entityId`.

Multiple pending Venue operations for the same entity are legal in the current
model: the queue is keyed by operation ID, replay explicitly sorts multiple
Venue mutations, and each new local edit can atomically replace the working
cache while adding a distinct operation.

Therefore this sequence is possible:

1. mutation M1 is pending for Venue V;
2. a later mutation M2 is pending for the same Venue V; the cache contains M2's
   local working value and marker `pending`;
3. M1 succeeds remotely;
4. M1 settlement atomically deletes M1 **and overwrites the cache** with M1's
   older acknowledged value marked `synced`;
5. M2 still exists in the durable queue;
6. the process closes before M2 is replayed.

After reopen, M2 survives, but the Venue read model shows the older
acknowledgement as `synced` instead of the retained later local intent. A
subsequent cloud refresh may also treat that cache as replaceable because its
marker is no longer pending/conflict.

### Impact

Canonical cloud integrity is not broken, and M2's queue payload is not deleted.
However the user-visible local working state can temporarily appear to lose an
unsynchronized edit and falsely look synchronized across a real crash/restart
boundary. This violates the packet's local-durability/read-model contract and is
MAJOR for an offline-first foundation.

### Required remediation

Before WP-2.10 can re-enter REVIEW_PENDING:

1. add a RED test with M1 and M2 unresolved for the same Venue, latest local
   cache reflecting M2, then settle M1;
2. make the settlement transaction inspect the same transaction's mutation
   store before replacing the cache;
3. if another unresolved scoped mutation targets the same cached record, delete
   only the acknowledged operation and preserve the current local cached
   working record/marker atomically;
4. if no other unresolved mutation targets that record, keep the existing
   acknowledgement behavior and write the synchronized cache;
5. malformed/foreign persisted rows encountered by this decision must fail
   closed rather than permit cache overwrite;
6. add restart/reopen evidence that the later intent remains visible and queued;
7. rerun focused IndexedDB/coordinator tests plus exact-head five-job CI and
   clean-checkout verification;
8. run a new complete fresh Pass B. This finding is not closed merely by
   implementation green.

No schema downgrade, queue deletion, last-write-wins fallback, provider action
or scope expansion is authorized.

## Other observations

- Client `createdAt` is used only to choose deterministic local replay attempt
  order; server revision/transaction checks still determine canonical
  acceptance. No silent timestamp-based server last-write-wins was observed in
  this packet.
- The current coordinator accepts canonical port-level Venue inputs. WP-2.11
  must not bypass the existing domain validation/normalization layer when it
  wires forms to this coordinator. No production UI consumer exists in
  WP-2.10, so this is a downstream integration check rather than a current
  finding.
- Session-expiry UI gating and membership revalidation must be rechecked again
  when WP-2.11/WP-2.12 actually wire reconnect/replay; this packet does not add
  automatic background sync.

## Verdict and transition

Pass B verdict: **FAIL**.

```text
REVIEW_PENDING
-> REVIEW_FAILED — WP210-AR-001 MAJOR / OPEN
```

Next permitted work is bounded remediation of WP210-AR-001, starting with a
reproducing RED. WP-2.11 remains blocked. No Pass C or WP-2.10 acceptance is
authorized.

## Post-review remediation review finding WP210-AR-002 — MAJOR — OPEN

After the WP210-AR-001 remediation candidate was exercised with additional REDs,
a separate refresh race was reproduced in closed RED-only PRs #47 and #48.

### Title

Cloud refresh can overwrite a Venue mutation that becomes pending between cache
inspection and cache replacement.

### Observed

`VenueLocalSyncCoordinator.refreshFromCloud()` performs:

1. `getCachedRecord("venue", venue.id)`;
2. a pending/conflict marker decision;
3. later `putCachedRecord(..., "synced")`.

Those are separate local transactions. If a new mutation is durably queued with
a pending cached working value after step 1 but before step 3, the refresh writes
the cloud snapshot over that local intent while the pending mutation remains.

### Required remediation

- add a store-level atomic refresh primitive spanning the pending-mutation and
  cache stores;
- inside that one transaction, parse/validate the entire scoped queue and skip
  the cloud cache write when any unresolved mutation targets the same record;
- malformed or foreign persisted queue rows fail closed and must not permit the
  cache write;
- retain independent records and normal no-pending refresh behavior;
- keep the RED race covered and run exact-head five-job CI + clean checkout;
- then run a new complete fresh Pass B. Neither WP210-AR-001 nor WP210-AR-002 is
  closed merely by implementation green.

No schema downgrade, queue deletion, last-write-wins fallback or scope expansion
is authorized.

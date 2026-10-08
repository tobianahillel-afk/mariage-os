# WP-2.12U — PostgREST-safe replay conflict signaling

## Identity

- Work Packet ID: `WP-2.12U`
- Lot: 2 — Venues core
- Name: PostgREST-safe replay conflict signaling across accepted R/S/T RPCs
- State: `READY` — activation-governance HEAD must pass exact-head CI before Pass A starts
- Current pass: `PLAN` (next: `A-IMPLEMENT / RED first`)
- Branch: `lot-2/venues-core`
- Parent packet: `WP-2.12` — BLOCKED/FROZEN with prior GREEN work and draft #99 preserved
- Activation base: `58c68bf34011ad3b8c72f800d00902b38d3b3913`
- Activation-base CI: `37799765769` — **5/5 SUCCESS**, including full verify from clean checkout
- Primary FIR: #42 / FTR-028 support only; no new product Feature
- Trigger date: 2026-10-08

## Why this packet exists

During the exact-head parent resumption gate, current Supabase guidance was
rechecked as required for database/API work.

Supabase now documents that a custom PL/pgSQL
`RAISE ... ERRCODE '40001'` inside an RPC can trigger PostgREST 14 retry
behavior because `40001` is interpreted as a transient serialization failure.
The documented failure mode can repeatedly execute the transaction and flood
logs until the request is terminated. Mariage OS also pins
`@supabase/supabase-js 2.112.4`; current client guidance documents automatic
retries for selected transient PostgREST responses.

The accepted replay-safe support functions intentionally use custom `40001`
for **business precondition conflicts**, not native PostgreSQL serialization
failures:

1. Fact Observation replay: missing/non-active superseded observation;
2. Member Rating replay: stale/missing expected revision / stale receipt result;
3. checked visit-source provenance: stale source type or revision.

Those custom business conflicts must not use a retry-class SQLSTATE.

Normative upstream evidence:
- https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b
- https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js
- PostgREST custom `PTxyz` error contract: https://postgrest.org/en/stable/references/errors.html

## Frozen responsibility

Replace only the explicit application-generated replay/precondition conflict
signals in the accepted R/S/T RPC family with a non-retryable HTTP precondition
signal.

The chosen contract is:

- SQLSTATE `PT412`;
- HTTP 412 Precondition Failed;
- existing typed application result remains `conflict`;
- adapters continue to recognize genuine database `40001` as conflict;
- no ordinary application path should newly retry `PT412`.

This packet must not weaken authorization, RLS, replay identity, operation
receipts, exact response validation, source-type/revision checks or accepted
legacy overload compatibility.

## Bounded implementation surface

Expected changes only:

- one forward-only Supabase migration redefining the three accepted replay-safe
  functions with `PT412` for their explicit business conflicts;
- direct pgTAP regression that each stale/precondition path returns `PT412`
  and creates no side effect beyond the already-accepted semantics;
- Fact/Evidence provider error mapping adds `PT412 -> conflict`;
- Member Rating provider error mapping adds `PT412 -> conflict`;
- focused application/adapter regressions prove queued replay retains conflict
  semantics and does not reinterpret `PT412` as retryable/permanent;
- accepted `40001` mapping remains covered for genuine provider/database
  serialization failures.

No new table, column, index, trigger, RLS policy, permission key, provider,
Storage path, UI or product Feature belongs here.

## Complexity / cohesion

| Complexity source | Points |
|---|---:|
| one forward-only migration family | 1 |
| Fact Observation replay RPC conflict signal | 2 |
| Member Rating replay RPC conflict signal | 2 |
| checked provenance-link RPC conflict signal | 2 |
| table/entity/RLS/permission/UI/provider | 0 |
| **Total** | **7** |

Cohesion: **PASS**. All three changes implement one platform-compatibility
invariant: business conflicts emitted through PostgREST must not masquerade as
transaction serialization failures.

Folding this compatibility work back into the already-9-point parent would
again violate the >10 orchestration rule. R/S/T remain accepted; U is a bounded
forward compatibility layer over their APIs.

## RED-first gate

No U production migration or adapter change before this activation-governance
HEAD passes all five ordinary jobs including clean checkout.

Then create an isolated closed/unmerged RED-only PR proving:

1. current replay-safe Fact Observation conflict paths still return `40001`;
2. current replay-safe Member Rating conflict paths still return `40001`;
3. current checked visit-source provenance stale path returns `40001`;
4. Fact/Evidence adapter does not currently type `PT412` as `conflict`;
5. Member Rating adapter does not currently type `PT412` as `conflict`;
6. no write/link/queue settlement is accepted on the stale/conflict path.

RED evidence must fail for those intended reasons only.

## Pass A GREEN evidence

At minimum:

- direct pgTAP receives `PT412` for every explicit stale/precondition conflict
  previously raised as custom `40001`;
- valid/idempotent replay paths still return the same accepted success receipts;
- outsider/revoked/cross-project/invalid-input failures retain their existing
  42501/22023/other accepted fail-closed behavior;
- Fact/Evidence and Rating adapters classify `PT412` as typed `conflict`;
- genuine provider/database `40001` is still classified as conflict;
- parent structured-replay conflict persistence remains conflict, never
  `failed_retryable`;
- current R/S/T direct pgTAP and adapter evidence stays green;
- Core, DB/RLS/promotion, browser/mutation, preview and clean checkout are
  exact-head green.

## Explicitly out of scope

- parent #99 structured replay reconciliation;
- new replay identity or receipt semantics;
- changing genuine PostgreSQL transaction isolation/serialization behavior;
- media/local binary lifecycle;
- generic sync/PWA;
- provider campaign;
- real/private wedding data.

## Pass A exit

- [ ] activation-governance HEAD 5/5 including clean checkout
- [ ] isolated RED proves the retry-prone custom 40001 contract
- [ ] forward-only migration emits PT412 for bounded business conflicts
- [ ] adapters preserve typed conflict semantics for PT412 and genuine 40001
- [ ] accepted R/S/T authorization/replay behavior remains green
- [ ] exact-head 5/5 CI including clean checkout
- [ ] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## Handoff

- Current state: READY, **activation exact-head CI pending**
- Current/next pass: PLAN → A-IMPLEMENT / RED first
- Parent resumption base: `58c68bf34011ad3b8c72f800d00902b38d3b3913` / CI `37799765769` — 5/5
- Accepted dependencies: WP-2.12R / S / T terminal ACCEPTED / COMPLETE
- Parent draft #99: preserved, unchanged, frozen
- Open U findings: ∅
- Next permitted action: pass this activation-governance HEAD through all five
  ordinary CI jobs including clean checkout; only then capture RED-only
  evidence and begin the bounded compatibility implementation.

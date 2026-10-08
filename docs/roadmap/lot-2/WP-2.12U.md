# WP-2.12U — PostgREST-safe replay conflict signaling

## Identity

- Work Packet ID: `WP-2.12U`
- Lot: 2 — Venues core
- Name: PostgREST-safe replay conflict signaling across accepted R/S/T RPCs
- State: `REVIEW_FAILED / REMEDIATION` — fresh review findings `WP212U-AR-006/007/008` pending verification
- Current pass: `A-IMPLEMENT / GREEN remediation`
- Branch: `lot-2/venues-core`
- Parent packet: `WP-2.12` — BLOCKED/FROZEN with prior GREEN work and draft #99 preserved
- Activation base: `58c68bf34011ad3b8c72f800d00902b38d3b3913`
- Activation-base CI: `37799765769` — **5/5 SUCCESS**, including full verify from clean checkout
- Activation-governance head: `2c01f8a2b8f48bd069e0382a46e940b385fea224` / CI `37807120195` — **5/5 SUCCESS**, clean checkout included
- Primary FIR: #42 / FTR-028 support only; no new product Feature
- Trigger date: 2026-10-08

## Why this packet exists

During the exact-head parent resumption gate, current Supabase guidance was
rechecked as required for database/API work.

Supabase now documents that a custom PL/pgSQL
`RAISE ... ERRCODE '40001'` inside an RPC can trigger a PostgREST 14
server-side transaction retry loop because `40001` is interpreted as a
transient serialization failure. The documented failure mode can repeatedly
execute the transaction and flood logs until the request is terminated;
PostgREST 16 contains the upstream fix.

Mariage OS pins `@supabase/supabase-js 2.112.4`. Current client guidance also
documents automatic retries for selected transient PostgREST responses, but
only for idempotent GET/HEAD requests; a normal `.rpc()` call uses POST and is
not client-retried by default. WP-2.12U therefore addresses the PostgREST 14
server-side `40001` classification hazard, not a client-side RPC retry loop.

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

- one forward-only Supabase migration redefining three accepted replay RPC
  families (four function bodies, including the retained five-argument Member
  Rating compatibility overload) with `PT412` for nine explicit custom
  business/precondition conflict paths;
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

- [x] activation-governance HEAD 5/5 including clean checkout
- [x] isolated RED proves the retry-prone custom 40001 contract
- [x] forward-only migration emits PT412 for bounded business conflicts
- [x] adapters preserve typed conflict semantics for PT412 and genuine 40001
- [x] accepted R/S/T authorization/replay behavior remains green on the pre-remediation GREEN head
- [x] AR-002/003 remediation head `9849498cb9d900f9a541cb5a5083ced1618b325c` / CI `37815477583` passes exact-head 5/5 including clean checkout
- [ ] fresh independent re-review reports no open bounded P0/P1/P2 finding
- [ ] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## Review findings and remediation evidence

- Activation-governance head `2c01f8a2b8f48bd069e0382a46e940b385fea224` / CI `37807120195`: **5/5 SUCCESS**, including clean checkout.
- RED-only PR #114 / `deb8ebd24bd5bf424b618e6e4e34832d521430bb` / CI `37808965919`: closed unmerged after reproducing the intended R/S/T `40001` and adapter-mapping gaps.
- GREEN PR #115 pre-finding reviewed head `ae9de6a9465929689ea4a006116a60a141ea0730` / CI `37813382721`: **5/5 SUCCESS**; Core 237 files / 2,063 tests / 100% coverage, DB 86 files / 1,565 tests PASS, E2E 40/40, mutation 83.78%.
- `WP212U-AR-001` **CLOSED / VERIFIED** — typed Rating `conflict` is now preserved through `saveVenueMemberRating` and reaches the parent structured replay conflict state.
- Fresh Codex re-review on `ae9de6a...` opened two further bounded findings:
  - `WP212U-AR-002` **P1 / REMEDIATION** — durable packet/status handoff was still stale at READY/PLAN.
  - `WP212U-AR-003` **P1 / REMEDIATION** — direct pgTAP coverage was missing for Fact missing-superseded-observation, Rating missing acknowledged row, and Rating nonzero expected revision with no current row.
- AR-002/003 remediation head `9849498cb9d900f9a541cb5a5083ced1618b325c` / CI `37815477583` passed **5/5 SUCCESS**, including clean checkout.
- Fresh complete Codex review on `9849498c...` verified AR-002/003 but opened one remaining bounded governance finding:
  - `WP212U-AR-004` **P1 / REMEDIATION** — the authoritative WP-2.12U section in `IMPLEMENTATION-STATUS.md` still described the obsolete READY/PLAN activation state.
- AR-004 first remediation head `1c9deef42c041bd3628ca9c530eb2da6c3fb5db5` / CI `37819079475` passed **5/5 SUCCESS**, including clean checkout.
- Fresh complete Codex review on `1c9deef4...` confirmed the status-board reconciliation but found the Lot-2 coverage matrix still described U as READY/activation-pending and the parent as active in several responsibility rows. This is the same AR-004 durable-handoff inconsistency, not new implementation scope.
- AR-004 durable-map remediation head `1cd40096cc62e45b7adee90c2d5e7defd0b307ce` / CI `37820711030` passed **5/5 SUCCESS**, including clean checkout. Fresh complete review confirmed the durable-map contradiction is gone, so `WP212U-AR-004` is **CLOSED / VERIFIED**.
- That same fresh review opened `WP212U-AR-005` **P1 / REMEDIATION**: the acknowledged-rating PT412 branch proved the error code but did not directly prove the newer rating row and the original replay receipt remained unchanged.
- AR-005 final test-remediation head `a47a12d844dcd8f9c61303f904c304982da6040c` / CI `37828593485` passed **5/5 SUCCESS**, including clean checkout. Direct pgTAP postconditions prove rating=8/revision=2, receipt result_revision=1, and the original receipt→rating binding remain unchanged.
- Remediation/status seal `1331706345368fe1a2658eb7561a10126ae22416` / CI `37829872447` passed **5/5 SUCCESS**, including clean checkout. Fresh complete Codex review on that exact head verified AR-005 but opened two further bounded P1 findings:
  - `WP212U-AR-006` **P1 / REMEDIATION** — the still-granted legacy five-argument `set_venue_member_rating` overload retained application-generated `40001` on both optimistic-conflict branches, leaving the PostgREST retry hazard reachable during the compatibility window.
  - `WP212U-AR-007` **P1 / REMEDIATION** — this packet identity still named AR-004 as the active blocker while the durable handoff/status/matrix correctly named AR-005.
- AR-006 implementation now redefines the retained five-argument overload in the U migration with `PT412` for both stale branches and adds direct pgTAP zero-side-effect coverage for existing-row and missing-row stale cases. AR-007 is remediated by synchronizing the packet identity with the current open finding set. Exact-head CI + a new complete review remain required.
- The first AR-006/007 CI `37831858172` failed at `db:start` because the copied legacy five-argument SQL overload used invalid single-dollar function delimiters. Fix: `f4a3492528f8dfaa194af0d4232eb49e8d8c6c9b`. The latest bounded GREEN head `31ded6ba077baa3fa24a1dcc19a24ca2a5eed61a` / CI `37837801921` passed **5/5 SUCCESS**, clean checkout included. Its fresh independent review identified an additional stale AR-005 reference in the canonical implementation-status section; that documentation-only AR-007 continuation is corrected on the next head, without changing the SQL or application behavior.

## Handoff

- Current state: **REVIEW_FAILED / REMEDIATION**
- Current/next pass: A-IMPLEMENT GREEN remediation → exact-head CI → fresh independent re-review
- Parent resumption base: `58c68bf34011ad3b8c72f800d00902b38d3b3913` / CI `37799765769` — 5/5
- Accepted dependencies: WP-2.12R / S / T terminal ACCEPTED / COMPLETE
- Parent draft #99: preserved, unchanged, frozen
- Open U findings: `WP212U-AR-006/007/008` pending exact-head verification
- Closed / verified: `WP212U-AR-001..005`
- AR-005 evidence head: `a47a12d844dcd8f9c61303f904c304982da6040c` / CI
  `37828593485` — **5/5 SUCCESS**, including clean checkout; fresh complete
  review on `1331706345368fe1a2658eb7561a10126ae22416` verified AR-005.
- Previous code+documentation GREEN head: `31ded6ba077baa3fa24a1dcc19a24ca2a5eed61a` / CI `37837801921` — **5/5 SUCCESS** including clean checkout. Subsequent AR-007 authoritative-status follow-up `30227deed15d89aae35e5368a05cfdb79022a2f6` / CI `37839906667` passed **5/5 SUCCESS**; its fresh review opened AR-008, remediated in tests at `d35e77be...` and awaiting fresh exact-head CI/review.
- Next permitted action: prove the AR-006/007/008 remediation with all five
  ordinary exact-head CI jobs including clean checkout, then request a new
  fresh complete independent Codex review of that SAME exact head. Only a clean
  verdict with zero unresolved bounded P0/P1/P2 findings may close AR-006/007/008,
  move U to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`, and permit canonical GREEN
  landing. Parent #99 remains BLOCKED/FROZEN.

## Fresh Pass-B follow-up — AR-008 (2026-10-08)

- PR #115 / prior head `30227deed15d89aae35e5368a05cfdb79022a2f6` / CI `37839906667` passed **5/5 SUCCESS** including clean checkout; the fresh independent review on that head reported another P1 evidence gap.
- `WP212U-AR-008` **P1 / REMEDIATION** — the seven-argument stale-revision `PT412` pgTAP test checked absence of a new receipt, but not the *post-call* rating and revision invariants.
- Bounded test-only correction `d35e77be9807a315bd5afa3895af6e1b9149dbd7` now asserts the existing `love_score` rating remains **8** and revision remains **2** after that exact stale call; the no-receipt assertion remains.
- AR-006/007 remain pending fresh independent confirmation; AR-008 remains open until current exact-head CI **5/5** and a new complete fresh Pass B are clean. No parent #99 work or provider campaign is authorized.

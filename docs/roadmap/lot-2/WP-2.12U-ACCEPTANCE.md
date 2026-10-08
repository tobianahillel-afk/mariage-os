# WP-2.12U — Pass C acceptance reconciliation

Status: **PASS C COMPLETE — EXPECTED ↔ IMPLEMENTED ↔ VERIFIED gap ∅; acceptance-record exact-head CI pending**.

This is the separate bounded Pass C for WP-2.12U: PostgREST-safe signaling of application-generated business/precondition conflicts in the accepted Fact Observation (R), Member Rating (S), and checked in-person provenance-link (T) RPC families.

It does **not** accept the parent WP-2.12 workflow, PR #99, local binary/media capture, generic offline sync, Lot 2 integration, or external/provider deployment. Support packets R/S/T remain independently accepted.

## Entry and exact-head evidence

- Accepted prerequisites: WP-2.12R, S, T each terminal **ACCEPTED / COMPLETE**, with final five-job CI including clean checkout.
- U activation seal `2c01f8a2b8f48bd069e0382a46e940b385fea224` / CI `37807120195`: 5/5 SUCCESS.
- Isolated RED-only PR #114 / `deb8ebd24bd5bf424b618e6e4e34832d521430bb` / CI `37808965919` reproduced the custom-`40001` and missing-`PT412` adapter contracts; closed **without merge**.
- GREEN PR #115 exact independently reviewed head `a4850a3535b2a98babb90837c4f873a26130515f` / CI `37850249038`: 5/5 SUCCESS, including full clean checkout; independent complete Codex review found no new bounded issue, with zero unresolved threads.
- Canonical squash `45f28bbfa77ec1bf66e344a5d3cf3b1fecb95626` has identical tree `ebb5a29b59da9969bb49a44068450ccce0d60b53` and CI `37852529610`: 5/5 SUCCESS, clean checkout included.
- Clean Fresh Pass-B record: `docs/roadmap/lot-2/WP-2.12U-FRESH-PASS-B-2026-10-09.md` — PASS, AR-001..008 CLOSED / VERIFIED, no new P0/P1/P2 finding.
- Fresh Pass-B/status seal `4be36d5d86d9cc3b2073f9f4720b69ad4f9b72ba` / CI `37853700955`: **5/5 SUCCESS**, including Full verify from clean checkout.
- Primary FIR #42 / FTR-028 remains IN_PROGRESS under parent WP-2.12; U creates no standalone product Feature.
- Optional redundant review-only PR #116 was closed unmerged after an independent-review quota refusal. It is not considered a successful review or an acceptance gate.

## EXPECTED ↔ IMPLEMENTED ↔ VERIFIED

| Bounded U responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
| --- | --- | --- | --- | --- |
| Distinguish business conflict from SQL transaction failure | Replay/precondition disagreements must not trigger PostgREST retries meant for true serialization errors | Explicit custom `40001` conflicts replaced by `PT412` (HTTP 412), genuine database `40001` unchanged | SQL migration review, RED #114, direct pgTAP and Fresh Pass B | PASS |
| Three accepted RPC families, four function bodies | Fact observation, both rating overloads and checked provenance-link continue their original signatures/semantics | One forward-only migration redefines the four bounded bodies | Migration-chain/promotion, exact-signature tests, CI DB/RLS | PASS |
| Fact Observation stale/supersession semantics | Missing/non-active superseded observation rejects deterministically, without write or acknowledgement | Accepted replay-safe fact RPC raises PT412 only for custom business/precondition conflict | Direct PT412 pgTAP with observation/receipt state invariants, adapter and service tests | PASS |
| Current seven-argument Rating | Stale expected revision or replay conflict must preserve previous rating and revision without minting receipt | Receipt-aware command raises PT412 with retained authorization/idempotency checks | Direct stale/acknowledged conflict tests assert rating=8, revision=2, unchanged receipt and no new receipt | PASS |
| Legacy five-argument Rating | Still-granted compatibility overload must not retain retry-class business errors or create replay receipt | Existing and missing rating stale-guard paths emit PT412; legacy bridge retained without new current-client use | Direct post-state/zero-side-effect pgTAP for both stale branches; #115 independent review | PASS |
| Atomic visit-source provenance | Source type/revision drift must never link, even after pre-read | Checked-link RPC retains atomic source type and revision verification and uses PT412 for business conflict | Direct stale/wrong-type and zero-link tests, T accepted suite, Fresh Pass B | PASS |
| Fact error mapping | PT412 is typed `conflict`, not generic persistence failure, success or retryable transport state | Fact/Evidence Supabase adapter recognizes PT412 and genuine PG 40001 | Adapter negatives; structured local queue conflict handling tests | PASS |
| Member-rating error mapping | PT412 and genuine PG 40001 remain typed conflict end-to-end | Rating adapter/service propagate typed conflict | Rating adapter/service tests, parent coordinator conflict-state regressions | PASS |
| Business conflict must preserve data | Rejected operations may not alter an existing row, receipt, source link or settle local pending work | Accepted R/S/T precondition checks reject before write/receipt settlement | Direct after-call rating/revision/receipt invariants, fact/link zero-side-effect pgTAP and local conflict tests | PASS |
| Authentication, authorization and tenant isolation | No bypass from changed error class; unauthenticated, revoked, outsider, foreign project remain denied | Existing live auth/permission predicates, project identity and RLS/grants retained | Direct DB/RLS denied paths; migration-chain security and legacy/current overload evidence | PASS |
| Strict input errors | Invalid inputs preserve their prior non-conflict failure behavior; only custom business preconditions become PT412 | Existing invalid-input checks kept; PT412 used only for defined conflicts | Direct SQL negative tests and source review | PASS |
| Forward-only compatible migration | No new table/column/index/trigger/RLS policy/permission/provider added | `20261008163000_postgrest_safe_replay_conflicts.sql` plus bounded adapter/test changes | DB migration/promotion, static/security/architecture, reviewed diff | PASS |
| Durability and review governance | Open findings tracked in U packet, status, matrix until verified; no acceptance from a failed/quotafull review | Historical AR-001..008 closed after direct regressions and successful complete #115 review; #116 refused review excluded | Clean identical-tree review, zero unresolved threads, Fresh Pass-B seal 5/5 | PASS |
| Support packet isolation | Parent PR #99/media/Lot 10 scope stays untouched | U changed bounded R/S/T RPC conflict signaling, adapter mapping, tests and governance only | Diff scope review, CI tests, fresh review | PASS |

## Historical findings and reconciliation

| Finding | Pass C disposition |
| --- | --- |
| WP212U-AR-001 — typed rating conflict through application service | CLOSED / VERIFIED |
| WP212U-AR-002 — stale packet state/handoff | CLOSED / VERIFIED |
| WP212U-AR-003 — direct converted PT412 evidence | CLOSED / VERIFIED |
| WP212U-AR-004 — authoritative status/matrix contradiction | CLOSED / VERIFIED |
| WP212U-AR-005 — acknowledged-rating no-side-effect postconditions | CLOSED / VERIFIED |
| WP212U-AR-006 — legacy five-argument compatibility PT412 branches | CLOSED / VERIFIED |
| WP212U-AR-007 — synchronized packet/status/matrix review state | CLOSED / VERIFIED |
| WP212U-AR-008 — stale seven-argument post-call rating/revision/receipt invariants | CLOSED / VERIFIED |
| New independent Fresh Pass B findings | ∅ |

## Gap calculation

```text
required bounded WP-2.12U responsibilities
- implemented WP-2.12U responsibilities
- verified WP-2.12U responsibilities
= ∅
```

## Scope, safety and next gate

- The business-conflict PT412 contract is limited to explicit application-generated precondition rejection; it does not transform a genuine native PostgreSQL serialization failure.
- All accepted R/S/T replay, operation-receipt, source type/revision, live authorization, tenancy and compatibility invariants remain enforced.
- No real/private wedding data, new external provider campaign, additional PostgreSQL table/RLS family, parent #99 merge or local-media implementation was used for U.
- Parent WP-2.12 and its draft PR #99 remain **BLOCKED / FROZEN**.
- R/S/T acceptance is neither reopened nor silently widened.

## Pass C verdict

**PASS — EXPECTED ↔ IMPLEMENTED ↔ VERIFIED gap ∅** on the bounded U responsibility.

This is an acceptance *reconciliation*, not the final acceptance seal.
WP-2.12U remains **ACCEPTANCE_PENDING** until the exact HEAD containing this record passes all five ordinary CI jobs, including `Full verify from clean checkout`; a separate final U `ACCEPTED / COMPLETE` seal must then pass its own exact-head CI. Parent WP-2.12 / PR #99 cannot resume until both gates are green.

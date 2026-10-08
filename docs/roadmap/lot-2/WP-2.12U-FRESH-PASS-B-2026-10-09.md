# WP-2.12U — Fresh independent Pass B adversarial review — 2026-10-09

Status: **INDEPENDENT REVIEW CANDIDATE — verdict pending**. Review-only branch. **Never merge this PR.**

## Review identity and frozen inputs

- Packet: `WP-2.12U` — PostgREST-safe replay business/precondition conflicts.
- Canonical GREEN merge: `45f28bbfa77ec1bf66e344a5d3cf3b1fecb95626`.
- Reviewed GREEN implementation PR #115 exact head: `a4850a3535b2a98babb90837c4f873a26130515f`.
- Those two commits have the same exact Git tree: `ebb5a29b59da9969bb49a44068450ccce0d60b53`; the only difference is parent/commit identity.
- GREEN PR exact-head CI: `37850249038` / #2426 — **5/5 ordinary jobs SUCCESS**, including full verify from clean checkout.
- Independent Codex GREEN-review verdict at PR #115 comment `6070005329`: no new major issues on the **same** exact head; all previous inline review threads subsequently resolved.
- Canonical squash-merge CI: `37852529610` / #2427; must be **5/5 SUCCESS including clean checkout** before canonical Pass-B seal.
- Activation governance: `2c01f8a2b8f48bd069e0382a46e940b385fea224` / CI `37807120195` — 5/5.
- RED-only evidence: PR #114 / `deb8ebd24bd5bf424b618e6e4e34832d521430bb` / CI `37808965919` — closed unmerged.
- Parent WP-2.12 + draft PR #99: **BLOCKED / FROZEN**. R/S/T are already **ACCEPTED / COMPLETE**.
- This review-only branch does not change any SQL, app code, adapter, test, status board, matrix, Feature Ledger, provider, or private data.

## Independence / review rule

Reconstruct the scope and verify actual implementation/test behavior **without
assuming** that #115's previous passing CI, resolved threads, or this record
prove correctness. The full current tree is the subject of review. A clean
verdict requires zero unresolved bounded P0/P1/P2 findings, no missing direct
no-side-effect evidence, and no undocumented changed contracts.

Read at minimum:

- `docs/roadmap/lot-2/WP-2.12U.md`;
- `docs/roadmap/IMPLEMENTATION-STATUS.md`;
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`;
- `docs/engineering/AI-LOT-ORCHESTRATION.md` and `AGENTS.md`;
- `supabase/migrations/20261008163000_postgrest_safe_replay_conflicts.sql`;
- the prior accepted R/S/T migrations and applicable grant/authorization checks;
- `supabase/tests/wp212r_fact_observation_replay_test.sql`;
- `supabase/tests/wp212s_member_rating_replay_test.sql`;
- `supabase/tests/wp212t_atomic_visit_source_link_test.sql`;
- `src/infrastructure/supabase/supabase-venue-fact-evidence-adapter.ts`;
- `src/infrastructure/supabase/supabase-venue-member-opinion-adapter.ts`;
- `src/application/venues/venue-member-opinion-service.ts`;
- the corresponding adapter/service and replay-durability regression tests;
- RED PR #114 and GREEN/review history PR #115.

## Complete bounded adversarial matrix

Independently test each item, including actual SQL effects rather than only
searching source strings:

1. Fact Observation replay core still enforces authentication, live membership, correct role and exact same-project Fact identity.
2. Fact missing/non-active superseded observation returns **PT412** and creates no replacement observation/receipt.
3. Fact replay exact-operation idempotency and other accepted `23505` conflict paths are not silently redefined.
4. The retained **five-argument** Member Rating overload is still callable by eligible legacy clients.
5. Both its existing-row stale revision and absent-row nonzero expected revision conflicts return **PT412**.
6. Both legacy conflicts leave existing rating/revision or absent-row state unchanged.
7. Accepted grant, authorization, cross-project and member-identity behavior for the legacy overload is unchanged.
8. The receipt-aware **seven-argument** Rating overload maintains stable operation/device receipt identity.
9. A stale acknowledged receipt conflict returns **PT412**, preserves the newer rating=8/revision=2, and keeps the original receipt bound without manufacturing a new one.
10. A seven-argument stale revision conflict returns **PT412**, preserves rating=8/revision=2 **after the failing call**, and inserts no receipt for the rejected operation.
11. No-current-rating, missing acknowledged rating, stale nonzero expected revision, and accepted success/replay branches retain their direct expected pgTAP evidence.
12. The checked provenance-link RPC returns **PT412** for stale/wrong type, missing, or stale source revision business preconditions, without creating/modifying a link.
13. Checked provenance enforces `in_person_visit` type and expected server revision **inside the linking transaction**, with the same-project row lock.
14. A real PostgreSQL serialization failure `40001` is not intercepted/relabelled at the SQL layer.
15. Fact adapter recognizes **PT412** and **40001** as the typed application `conflict`, without treating `PT412` as automatic retry/success.
16. Rating adapter preserves **PT412** and genuine `40001` as typed persistence `conflict`.
17. `saveVenueMemberRating` propagates the typed conflict instead of collapsing it to generic `persistence_failed`.
18. Parent structured replay converts conflict into durable conflict state, not `failed_retryable` and not an acknowledged/removed local operation.
19. Direct pgTAP checks each converted business branch's failure and **post-call zero-side-effect invariants**, including receipt uniqueness and identity.
20. All four redefined SQL function bodies retain stable callable signatures and safe fixed `search_path`, authorization, RLS and exact grants.
21. No dynamic user SQL, new permission bypass, public/anon access, or foreign-project data disclosure appears.
22. The forward migration is valid across the entire migration chain; no source-history migration is rewritten.
23. No table, column, index, RLS policy, new RPC family, provider deployment, Storage path or product Feature is added.
24. The intended HTTP 412 business-conflict behavior cannot be mistaken for retryable PostgREST HTTP 503/native transaction serialization.
25. WP-2.12 parent structured coordinator and PR #99 remain untouched/frozen; no media, generic sync/PWA, UI or unrelated Feature scope enters U.
26. The packet identity and current/next action in **all three** normative docs agree on this exact review gate; no stale READY/PLAN/AR-005 or missing AR-008 instructions remain.
27. RED evidence is still isolated unmerged and all failures are for intended contract gaps.
28. Core code quality/security, 100% coverage, DB/RLS/promotion, 40 browser E2Es, mutation and full clean checkout remain green on exact reviewed tree.

## Historic finding closure to independently challenge

| Finding | Required closure evidence |
| --- | --- |
| WP212U-AR-001 | application service propagates the typed Rating conflict |
| WP212U-AR-002 | packet/status handoff agrees with actual implementation pass |
| WP212U-AR-003 | all converted SQL conflict branches have direct pgTAP proof |
| WP212U-AR-004 | authoritative status and Lot-2 matrix contain no stale READY/parent-active entry |
| WP212U-AR-005 | acknowledged-rating failed replay leaves rating/revision/original receipt unchanged |
| WP212U-AR-006 | retained legacy five-argument Rating overload uses PT412 for both stale branches, without side effects |
| WP212U-AR-007 | canonical status + matrix + packet identity list AR-006/007/008 with the correct next pass |
| WP212U-AR-008 | post-seven-argument-stale-call rating=8/revision=2/no-new-receipt checks execute directly |

These are **candidate closures** only until the independent reviewer and exact
canonical CI prove them. No retrospective green test alone may close a new
material review finding.

## Scope and next gates

If independent review returns no bounded P0/P1/P2 suggestions, no open thread
remains, and canonical squash CI `37852529610` is fully green:

1. Close this review-only PR **unmerged**.
2. Write an authoritative canonical Fresh Pass-B result record showing
   AR-001..008 **CLOSED / VERIFIED** and transition U to
   `ACCEPTANCE_PENDING / C-ACCEPTANCE`.
3. Prove that canonical documentary seal through exact-head five-job CI
   including clean checkout.
4. Run a **separate** Pass C `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation
   with gap ∅, exact-head acceptance-record CI, then a separate final
   `ACCEPTED / COMPLETE` support seal and exact-head CI.
5. Only after U is terminal accepted may the parent WP-2.12 enter its own
   resumption-governance gate and reconcile the preserved draft PR #99.

**Fresh independent verdict: PENDING.** Do not infer PASS from these test
instructions or this candidate review record.

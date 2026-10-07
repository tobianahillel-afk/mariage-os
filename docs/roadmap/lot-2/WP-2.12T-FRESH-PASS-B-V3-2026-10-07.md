# WP-2.12T — Fresh Pass B adversarial review v3 — 2026-10-07

Status: **PASS — complete independent Fresh Pass B v3; no unresolved finding**

## Review identity

- Packet: `WP-2.12T` — atomic Venue Fact visit-source provenance link.
- Canonical review base: `8b453d216b11e6b0bdf6297b6b68dbec669cf954`.
- Canonical exact-head CI: `37551357375` / run #2380 — **5/5 SUCCESS**, including full verify from clean checkout.
- Core on the canonical head: **237/237 files, 2,059/2,059 tests, 100% statements/branches/functions/lines**.
- Activation: `8b0dfb431adc2d09b5d75d0b0c8d22b3315424b9` / CI `37538654009` — 5/5.
- RED-only PR #106 / `b7f3e705c46bd026b5389ec18fda660beb4ebffb` / CI `37539654080` — closed unmerged after intended missing checked-link/stale-provenance failures.
- GREEN PR #107 final reviewed head `f6eaa0e232252f1ff8962979097c17c3ca184ee7` / CI `37542674381` — 5/5; 2,059 tests / 100% coverage; zero unresolved threads.
- Canonical GREEN merge: `a130fe20147fbe892455b86b5fb6ba28149ccc38` / CI `37543738014` — 5/5 including clean checkout.
- Pass-A/status seal: `b320fbdb871f7f7eb9558c3cd8ebb7727068d07f` / CI `37544677655` — 5/5.
- Fresh Pass B v1: PR #109 — **FAIL**, opened WP212T-AR-001/002 (P2 evidence gaps).
- Evidence remediation #110 merged as canonical `7f9f5140f531b9fa684fa969e9e14ec95ce2497b`.
- Fresh Pass B v2: PR #111 — **FAIL**, opened WP212T-AR-003/004 (P2 evidence gaps).
- Evidence remediation #112 final head `21351cb53793a52a3937e402b8c15a47e6b5dfc6` / CI `37550194342` — 5/5; fresh Codex re-review clean; merged as current canonical `8b453d216b11e6b0bdf6297b6b68dbec669cf954`.
- Parent `WP-2.12`: **BLOCKED** until T completes this Fresh Pass B and separate Pass C.
- This branch/PR is **review-record-only**. Do not merge it and do not add production SQL, TypeScript, migration, RPC, RLS, permission, provider, UI, parent replay or private data.

## Independence rule

Reconstruct the complete bounded T contract from current repository truth.
**Do not inherit** any prior verdict from Pass A, #107, #109, #110, #111 or
#112. Remediation history proves only that additional evidence now exists; it
does not pre-authorize this verdict.

## Complete attack matrix

Challenge all of the following:

1. checked RPC requires an authenticated caller;
2. active project membership is required;
3. live `venues.write` permission is required;
4. `anon` direct invocation is denied and creates zero link;
5. authenticated non-member direct invocation is denied and creates zero link;
6. revoked member direct invocation is denied and creates zero link;
7. active viewer/read-only member direct invocation is denied and creates zero link;
8. expected source type is mandatory (NULL rejected);
9. expected source type is fixed to exact `in_person_visit`;
10. expected source revision is mandatory (NULL rejected);
11. expected source revision must be positive (zero and negative rejected);
12. `is_primary` is mandatory (NULL rejected);
13. every validation denial creates zero observation-source side effect;
14. source row is selected under exact project/source identity and locked `FOR UPDATE`;
15. absent/foreign source fails non-disclosing;
16. source type drift between parent read and link is rejected atomically;
17. source revision drift with unchanged type is rejected atomically;
18. wrong current source type is rejected atomically;
19. source lock remains held through delegated general-link execution in the same PostgreSQL transaction;
20. observation identity must resolve within the same project;
21. a real foreign-project observation passed to the project-A checked RPC is denied non-disclosing with zero link;
22. delegated accepted general-link invariant still requires a Venue Fact observation;
23. no authorization/type/revision/project/observation failure creates or updates a link;
24. successful primary link preserves `is_primary=true`;
25. successful non-primary link preserves `is_primary=false` in both receipt and row;
26. checked RPC return identity exactly matches project/observation/source/primary request;
27. `SECURITY DEFINER` uses fixed safe `search_path = pg_catalog`;
28. no caller-controlled dynamic SQL exists;
29. function grants are exact: authenticated execute; public/anon not granted;
30. legacy four-argument `link_venue_fact_observation_source` remains available and behaviorally unchanged for non-visit callers;
31. application checked-link input fixes expected source type to literal `in_person_visit`;
32. application/adapter sends exact project, observation, source, primary, expected type and expected revision;
33. adapter maps SQLSTATE `40001` stale provenance to conflict;
34. adapter rejects substituted/malformed project/observation/source receipt identity;
35. adapter independently rejects substituted `is_primary`;
36. provider/backend failure cannot be treated as checked-link acknowledgement;
37. migration is forward-only and adds no table, column, RLS policy, permission key, provider or UI surface;
38. direct pgTAP evidence materially executes stale type, stale revision, wrong type, authorization and project isolation failures;
39. direct pgTAP evidence materially executes **NULL expected type**, **NULL expected revision**, **zero revision**, **negative revision** and **NULL is_primary**, each with zero side effects;
40. direct pgTAP evidence materially invokes the checked RPC as **anon**, not merely grant-introspection;
41. direct pgTAP evidence materially proves successful **non-primary** checked linking;
42. parent structured replay coordinator is not modified or accepted here;
43. Fact-observation replay identity remains WP-2.12R accepted scope;
44. Member Rating replay identity remains WP-2.12S accepted scope;
45. local media upload, generic sync/PWA and unrelated Fact/source product semantics do not leak into T.

## Evidence to re-read independently

- `docs/roadmap/lot-2/WP-2.12T.md`
- `docs/roadmap/IMPLEMENTATION-STATUS.md`
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`
- RED-only PR #106 history
- GREEN PR #107 history
- failed Fresh Pass B #109 history
- tests-only evidence remediation #110 history
- failed Fresh Pass B v2 #111 history
- tests-only evidence remediation #112 history
- `supabase/migrations/20261006222000_harden_venue_fact_visit_source_provenance.sql`
- `supabase/tests/wp212t_atomic_visit_source_link_test.sql`
- `src/application/facts/venue-fact-evidence-service.ts`
- `src/infrastructure/supabase/supabase-venue-fact-evidence-adapter.ts`
- `src/infrastructure/supabase/supabase-venue-fact-provenance-link-adapter.test.ts`
- accepted general Fact/Evidence link migration/tests
- accepted source-update type/revision semantics
- current permission/grant helper tests.

## Exact-head evidence at review entry

Canonical `8b453d216b11e6b0bdf6297b6b68dbec669cf954` / CI
`37551357375` (#2380):

- Core quality/security: PASS;
- 237 test files / 2,059 tests: PASS;
- statements / branches / functions / lines: 100% / 100% / 100% / 100%;
- Local Supabase DB/RLS/promotion: PASS;
- browser E2E + mutation: PASS;
- privacy-safe preview artifact: PASS;
- full verify from clean checkout: PASS;
- provider-only workflows: SKIPPED as expected.

The review must independently inspect current source/tests and may not use this
record itself as proof of correctness.

## Historical finding disposition to challenge

- `WP212T-AR-001` — candidate CLOSED / VERIFIED only if the reviewer confirms direct revoked-member and read-only-member denials with zero side effects.
- `WP212T-AR-002` — candidate CLOSED / VERIFIED only if the reviewer confirms real foreign-observation direct denial with zero side effect.
- `WP212T-AR-003` — candidate CLOSED / VERIFIED only if the reviewer confirms a direct `anon` checked-RPC call is denied and leaves zero link.
- `WP212T-AR-004` — candidate CLOSED / VERIFIED only if the reviewer confirms mandatory/positive provenance inputs are directly exercised: NULL type, NULL revision, zero revision and negative revision, with zero side effects. The additional NULL `is_primary` denial and non-primary success evidence must also be reviewed.

All four are **candidate closures only** until this complete v3 review
independently verifies them.

## Verdict rule

Fresh Pass B v3 is **PASS** only if:

- no unresolved P0/BLOCKING;
- no unresolved P1/MAJOR;
- no unresolved P2/MINOR in the bounded T contract;
- no missing material authorization/isolation/atomicity/input-validation evidence;
- WP212T-AR-001..004 are independently CLOSED / VERIFIED;
- no hidden scope expansion exists;
- current canonical exact-head CI remains green;
- zero unresolved review threads remain.

Any bounded finding means FAIL/remediation, followed by direct regression
evidence, exact-head CI and another **complete Fresh Pass B**. Parent WP-2.12
and draft PR #99 remain blocked throughout T review.

## Final verdict

**PASS — no unresolved P0/BLOCKING, P1/MAJOR or P2/MINOR finding remains.**

- Review-only PR #113 exact head
  `aaff9b7ea70951481c3d915449935db183312054` / CI
  `37552197889` (#2381) completed **5/5 SUCCESS**, including full verify
  from clean checkout.
- Independent Codex review on that exact head reported **“Didn't find any major
  issues.”**
- Zero unresolved review threads remained when the review was closed unmerged.
- Canonical review base
  `8b453d216b11e6b0bdf6297b6b68dbec669cf954` / CI
  `37551357375` (#2380) remains **5/5 SUCCESS**, including clean checkout.
- Core on the canonical base remains 237 files / 2,059 tests / 100% global
  coverage.
- `WP212T-AR-001`, `WP212T-AR-002`, `WP212T-AR-003` and
  `WP212T-AR-004` are **CLOSED / VERIFIED**.
- No new production SQL, migration, RPC, RLS, permission, TypeScript, parent
  coordinator, provider, UI or private-data scope entered the review-only PR.

Next permitted action: seal this Fresh Pass-B record on the canonical branch,
enter `ACCEPTANCE_PENDING / C-ACCEPTANCE`, then run a separate Pass C
EXPECTED ↔ IMPLEMENTED ↔ VERIFIED reconciliation. Parent WP-2.12 and draft PR
#99 remain blocked until WP-2.12T is terminally accepted and a separate parent
resumption-governance head passes exact-head CI.

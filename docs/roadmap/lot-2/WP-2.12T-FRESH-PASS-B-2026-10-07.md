# WP-2.12T — Fresh Pass B adversarial review — 2026-10-07

Status: **PENDING — independent Fresh Pass B in progress**

## Review identity

- Packet: `WP-2.12T` — atomic Venue Fact visit-source provenance link.
- Canonical review base: `b320fbdb871f7f7eb9558c3cd8ebb7727068d07f`.
- Canonical seal CI: `37544677655` / run #2370 — **5/5 SUCCESS**, including full verify from clean checkout.
- Activation: `8b0dfb431adc2d09b5d75d0b0c8d22b3315424b9` / CI `37538654009` — 5/5.
- RED-only PR #106 / `b7f3e705c46bd026b5389ec18fda660beb4ebffb` / CI `37539654080` — closed unmerged after the intended missing checked-link / stale-provenance failures.
- GREEN PR #107 final reviewed head `f6eaa0e232252f1ff8962979097c17c3ca184ee7` / CI `37542674381` — 5/5; 237 files / 2,059 tests / 100% global coverage; zero unresolved threads.
- Canonical GREEN merge: `a130fe20147fbe892455b86b5fb6ba28149ccc38` / CI `37543738014` — 5/5 including clean checkout.
- Pass-A/status seal: `b320fbdb871f7f7eb9558c3cd8ebb7727068d07f` / CI `37544677655` — 5/5.
- Parent `WP-2.12`: **BLOCKED** until T completes Fresh Pass B + separate Pass C.
- This PR is review-record-only. No production SQL, TypeScript, permission, RLS, provider, UI, parent replay coordinator or private data may be added.

## Independent review contract

Reconstruct the bounded provenance-link contract from repository truth. **Do not inherit**
the verdict of Pass A, PR #106, PR #107 or any earlier Codex review.

Challenge at least:

1. checked RPC accepts only authenticated callers with active membership and live `venues.write`;
2. anon, non-member, revoked member and member lacking `venues.write` all fail closed;
3. authorization denial creates **zero** observation-source side effect;
4. expected source type is mandatory and exactly `in_person_visit`;
5. expected source revision is mandatory, positive and exact;
6. source row is locked/read inside the checked-link transaction before provenance validation;
7. source type drift between parent read and link is rejected atomically;
8. source revision drift with unchanged type is rejected atomically;
9. wrong current source type is rejected atomically;
10. same-project source existence is required and foreign source identity is non-disclosing;
11. same-project observation existence is required and foreign observation identity is non-disclosing;
12. observation must still belong to a Venue Fact according to the accepted general link invariant;
13. no link row is created/updated on auth/type/revision/project/observation failure;
14. successful primary and non-primary links both preserve exact requested `is_primary`;
15. the source lock remains held through the delegated general link call in the same PostgreSQL transaction;
16. the security-definer function has a fixed safe search path and no caller-controlled dynamic SQL;
17. grants are exact: authenticated may execute; anon/public do not gain the checked command;
18. legacy four-argument general link remains available and behaviorally unchanged for non-visit callers;
19. application input fixes expected source type to the literal `in_person_visit`;
20. adapter sends exact project/observation/source/primary/type/revision identities;
21. adapter maps stale provenance SQLSTATE `40001` to conflict;
22. adapter rejects malformed/substituted returned project/observation/source identity;
23. adapter rejects substituted returned primary identity;
24. server return cannot be treated as proof if the checked transaction failed;
25. migration is forward-only and introduces no new table, column, RLS policy, permission key or provider surface;
26. direct pgTAP evidence actually executes stale-type, stale-revision, wrong-type, authz and isolation failures with zero side effects;
27. **evidence challenge:** direct revoked-member denial is materially executed, not inferred from generic membership code;
28. **evidence challenge:** a foreign/cross-project `observationId` is materially executed against the checked RPC, not inferred only from a foreign source test;
29. parent structured replay coordinator is not modified/accepted here;
30. local media upload, generic sync/PWA and unrelated Fact product semantics do not leak into T.

## Evidence to re-read

- `docs/roadmap/lot-2/WP-2.12T.md`
- `docs/roadmap/IMPLEMENTATION-STATUS.md`
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`
- RED-only PR #106 history
- GREEN/remediation PR #107 history
- `src/application/facts/venue-fact-evidence-service.ts`
- `src/infrastructure/supabase/supabase-venue-fact-evidence-adapter.ts`
- `src/infrastructure/supabase/supabase-venue-fact-provenance-link-adapter.test.ts`
- `supabase/migrations/20261006222000_harden_venue_fact_visit_source_provenance.sql`
- `supabase/tests/wp212t_atomic_visit_source_link_test.sql`
- accepted general Fact/Evidence link migration/tests
- accepted source-update revision/type semantics
- current grants/permission helper tests

## Exact-head evidence at review entry

Canonical `b320fbdb...` / CI `37544677655`:

- Core quality/security: PASS;
- 237 test files / 2,059 tests: PASS;
- global statements / branches / functions / lines: 100%;
- Local Supabase DB/RLS/promotion: PASS;
- browser E2E + mutation: PASS;
- privacy-safe preview: PASS;
- full verify from clean checkout: PASS.

## Verdict rule

Fresh Pass B may be marked **PASS** only if this independent review finds:

- no unresolved P0/BLOCKING;
- no unresolved P1/MAJOR;
- no unresolved P2/MINOR within the bounded T contract;
- no missing material authorization/isolation/atomicity evidence;
- no hidden scope expansion;
- exact-head ordinary CI remains green;
- zero unresolved review threads remain.

Any bounded finding keeps WP-2.12T in review/remediation. A finding must be
remediated with direct regression evidence, exact-head CI, and then another
**complete Fresh Pass B**. Parent WP-2.12 remains blocked throughout.

## Final verdict

**PENDING independent review.**

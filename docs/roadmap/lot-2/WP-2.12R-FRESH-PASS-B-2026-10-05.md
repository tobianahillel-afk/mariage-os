# WP-2.12R — Fresh Pass B adversarial review — 2026-10-05

Status: **REVIEW_IN_PROGRESS — independent Pass B**

## Review target

- Packet: `WP-2.12R` — replay-safe Venue fact-observation command boundary.
- Canonical review base: `6ee125451926e3b64040e42ff454e3f8c631683d`.
- Base CI: `37310911261` — **5/5 SUCCESS**, including full verify from clean checkout.
- Parent `WP-2.12`: **BLOCKED** until WP-2.12R is ACCEPTED.
- Historical findings `WP212R-AR-001/002`: **CLOSED / VERIFIED** before entry.
- This branch is review-only: no production code, migration, permission, provider, UI or parent replay implementation may be added.

## Independent review contract

Reconstruct the bounded responsibility from the packet and challenge it without
inheriting Pass-A conclusions.

The reviewer must attack at least:

1. client-supplied observation identity is mandatory, UUID-valid and preserved
   application → adapter → RPC → returned row;
2. first use inserts exactly one observation with the requested ID;
3. exact replay of normalized identical intent returns the existing row and
   never creates a duplicate;
4. drift in fact definition, value, evidence level, confidence, timestamp,
   note or supersedes target conflicts rather than mutating/reusing silently;
5. NULL evidence/confidence fail closed and cannot exploit SQL three-valued
   comparison semantics;
6. foreign-project observation-ID collisions fail non-disclosing;
7. supersede replay is idempotent while inconsistent supersede state fails
   closed;
8. the legacy authenticated signature without observation identity is not
   callable;
9. any internal replay helper remains unavailable to public/anon/authenticated;
10. authorization remains existing project membership + `venues.write`;
11. adapter rejects a substituted/mismatched returned observation ID;
12. migrations are forward-only and preserve accepted Facts/Evidence behavior;
13. no new table, RLS policy, permission key, provider, UI, offline queue or
   parent WP-2.12 replay coordinator leaked into this support packet;
14. current pgTAP/unit/adapter/security tests materially exercise the replay
   contract rather than only happy paths.

## Evidence to re-read

- `docs/roadmap/lot-2/WP-2.12R.md`
- `docs/roadmap/IMPLEMENTATION-STATUS.md`
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`
- RED #81 and RED #83 histories
- GREEN #82 and remediation #84 histories
- migrations implementing replay identity and NULL-metadata hardening
- application Fact Observation service/input validation
- Supabase Fact Observation adapter/response validation
- pgTAP replay/authorization/supersede tests

## Verdict rule

Pass B may be marked PASS only if a fresh independent review finds no
unresolved BLOCKING, MAJOR or MINOR/P1/P2 packet defect and exact-head ordinary
CI remains green. Any finding keeps WP-2.12R out of acceptance and must be
remediated before a new complete fresh Pass B.

Current verdict: **PENDING**.

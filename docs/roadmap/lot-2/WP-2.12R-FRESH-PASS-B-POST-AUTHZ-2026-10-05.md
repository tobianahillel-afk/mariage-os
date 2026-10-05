# WP-2.12R — Fresh Pass B adversarial review after authorization remediation — 2026-10-05

Status: **REVIEW_IN_PROGRESS — independent fresh Pass B**

## Review identity

- Packet: `WP-2.12R` — replay-safe Venue fact-observation command boundary.
- Canonical review base: `9e9851d29830decd1dd927496b7aaa473445ca51`.
- Canonical CI: `37316129635` / run #2197 — **5/5 SUCCESS**, including full verify from clean checkout.
- Parent `WP-2.12`: **BLOCKED** until WP-2.12R is ACCEPTED.
- Historical Pass-B attempt: PR #85 / `825fa887d80b534933880eeaec18cf01aba78697` — **FAIL** because direct authorization evidence for the changed replay-safe SECURITY DEFINER RPC was incomplete.
- Authorization-evidence remediation: PR #86 reviewed head `1523f142417ac49e684db2e24ae15a6120bac2b4` / CI `37314846035` — **5/5 SUCCESS**, fresh Codex review clean, zero unresolved threads.
- PR #86 merged canonically as `9e9851d29830decd1dd927496b7aaa473445ca51`.
- Historical implementation/remediation findings `WP212R-AR-001/002`: **CLOSED / VERIFIED**.
- This branch is review-record-only: no production implementation, migration, permission, provider, UI, parent replay coordinator or product scope may be added.

## Independent review contract

Reconstruct the bounded replay-safe Fact Observation command from repository truth.
Do **not** inherit the verdict of Pass A, PR #84, PR #86 or the failed PR #85.

Challenge at least:

1. client-supplied `observationId` is mandatory, UUID-valid and preserved application → adapter → RPC → returned row;
2. first use inserts exactly one observation with the requested ID;
3. exact replay of normalized identical intent returns the existing observation and never creates a duplicate;
4. drift in Fact identity/value/raw evidence/evidence level/confidence/timestamp/note/supersedes target conflicts instead of silently reusing or mutating;
5. NULL evidence/confidence fail closed and cannot exploit SQL three-valued logic;
6. a foreign-project observation-ID collision is non-disclosing;
7. supersede replay is idempotent while inconsistent supersede state fails closed;
8. the legacy authenticated signature without observation identity is unavailable;
9. the internal replay helper is unavailable to public, anon and authenticated roles;
10. authorization on the **exact replay-safe public RPC signature** remains:
    - active project membership;
    - `venues.write`;
    - owner/editor-compatible positive behavior where permitted;
    - anon denied;
    - viewer denied;
    - authenticated outsider denied;
    - owner of project B denied against project A;
    - revoked project-A member denied;
    - denied attempts create zero observation rows;
11. adapter sends `target_observation_id` and rejects a substituted/mismatched returned observation ID;
12. migrations are forward-only and preserve accepted Facts/Evidence/freshness/withdrawal behavior;
13. implementation remains bounded: no new table, RLS policy, permission key, provider, UI, local queue or parent WP-2.12 coordinator;
14. pgTAP, unit, adapter and security tests materially exercise the command rather than merely asserting function existence or owner happy paths;
15. the authorization tests themselves are syntactically valid and execute the changed RPC, rather than failing before assertion execution;
16. no review/remediation artifact weakens existing grants, helper revocation, multi-project isolation or non-disclosure semantics.

## Evidence to re-read

- `docs/roadmap/lot-2/WP-2.12R.md`
- `docs/roadmap/IMPLEMENTATION-STATUS.md`
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`
- RED #81 and RED #83 histories
- GREEN #82 and remediation #84 histories
- failed fresh Pass B PR #85
- authorization-evidence remediation PR #86
- `supabase/migrations/20261005094000_harden_venue_fact_observation_replay_identity.sql`
- `supabase/migrations/20261005111500_reject_null_venue_fact_replay_metadata.sql`
- application Fact Observation service/input validation
- Supabase Fact Observation adapter and receipt validation
- `supabase/tests/wp212r_fact_observation_replay_test.sql`
- related Fact authorization/evidence/freshness/withdrawal pgTAP suites

## Authorization remediation evidence

PR #86 adds direct calls to:
`append_venue_fact_observation(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid)`.

The exact-head DB/RLS job proves:

- anon cannot execute the public replay-safe RPC;
- active viewer cannot mutate without `venues.write`;
- authenticated outsider cannot mutate project A;
- active owner of project B cannot mutate project A;
- revoked project-A owner cannot mutate;
- all denied observation IDs remain absent after the attempts;
- the owner positive-control append remains green.

The first PR #86 head had malformed SQL dollar quoting and was rejected by CI/review.
The corrected head `1523f142...` uses matching `$authz$...$authz$` tags, and
`wp212r_fact_observation_replay_test.sql` executes successfully under `db:verify`.
This history must be treated as evidence that the final tests actually run, not as a reason
to inherit their intended conclusion without review.

## Verdict rule

Pass B may be marked **PASS** only if a fresh independent review finds:

- no unresolved BLOCKING / P0;
- no unresolved MAJOR / P1;
- no unresolved MINOR / P2 relevant to the bounded packet;
- no missing material security evidence for the changed RPC;
- exact-head ordinary CI remains green.

Any new finding keeps WP-2.12R out of acceptance. It must be remediated and followed by
another complete fresh Pass B.

Current verdict: **PENDING**.

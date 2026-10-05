# WP-2.12R — Fresh Pass B adversarial review after authorization remediation — 2026-10-05

Status: **PASS — fresh independent Pass B complete; no unresolved finding**

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

## Targeted challenge of the transient multiselect-order finding

The first fresh Codex review raised one P2 suggesting that replay of a custom
multiselect observation might depend on mutable `fact_definitions.options_json`
order. That hypothesis was challenged rather than accepted by assertion.

Targeted review-only PR #88 starts from the exact canonical review base
`9e9851d29830decd1dd927496b7aaa473445ca51` and proves on the effective
migration chain that:

- the effective `fact_multiselect_canonical_value` is the hardened replacement
  from `20260906223000_harden_venue_fact_adversarial_canonicality.sql`;
- selected option keys are canonicalized lexically with
  `order by ... collate "C"`, independently of definition option order;
- a first replay-safe multiselect append succeeds;
- the unresolved custom definition can then be legally reordered;
- the stored observation remains in its original canonical selected-key order;
- retry of the same observation ID and same selected keys still succeeds;
- the final observation row count remains exactly one.

PR #88 final head
`55f0fc8b54554d1f108098d12fa6b718e2288115` / CI
`37322464350` passed **5/5 SUCCESS**, including full verify from clean
checkout. The PR was closed unmerged because its role was adversarial
counter-evidence only.

The corresponding #87 thread is resolved. A subsequent fresh Codex pass on the
same review head returned **👍** and left **zero unresolved review threads**.

Therefore the multiselect-order P2 is a **review false positive**, not a packet
defect and not a remediation item.

## Final verdict

**PASS — no unresolved BLOCKING / P0, MAJOR / P1, or MINOR / P2 finding remains.**

- Direct authorization evidence on the exact changed SECURITY DEFINER RPC is
  present and executed.
- `WP212R-AR-001/002` remain CLOSED / VERIFIED.
- The transient multiselect-order hypothesis is disproved by #88 and creates no
  `WP212R-AR-003` implementation finding.
- Parent WP-2.12 remains BLOCKED until a separate Pass C accepts WP-2.12R.

Next permitted action: merge/seal this fresh Pass-B record after its exact-head
ordinary CI and fresh review remain clean, then enter
`ACCEPTANCE_PENDING / C-ACCEPTANCE`.

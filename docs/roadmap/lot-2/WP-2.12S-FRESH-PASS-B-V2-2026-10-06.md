# WP-2.12S — Fresh Pass B v2 adversarial review — 2026-10-06

Status: **IN REVIEW — no verdict yet**

## Review identity

- Packet: `WP-2.12S` — replay-safe Venue member-rating command boundary.
- Canonical review base: `a1c5799c8d7d7b7173e779d60f21248a30003680`.
- Canonical CI: `37390243378` / run #2231 — **5/5 SUCCESS**, including full verify from clean checkout.
- Core on canonical base: **236/236 files, 2,056/2,056 tests, 100% statements/branches/functions/lines**.
- Pass-A/status seal before the failed review: `c25418181c439ece447366bb77b2e3dfcbf5e488` / CI `37385629649` — 5/5.
- Historical failed Fresh Pass B: PR #92 / `718311fabaf36f2db449b1aef04d8230551caa9e`.
- Historical finding from #92: `WP212S-AR-002` **P2 / remediation candidate** — the retained authenticated five-argument compatibility overload lacked a real mutation test.
- Tests-only remediation: PR #93 reviewed head `82d925db17354c656356d9c32172bb6a425ca426` / CI `37389466053` — SUCCESS; final Codex reaction 👍; zero unresolved threads.
- PR #93 merged canonically as `a1c5799c8d7d7b7173e779d60f21248a30003680`.
- Historical implementation finding `WP212S-AR-001`: **CLOSED / VERIFIED**.
- Parent `WP-2.12`: **BLOCKED** until WP-2.12S completes this Pass B and a separate Pass C.
- This branch is review-record-only. No production implementation, migration, permission, provider, UI or parent reconnect work may be added.

## Independent review contract

Reconstruct the entire bounded member-rating replay contract from repository truth.
Do **not** inherit the verdict of Pass A, PR #91, PR #92, PR #93 or any prior
Codex review.

Challenge at least:

1. stable UUID `operationId` and `deviceId` are mandatory and preserved application → adapter → RPC;
2. current application/adapter code uses only the seven-argument receipt-aware rating RPC;
3. the authenticated five-argument overload remains only as temporary expand/switch compatibility for obsolete cached clients;
4. migrations preserve that compatibility overload until a real old-client retirement/update-required gate exists;
5. first seven-argument rating mutation writes the intended member-rating row/revision and exactly one receipt identity;
6. exact lost-response retry with the same operation/device/project/user, Venue, dimension, normalized rating and predecessor expected revision returns the acknowledged result without a second write/revision;
7. changed rating under the same operation ID fails closed;
8. changed dimension under the same operation ID fails closed;
9. operation ID cannot cross device, user, project or command identity;
10. genuinely new stale operations still conflict and do not gain a successful receipt;
11. replay rechecks **live** authorization/membership before recognizing an existing receipt;
12. anon, outsider and revoked-member paths cannot exploit a receipt or compatibility overload;
13. exact replay fails closed if the acknowledged row disappeared or later changed so that Venue/dimension/rating/result revision no longer prove the original semantic result;
14. predecessor revision proof is exact; there is no broad stale-retry bypass;
15. rating precision/normalization and accepted WP-2.2 Member Opinion semantics remain unchanged;
16. frozen `sync_mutation_receipts` is reused without new table/column/RLS/permission surface;
17. receipt identity is non-disclosing across project/user/device boundaries;
18. migration/grant behavior is forward-only and explicit for both overloads;
19. tests **behaviorally execute both public overloads**:
    - seven-argument receipt-aware path for replay/identity/conflict semantics;
    - five-argument authenticated compatibility path for real create/update mutation plus persisted rating/revision proof;
20. the five-argument compatibility path does not mint or consume a replay receipt and cannot replace/bypass the current seven-argument client path;
21. SQL test assertions actually parse and execute, including the tagged dollar-quoted compatibility/receipt calls fixed during #93;
22. no preference/favorite hardening, parent reconnect coordinator, local media upload, provider workflow, UI or generic Lot-10 sync work leaked into this support packet.

## Evidence to re-read

- `docs/roadmap/lot-2/WP-2.12S.md`
- `docs/roadmap/IMPLEMENTATION-STATUS.md`
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`
- RED-only PR #90 history
- GREEN/remediation PR #91 history
- failed Fresh Pass B PR #92 and its P2 thread
- tests-only remediation PR #93 and its resolved SQL-quoting thread
- `src/application/venues/venue-member-opinion-service.ts`
- `src/infrastructure/supabase/supabase-venue-member-opinion-adapter.ts`
- `supabase/migrations/20261005214500_harden_venue_member_rating_replay_identity.sql`
- `supabase/tests/wp212s_member_rating_replay_test.sql`
- related Member Opinion precision/authorization/RLS tests
- accepted WP-2.10 receipt schema/grant contracts

## Historical findings that must be re-evaluated

### WP212S-AR-001 — rollout compatibility

The initial GREEN removed the five-argument overload too early. The final Pass-A
implementation preserves it for authenticated obsolete clients while current
code uses only the seven-argument receipt-aware overload.

Fresh Pass B must verify this remains an expand/switch bridge, not a replay
bypass or second current client path.

### WP212S-AR-002 — missing behavioral compatibility evidence

Failed Pass B #92 found that the compatibility overload was only checked for
existence/grants.

PR #93 adds direct authenticated mutation evidence against the exact five-argument
signature and asserts persisted rating/revision. Its first attempt also exposed
invalid PostgreSQL dollar quoting; the final head fixed those delimiters, passed
exact-head CI and received a clean re-review.

Fresh Pass B v2 must independently inspect the **executed** pgTAP behavior and
decide whether AR-002 can be CLOSED / VERIFIED. Do not close it merely because
#93 exists.

## Verdict rule

Pass B may be marked **PASS** only if this complete fresh review finds:

- no unresolved BLOCKING / P0;
- no unresolved MAJOR / P1;
- no unresolved MINOR / P2 relevant to the bounded packet;
- no missing material authorization/replay/rollout evidence;
- both overloads are behaviorally proven for their distinct intended roles;
- exact-head ordinary CI remains green;
- zero unresolved review threads remain.

Any finding keeps WP-2.12S out of acceptance and requires bounded remediation,
exact-head CI and another complete Fresh Pass B.

## Current verdict

**PENDING independent review.**

No Pass C, WP-2.12 parent resumption, provider action or additional production
work is authorized by this record.

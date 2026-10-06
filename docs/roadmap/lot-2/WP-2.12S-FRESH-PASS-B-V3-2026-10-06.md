# WP-2.12S — Fresh Pass B v3 adversarial review — 2026-10-06

Status: **IN REVIEW — no verdict yet**

## Review identity

- Packet: `WP-2.12S` — replay-safe Venue member-rating command boundary.
- Canonical review base: `c4bac33388c24e7b3c2746242ca6edd017f8ede0`.
- Canonical CI: `37453636126` / run #2237 — **5/5 SUCCESS**, including full verify from clean checkout.
- Core on canonical base: **236/236 files, 2,056/2,056 tests, 100% statements/branches/functions/lines**.
- Pass-A/status seal: `c25418181c439ece447366bb77b2e3dfcbf5e488` / CI `37385629649` — 5/5.
- Historical failed Fresh Pass B #92: missing behavioral execution of the retained five-argument compatibility overload.
- Compatibility-evidence remediation #93 final head `82d925db17354c656356d9c32172bb6a425ca426` / CI `37389466053` — 5/5, fresh review clean; merged canonically as `a1c5799c8d7d7b7173e779d60f21248a30003680`.
- Historical failed Fresh Pass B v2 #94: `WP212S-AR-003` P2 — direct authorization-denial evidence was incomplete across the retained/current public overloads.
- Security-only lockfile refresh #95 merged as `22e502110301c0861e55623bbabab93f81a5b818` / CI `37447319615` — 5/5.
- AR-003 tests-only remediation #96 final head `2a39bab40aee523f1e4594ab08d6235f3ab2f0b6` / CI `37452807606` — **5/5 SUCCESS**, including clean checkout; fresh Codex review clean; zero unresolved threads.
- #96 merged canonically as `c4bac33388c24e7b3c2746242ca6edd017f8ede0`.
- Parent `WP-2.12`: **BLOCKED** until WP-2.12S completes Fresh Pass B and a separate Pass C.
- This branch is review-record-only. No production implementation, migration, permission, provider, UI, parent reconnect coordinator or product scope may be added.

## Independent review contract

Reconstruct the entire bounded member-rating replay / authorization / rollout
contract from repository truth. **Do not inherit** the verdict of Pass A, PR
#91, #92, #93, #94, #95, #96, or any prior Codex review.

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
12. anon, authenticated outsider and revoked-member paths cannot exploit a receipt or either public overload;
13. direct denial evidence executes the **five-argument compatibility overload** as:
    - authenticated outsider against another project → denied;
    - revoked project member → denied;
    - each denied attempt leaves zero new `member_ratings` row;
14. direct denial evidence executes the **seven-argument receipt-aware overload** as an authenticated outsider → denied, with zero rating row and zero `sync_mutation_receipts` row;
15. exact replay fails closed if the acknowledged row disappeared or later changed so Venue/dimension/rating/result revision no longer prove the original semantic result;
16. predecessor revision proof is exact; there is no broad stale-retry bypass;
17. rating precision/normalization and accepted WP-2.2 Member Opinion semantics remain unchanged;
18. frozen `sync_mutation_receipts` is reused without new table/column/RLS/permission surface;
19. receipt identity is non-disclosing across project/user/device boundaries;
20. migration/grant behavior is forward-only and explicit for both overloads;
21. tests behaviorally execute both public overloads for their distinct roles:
    - seven-argument receipt-aware path for replay/identity/conflict semantics;
    - five-argument authenticated compatibility path for real mutation plus persisted rating/revision proof;
22. the five-argument compatibility path does not mint/consume a replay receipt and cannot replace/bypass the current seven-argument client path;
23. SQL assertions actually parse and execute, including the final tagged dollar-quoted authorization calls, and no preference/favorite hardening, parent reconnect coordinator, local media upload, provider workflow, UI or generic Lot-10 sync work leaked into this support packet.

## Evidence to re-read

- `docs/roadmap/lot-2/WP-2.12S.md`
- `docs/roadmap/IMPLEMENTATION-STATUS.md`
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`
- RED-only PR #90 history
- GREEN/remediation PR #91 history
- failed Fresh Pass B PR #92
- compatibility-evidence remediation PR #93
- failed Fresh Pass B v2 PR #94 and its AR-003 P2 thread
- security-only PR #95
- AR-003 tests-only remediation PR #96 and its corrected final head
- `src/application/venues/venue-member-opinion-service.ts`
- `src/infrastructure/supabase/supabase-venue-member-opinion-adapter.ts`
- `supabase/migrations/20261005214500_harden_venue_member_rating_replay_identity.sql`
- `supabase/tests/wp212s_member_rating_replay_test.sql`
- related Member Opinion precision/authorization/RLS tests
- accepted WP-2.10 receipt schema/grant contracts

## Historical findings to re-evaluate

### WP212S-AR-001 — rollout compatibility

The initial GREEN removed the five-argument overload too early. The final Pass-A
implementation preserves it for authenticated obsolete clients while current
code uses only the seven-argument receipt-aware overload.

Fresh Pass B v3 must verify this remains an expand/switch bridge, not a replay
bypass or second current client path.

### WP212S-AR-002 — missing behavioral compatibility evidence

Fresh Pass B #92 found that the compatibility overload was only checked for
existence/grants.

PR #93 added direct authenticated five-argument mutation evidence and persisted
rating/revision proof. Its final exact head passed CI and review.

Fresh Pass B v3 must independently verify the test executes the exact retained
signature and that the compatibility path does not create/consume replay
receipts or displace the seven-argument current-client path.

### WP212S-AR-003 — incomplete direct authorization-denial evidence

Fresh Pass B v2 #94 found that direct RPC denial coverage did not prove all
bounded callers:

- authenticated outsider through the five-argument compatibility surface;
- revoked member through the five-argument compatibility surface;
- authenticated outsider through the seven-argument receipt-aware surface;
- zero rating side effects for denied calls;
- zero replay receipt for the denied seven-argument operation.

PR #96 adds those exact pgTAP calls and side-effect assertions. Its first head
had invalid PostgreSQL dollar quoting and was rejected by CI/review. Final head
`2a39bab...` uses valid `$authz$...$authz$` delimiters, passed exact-head CI
`37452807606`, including DB/RLS and clean checkout, and received a clean fresh
Codex review with zero unresolved threads. It merged as canonical
`c4bac333...`, whose CI `37453636126` is 5/5 green.

Fresh Pass B v3 must independently inspect the **executed behavior**, not close
AR-003 merely because PR #96 exists.

## Exact-head evidence available at review entry

Canonical `c4bac333...` / CI `37453636126`:

- Core quality/security: PASS;
- 236 test files / 2,056 tests: PASS;
- global statements / branches / functions / lines: 100%;
- Local Supabase DB/RLS: PASS;
- `wp212s_member_rating_replay_test.sql`: PASS;
- promotion integration: PASS;
- browser E2E + mutation harness: PASS;
- privacy-safe preview: PASS;
- full verify from clean checkout: PASS.

The remediation clean-checkout DB log independently showed all pgTAP files
successful, including WP-2.12S, before #96 was merged.

## Verdict rule

Pass B may be marked **PASS** only if this complete fresh independent review
finds:

- no unresolved BLOCKING / P0;
- no unresolved MAJOR / P1;
- no unresolved MINOR / P2 relevant to the bounded packet;
- no missing material authorization/replay/rollout evidence;
- both overloads behaviorally proven for their distinct intended roles;
- direct outsider/revoked denial + zero-side-effect evidence is materially executed;
- exact-head ordinary CI remains green;
- zero unresolved review threads remain.

Any finding keeps WP-2.12S out of acceptance and requires bounded remediation,
exact-head CI, then another **complete** Fresh Pass B.

## Current verdict

**PENDING independent review.**

No Pass C, parent WP-2.12 resumption, provider action or additional production
work is authorized by this record.

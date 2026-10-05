# WP-2.12S — Fresh Pass B adversarial review — 2026-10-05

Status: **IN REVIEW — no verdict yet**

## Review identity

- Packet: `WP-2.12S` — replay-safe Venue member-rating command boundary.
- Canonical review base / Pass-A seal:
  `c25418181c439ece447366bb77b2e3dfcbf5e488`.
- Seal CI: `37385629649` / run #2226 — **5/5 SUCCESS**, including full verify from clean checkout.
- Pass-A canonical implementation:
  `c95364bd7f9215fe2686b2e3b76d517cc5b2ded4` / CI `37384351528` — **5/5 SUCCESS**.
- Core evidence on canonical implementation: **236 files / 2,056 tests / 100% statements, branches, functions and lines**.
- RED-only evidence: closed/unmerged PR #90 /
  `9d4bfb5ffffc388b954d9fa9b6a2c031aa46602d` / CI `37364388534`.
- GREEN/remediation review: PR #91 exact head
  `c751c1908ee0fc7691c4ea4d57ade9bad6dfbabb` / CI `37381076113` — 5/5, fresh Codex review clean, zero unresolved threads.
- Historical finding `WP212S-AR-001`: **CLOSED / VERIFIED**.
- Parent `WP-2.12`: **BLOCKED** until WP-2.12S completes Pass B and Pass C.
- This branch is review-record-only. No production implementation, migration, permission, provider, UI or parent reconnect work may be added.

## Independent review contract

Reconstruct the bounded member-rating replay contract from repository truth.
Do **not** inherit the verdict of Pass A, PR #91, prior Codex reviews or this
record.

Challenge at least:

1. stable UUID `operationId` and `deviceId` are mandatory and preserved from
   application input through adapter RPC arguments;
2. the current application/adapter path uses only the seven-argument
   receipt-aware rating RPC;
3. the authenticated five-argument overload remains available only as a
   temporary expand/switch compatibility surface for obsolete cached clients;
4. no migration drops or breaks the compatibility overload before old-client
   retirement/update-required gating exists;
5. first rating write records exactly one acknowledged operation receipt and
   the expected member-rating row/revision;
6. exact lost-response retry with the same operation/device/project/user,
   Venue, dimension, normalized rating and predecessor expected revision
   returns the acknowledged result without a second revision/write;
7. reusing an operation ID with changed rating fails closed;
8. reusing an operation ID with changed dimension fails closed;
9. operation ID cannot cross device, user, project or command identity;
10. a genuinely new operation carrying a stale expected revision still
    conflicts and leaves no successful receipt behind;
11. replay rechecks **live** authorization/membership before recognizing an
    existing receipt;
12. anon, authenticated outsider and revoked-member paths cannot exploit a
    receipt; accepted self-rating behavior for authorized project members is
    preserved;
13. replay fails closed if the acknowledged rating row disappeared, changed
    later, or no longer proves Venue/dimension/rating/result-revision identity;
14. expected-revision replay proof is exactly the predecessor of the stored
    acknowledged result revision; no broad stale-retry bypass exists;
15. rating precision/normalization and accepted WP-2.2 Member Opinion semantics
    are unchanged;
16. frozen `sync_mutation_receipts` is reused without a new table/column/RLS
    policy/permission key;
17. receipt identity cannot disclose another project/user/device operation;
18. migrations are forward-only and privilege/grant behavior is explicit for
    both overloads;
19. application/unit/adapter/pgTAP/security tests materially execute the
    changed seven-argument path and the compatibility path instead of merely
    asserting function existence;
20. no preference/favorite mutation hardening, parent reconnect coordinator,
    local media upload, provider workflow, UI or generic Lot-10 sync work leaked
    into this support packet.

## Evidence to re-read

- `docs/roadmap/lot-2/WP-2.12S.md`
- `docs/roadmap/IMPLEMENTATION-STATUS.md`
- `docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md`
- RED-only PR #90 history
- GREEN/remediation PR #91 history and resolved `WP212S-AR-001`
- `src/application/venues/venue-member-opinion-service.ts`
- `src/infrastructure/supabase/supabase-venue-member-opinion-adapter.ts`
- `supabase/migrations/20261005214500_harden_venue_member_rating_replay_identity.sql`
- `supabase/tests/wp212s_member_rating_replay_test.sql`
- related Member Opinion precision/authorization/RLS tests
- receipt schema/grant contracts already accepted by WP-2.10

## Historical rollout-compatibility finding

The initial independent review correctly rejected immediate removal of the
legacy five-argument rating overload. Production migrations can precede
frontend promotion, and obsolete cached clients have no enforced
update-required/version gate.

The final implementation therefore follows expand/switch:

- new/current code uses only the seven-argument receipt-aware overload;
- the old five-argument overload remains temporarily callable to authenticated
  clients;
- anon remains denied;
- removal is explicitly deferred to a later safe-retirement migration.

Fresh Pass B must verify that this compatibility surface does not bypass,
replace or weaken the new replay-safe path.

## Verdict rule

Pass B may be marked **PASS** only if the complete fresh review finds:

- no unresolved BLOCKING / P0;
- no unresolved MAJOR / P1;
- no unresolved MINOR / P2 relevant to this bounded packet;
- no missing material authorization/replay/rollout evidence;
- exact-head ordinary CI remains green;
- zero unresolved review threads remain.

Any new finding keeps WP-2.12S out of acceptance. It must be remediated,
exact-head verified and followed by another complete fresh Pass B.

## Current verdict

**PENDING independent review.**

No acceptance, Pass C, parent WP-2.12 resumption or provider action is
authorized by this record.

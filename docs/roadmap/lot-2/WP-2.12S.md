# WP-2.12S — Replay-safe Venue member-rating command boundary

## Identity

- Work Packet ID: `WP-2.12S`
- Lot: 2 — Venues core
- Name: replay-safe Venue member-rating command identity
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW` — Pass A + rollout-compatibility remediation sealed
- Branch: `lot-2/venues-core`
- Parent-resumption base: `2b2035740736dde090da9b1f5d86066975e7bc60`
- Parent-resumption CI: `37342313598` — **5/5 SUCCESS**, including full verify from clean checkout
- Activation-governance head: `4768853fa9c86c44f7cc54c85381fbf87a795547`
- Activation-governance CI: `37343723399` — **5/5 SUCCESS**, including full verify from clean checkout
- Parent packet: `WP-2.12` — BLOCKED with tranches 1–3 GREEN preserved
- Accepted sibling support: `WP-2.12R` — ACCEPTED / COMPLETE
- Primary FIR: #42 / FTR-028
- Product semantics owned elsewhere: WP-2.2 Member Opinion remains accepted; this packet changes replay identity only

## Why this split exists

The next WP-2.12 structured-reconnect tranche needs three already-accepted
server boundaries:

1. Venue Interaction for the visit note;
2. Fact Observation for visit measurements;
3. Venue Member Rating for personal rating.

Interaction already has exact replay semantics through a client-provided
`interactionId`. Fact Observation is replay-safe after accepted WP-2.12R.
Member Rating is not.

Current command:

`set_venue_member_rating(uuid, uuid, text, numeric, bigint)`

accepts only project, Venue, dimension, rating and optimistic expected revision.
If the server commits the rating but the response is lost, retrying the same
offline intent with the original expected revision sees a newer revision and
raises serialization conflict. The client cannot distinguish “prior success,
response lost” from a genuine concurrent change.

The parent is already a 9-point packet. Adding one forward-only migration/API
family (+1) and one meaningfully changed RPC (+2) would make the parent 12
points. The orchestration >10 hard rule therefore requires this support packet.

## Bounded responsibility

WP-2.12S may change only the self-authored Venue member-rating mutation path:

- add stable `operationId` and `deviceId` to the application/port input;
- add a receipt-aware seven-argument rating overload and switch the current adapter to it;
- reuse the existing frozen-schema `sync_mutation_receipts` table;
- record one server-owned receipt per accepted rating operation;
- recognize an exact replay after response loss without incrementing rating
  revision again;
- reject an operation ID reused by another user/device/project/command/intent;
- preserve optimistic revision conflict semantics for genuinely different
  operations;
- enforce live membership/authorization before replay recognition;
- retain the five-argument rating overload only for expand/switch compatibility with obsolete cached clients; the current adapter must not use it, and removal is deferred until obsolete clients are retired or an update-required gate exists.

No preference/favorite command change is in scope because WP-2.12's local visit
draft currently carries only a personal rating intent, not a preference write.

## Receipt semantics

The existing receipt schema remains frozen:

- `operation_id` — stable client UUID / primary key;
- `project_id`, `user_id`, `device_id`;
- `entity_type`;
- `entity_id`;
- `result_revision`;
- `created_at`.

No new receipt column is authorized.

On first successful rating mutation:

- live caller authorization is checked;
- receipt identity is reserved transactionally;
- the rating row is inserted/updated under existing optimistic revision rules;
- the receipt is completed with the resulting rating-row identity and revision.

On replay of the same operation ID:

- live authorization is checked again;
- receipt project/user/device/command identity must match;
- the current rating row referenced by the receipt must still exist;
- Venue, dimension, normalized rating and resulting revision must prove the same
  acknowledged semantic result;
- the provided expected revision must be exactly the predecessor of the stored
  result revision;
- only then may the existing rating row be returned without another write.

If the rating changed after the acknowledged operation, the replay fails closed
as a conflict rather than reconstructing stale truth.

## Explicitly out of scope

- Venue Interaction changes;
- Fact Observation changes — owned and accepted by WP-2.12R;
- member preference/favorite replay hardening;
- generic cross-domain sync — Lot 10;
- local visit draft/base-revision changes — parent WP-2.12;
- reconnect coordinator implementation — parent WP-2.12;
- local media bytes/upload — parent WP-2.12;
- new table, receipt-schema column, RLS policy or permission key;
- provider workflow, secret, production data or real wedding data;
- UI changes.

## Complexity / cohesion review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded domain | 0 | 3 | 0 |
| new persistent entity/table | 0 | 1 | 0 |
| migration/API family | 1 | 1 | 1 |
| meaningfully changed RPC/capability command | 1 | 2 | 2 |
| changed RLS/privileged authorization boundary | 0 | 2 | 0 |
| major UI route/workflow | 0 | 1 | 0 |
| external provider integration | 0 | 3 | 0 |
| new offline/sync semantics | 0 — consumes existing receipt semantics | 2 | 0 |
| **Total** |  |  | **3** |

Cohesion: **PASS**. One command boundary, one receipt identity contract, one
reviewable forward-only migration family.

## RED-first gate

After this activation-governance HEAD is exact-head green, create isolated
RED-only evidence that proves the current accepted branch is unsafe for offline
rating replay.

Required RED classes:

1. application/adapter rating input currently has no stable operation/device
   identity;
2. first rating write succeeds, but repeating the same semantic intent with the
   original expected revision currently raises conflict instead of recognizing
   the prior success;
3. exact replay must not increment revision a second time;
4. same operation ID with changed rating must fail closed;
5. same operation ID with changed dimension must fail closed;
6. same operation ID cannot cross project/user/device identity;
7. revoked/unauthorized caller cannot exploit an existing receipt;
8. genuinely new stale operation still conflicts;
9. current code must use only the receipt-aware overload, while the legacy five-argument overload remains temporarily callable for authenticated obsolete clients during the compatibility window.

The RED PR must remain closed/unmerged. No production implementation before the
RED failures are demonstrated for these intended reasons.

## Planned Pass A evidence

- pgTAP response-loss replay test around `set_venue_member_rating`;
- receipt identity and exact-result/revision tests;
- changed-intent / changed-dimension / cross-user/device/project tests;
- revoked-member replay authorization test;
- adapter contract proving `target_operation_id` and `target_device_id`;
- application service validation for stable UUID operation/device inputs;
- unchanged rating precision and Member Opinion authorization suites;
- full DB/RLS/promotion, browser/mutation, preview and clean-checkout CI.

## Pass A exit

- [x] activation-governance HEAD passed 5/5 ordinary CI including clean checkout
- [x] isolated RED-only evidence captured the current response-loss defect
- [x] stable operation/device identity reaches the rating RPC
- [x] exact replay returns prior semantic result without second revision
- [x] changed intent/identity fails closed
- [x] live authorization is rechecked on replay
- [x] current adapter uses only the receipt-aware rating RPC; legacy five-argument overload remains compatibility-only pending safe retirement
- [x] all existing Member Opinion semantics remain green
- [x] exact-head 5/5 CI including clean checkout
- [x] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## RED evidence and current handoff

- RED-only PR #90 / `9d4bfb5ffffc388b954d9fa9b6a2c031aa46602d` is **closed unmerged**.
- RED CI `37364388534`:
  - Core rerun fails exactly 2 tests: application service drops `operationId/deviceId`; Supabase adapter omits `target_operation_id/target_device_id`; **2,054 existing tests pass**.
  - DB/RLS originally failed 4/7 assertions under the pre-review contract: seven-argument signature absent, legacy signature present, exact retry after response loss raises `40001`, and no replay receipt exists. Fresh review reclassified the legacy-signature-presence failure as a rollout-compatibility requirement; the genuine RED gaps are the missing seven-argument path, failed exact replay and missing receipt.
  - Browser E2E + mutation remains green.
- Current state: **REVIEW_PENDING / B-ADVERSARIAL-REVIEW**.
- Parent WP-2.12: BLOCKED, tranches 1–3 GREEN preserved.
- Accepted sibling support: WP-2.12R.
- Historical packet finding: `WP212S-AR-001` **CLOSED / VERIFIED** — the legacy five-argument authenticated RPC remains during the expand/switch window; current code uses only the receipt-aware seven-argument RPC.
- Pre-finding GREEN head `a5e6c1a4e51c39882c93d4c13038275a430472bc` / CI `37379588696` passed 5/5, 2,056 tests and 100% coverage.
- Remediation PR #91 reviewed head `c751c1908ee0fc7691c4ea4d57ade9bad6dfbabb` / CI `37381076113` passed **5/5 SUCCESS**, including clean checkout; fresh independent Codex review on that exact head found no major issue and left zero unresolved threads.
- PR #91 merged canonically as `c95364bd7f9215fe2686b2e3b76d517cc5b2ded4`; canonical CI `37384351528` passed **5/5 SUCCESS**, including clean checkout. Core reports **236/236 files, 2,056/2,056 tests and 100% statements/branches/functions/lines**.
- Open packet findings: ∅.
- Next permitted action: complete fresh independent Pass B over the entire bounded replay-safe member-rating command. Do not resume parent WP-2.12 until WP-2.12S is ACCEPTED.

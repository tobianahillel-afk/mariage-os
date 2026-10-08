# WP-2.12T — Atomic Venue Fact visit-source provenance link

## Identity

- Work Packet ID: `WP-2.12T`
- Lot: 2 — Venues core
- Name: atomic in-person source provenance enforcement for Venue Fact observation links
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE` — Fresh Pass B v3 PASS; WP212T-AR-001..004 CLOSED / VERIFIED
- Branch: `lot-2/venues-core`
- Parent packet: `WP-2.12` — BLOCKED with all previous GREEN work preserved
- Discovery base: `be616638026b0c56e8d6317b182ccaa5932f1809`
- Discovery-base CI: `37466734867` — **5/5 SUCCESS**, including clean checkout
- Trigger: fresh review of structured-reconnect PR #99
- Primary FIR: #42 / FTR-028 support only; no new product Feature

## Why this packet exists

WP-2.12 structured replay must preserve measurement provenance as
`in_person_visit`.

The parent currently performs:

1. `getSource(projectId, sourceId)`;
2. checks `source.sourceType === "in_person_visit"`;
3. appends/replays the Fact observation;
4. later calls `link_venue_fact_observation_source`.

Those reads/writes are not one transaction. The accepted source update command
may change `source_type` and source revision after step 2. The current link RPC
checks only that the source exists, so another project member can change the
source before step 4 and the replay may acknowledge/remove local work with
false visit provenance.

This cannot be closed by another client-side read. The invariant belongs in the
server-side link transaction.

## Frozen responsibility

Add one provenance-checked link command for the parent visit workflow.

The checked command must:

1. preserve current authentication, active-membership and `venues.write`
   authorization;
2. receive exact project, observation, source and primary-link identity;
3. receive expected source type and expected source revision;
4. require expected source type `in_person_visit` for the parent use case;
5. lock/read the exact same-project source inside the link transaction;
6. fail closed if the source is absent, foreign, wrong type or no longer at the
   expected revision;
7. verify the observation belongs to the same project and a Venue Fact;
8. create/update the link only after all checks pass;
9. return the exact linked project/observation/source/primary identity;
10. create/update **no** link on authorization, type, revision or scope failure.

The existing accepted general four-argument link command remains available to
existing non-visit Fact/Evidence callers. WP-2.12 will consume only the checked
boundary for visit measurement replay after this support packet is accepted.

## Bounded implementation surface

Expected changes only:

- one forward-only Supabase migration defining the checked link RPC;
- one application port/input for expected source type + revision;
- Supabase adapter maps that contract exactly and validates the receipt;
- direct pgTAP authorization/type/revision/isolation/no-write evidence;
- unit/adapter tests;
- minimal parent-compatible fixture/call-site preparation only where necessary
  to expose the accepted port.

No new table, column, RLS policy, permission key, provider, Storage path, UI,
offline queue, Fact product semantic or source-edit behavior belongs here.

## Complexity / cohesion

| Complexity source | Points |
|---|---:|
| one migration/API family | 1 |
| one new/meaningfully changed checked-link RPC | 2 |
| table/entity/RLS/permission | 0 |
| UI/provider/offline workflow | 0 |
| **Total** | **3** |

Cohesion: **PASS**. One atomic invariant, one transaction boundary, one
independent review target.

Folding these 3 points into the original 9-point parent would make WP-2.12 a
12-point packet, so the >10 split rule requires this support packet.

## RED-first gate

No production implementation before this activation-governance HEAD passes all
five ordinary jobs including clean checkout.

Then create an isolated closed/unmerged RED-only PR proving:

1. the accepted boundary has no provenance-checked link command;
2. source type can be changed after a successful client read while the existing
   link RPC still accepts the source;
3. no expected source revision is enforced by the existing link RPC;
4. wrong type/stale revision must produce no observation-source link;
5. authorization and cross-project failures remain non-disclosing.

## Pass A GREEN evidence

At minimum:

- pgTAP correct `in_person_visit` type + exact revision links successfully;
- wrong source type fails and row count remains unchanged;
- stale source revision fails and row count remains unchanged;
- source updated between read and checked-link attempt is rejected;
- outsider/revoked/non-member direct call is denied with zero link side effect;
- cross-project source/observation IDs fail non-disclosing with zero link;
- adapter sends expected source type/revision and exact identities;
- substituted/malformed returned link receipt fails closed;
- legacy accepted general link tests remain green;
- full Core, DB/RLS/promotion, browser/mutation, preview and clean checkout are
  exact-head green.

## Explicitly out of scope

- parent structured replay coordinator and queue settlement;
- Fact observation replay identity — accepted WP-2.12R;
- Member Rating replay identity — accepted WP-2.12S;
- source creation/update product semantics;
- local media bytes/upload;
- generic sync/PWA;
- new table/RLS/permission/provider/UI.

## Pass A exit

- [x] activation-governance HEAD 5/5 including clean checkout
- [x] isolated RED proves missing atomic type/revision contract
- [x] checked link RPC enforces type + revision in the link transaction
- [x] direct authorization/isolation/no-side-effect evidence green
- [x] adapter/application contract green with exact receipt validation
- [x] legacy Fact/Evidence link behavior remains green
- [x] exact-head 5/5 CI including clean checkout
- [x] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## Handoff

- Current state: **ACCEPTANCE_PENDING / C-ACCEPTANCE — Pass C gap ∅, acceptance-record CI pending**
- Activation: `8b0dfb431adc2d09b5d75d0b0c8d22b3315424b9` / CI `37538654009` — **5/5 SUCCESS**, clean checkout included.
- RED-only PR #106 / `b7f3e705c46bd026b5389ec18fda660beb4ebffb` / CI `37539654080` — closed unmerged after the intended checked-link/stale-provenance failures.
- GREEN PR #107 final reviewed head `f6eaa0e232252f1ff8962979097c17c3ca184ee7` / CI `37542674381` — **5/5 SUCCESS**; 237 files / 2,059 tests / 100% global coverage; final Codex re-review 👍; zero unresolved threads.
- Canonical GREEN merge: `a130fe20147fbe892455b86b5fb6ba28149ccc38` / CI `37543738014` — **5/5 SUCCESS**, clean checkout included.
- Fresh Pass B v1 #109 and v2 #111 remain historical failed review records; evidence remediations #110/#112 were tests-only.
- Current canonical review base: `8b453d216b11e6b0bdf6297b6b68dbec669cf954` / CI `37551357375` — **5/5 SUCCESS**, 237 files / 2,059 tests / 100% global coverage.
- Complete Fresh Pass B v3: review-only PR #113 / `aaff9b7ea70951481c3d915449935db183312054` / CI `37552197889` — **PASS**, Codex clean, zero unresolved threads, 5/5 including clean checkout.
- Review record: `docs/roadmap/lot-2/WP-2.12T-FRESH-PASS-B-V3-2026-10-07.md`.
- `WP212T-AR-001..004` — **CLOSED / VERIFIED**; new Fresh Pass-B v3 findings: ∅.
- Parent WP-2.12: **BLOCKED**, prior GREEN work and PR #99 preserved.
- Pass C: **PASS / gap ∅**, recorded in `docs/roadmap/lot-2/WP-2.12T-ACCEPTANCE.md`; Fresh Pass-B/status seal `ce4a55372662b1c9f207c18ea6f3611bcda34c86` / CI `37553218988` — 5/5 SUCCESS.
- Next permitted action: exact-head five-job CI for the Pass-C acceptance record. Do not accept T, resume PR #99 or change parent code before this CI, a separate final accepted support seal and a parent resumption gate.


## Fresh Pass B v3 result — 2026-10-07

Complete independent review in
`docs/roadmap/lot-2/WP-2.12T-FRESH-PASS-B-V3-2026-10-07.md`
is **PASS**.

Review-only PR #113 exact head
`aaff9b7ea70951481c3d915449935db183312054` / CI `37552197889`
passed all five ordinary jobs including clean checkout. Codex reported no major
issue and left zero unresolved review threads. Canonical review base
`8b453d216b11e6b0bdf6297b6b68dbec669cf954` / CI `37551357375`
remains 5/5 green.

WP212T-AR-001..004 are CLOSED / VERIFIED and no new bounded P0/P1/P2 finding
remains. The packet therefore enters `ACCEPTANCE_PENDING / C-ACCEPTANCE`.
This does not accept T and does not authorize parent WP-2.12 / PR #99 until
separate Pass C and the final support seal are exact-head green.


## Pass C reconciliation — 2026-10-08

The separate `docs/roadmap/lot-2/WP-2.12T-ACCEPTANCE.md` reconciles every
bounded provenance-link responsibility as **EXPECTED ↔ IMPLEMENTED ↔ VERIFIED,
gap ∅**. This is a Pass-C verdict, not a terminal acceptance: the acceptance
record HEAD must pass all five ordinary CI jobs, including clean checkout,
before the separate final support seal may mark T ACCEPTED. Parent WP-2.12 and
structured-reconnect PR #99 remain blocked.

# WP-2.12V — Transactional visit observation and checked provenance (activation revalidation)

## Identity / gate

- Work Packet ID: `WP-2.12V` (bounded support packet; READY seal 5/5 green, bounded GREEN review remediations under verification)
- Lot: 2 — Venues core
- Parent: `WP-2.12`, BLOCKED / PR #117 draft
- State: **REVIEW_FAILED / REMEDIATION** — three historical findings AR-001..003 remain OPEN until a new independent complete Pass B on remediated exact head
- Current pass: **B-ADVERSARIAL-REVIEW / remediation verification** — RED #127 closed unmerged; GREEN #128 CI 5/5; fresh review pending
- Primary tracking issue: #125
- Primary Feature: #42 / FTR-028 (support only; no new product Feature)
- Proposed base: `a2161aa3c2271cd685c07d38d6456630c0a2fb38` — accepted R/S/T/U are present
- Production scope: **bounded GREEN candidate only** until fresh Pass B/Pass C. READY seal `314ffd0e29d312d091b7adab05403b2cdec764d1` / CI `37935750162` passed 5/5, and GREEN PR #128 exact head `76f7a4e725023bda51376c594c759357808c9b03` / CI `37950938728` passed 5/5; neither result substitutes for independent review.
- Parent PR #117: **DO NOT MERGE** while its atomic observation-provenance MAJOR finding is open

## Why extraction is required

The current parent structured replay path calls `appendVenueFactObservation`
and then `checkedVenueVisitSourceLink`. Both accepted commands are safe and
idempotent *individually*, but separate PostgREST RPC calls do not share one
PostgreSQL transaction. The first operation can commit an observation while
the second encounters a changed source revision/type, authorization failure or
an invalid/lost acknowledgement. Local durable replay must not incorrectly
claim that such an observation is fully synced with provenance.

The original parent packet is sized **9 points**. The necessary new atomic server RPC (+2), privileged authorization boundary
(+2) and forward-only migration family (+1) push the combined scope to **14**,
exceeding the work-packet maximum. The change cannot be silently added
to WP-2.12 or retroactively reclassify accepted R/S/T/U implementations.

## Frozen bounded contract — activation candidate

Implement one authenticated, project-authorized command which, in a **single
Postgres transaction**:

1. validates non-null stable observation ID, project membership and the
   accepted `venues.write` permission;
2. locks the identified existing `in_person_visit` source and checks exact
   project, type and expected positive revision **before any new observation
   write**;
3. invokes the accepted replay-safe Fact Observation semantics with the
   stable caller-supplied observation ID;
4. creates or verifies the exact canonical `isPrimary=true` observation/source
   link under the same transaction and with the same source preconditions;
5. returns a typed envelope containing the canonical observation **and** the
   canonical checked source link.

Any failure must roll back a *new* observation and its link together.
Application stale source/revision conflicts use **PT412** (HTTP 412) rather
than business-generated `40001`, preserving WP-2.12U.

The command is replay-safe: retrying an identical operation after loss of the
successful HTTP response must return the same observation/link, not duplicate
them. It must also explicitly handle an **already committed matching
observation without its source link** from the historical two-RPC path:
reconcile the link if and only if its observation identity/immutable intent and
the current checked source revision/type are valid; otherwise return a
classified conflict or rejection while retaining the local operation.

The atomic RPC must return an object with exactly these independently
validated components:

- `observation`: accepted canonical observation row. The application
  checks observation ID, project ID, Fact ID, immutable observation
  value/metadata/observed-at, supersession identity and `createdBy`
  against its durable local intent and current authenticated user.
- `link`: accepted canonical observation-source link row. The application
  checks exact project/observation/source IDs and `isPrimary === true`.
- `checkedSource`: evidence **produced inside the same locked SQL
  transaction**, containing source ID, source type `in_person_visit`,
  checked revision, project ID and `checkedBy` = `auth.uid()`.
  The application checks these against the expected source revision,
  project/user and durable intent.

The accepted `ObservationSourceLinkRecord` does **not** carry actor or source
revision and must not be treated as proof of either. The accepted observation
does **not** carry source revision. An invalid, primitive, incomplete or
foreign successful provider payload is never an ACK; durable work is retained.
These three components may be composed into one new typed atomic receipt
without retroactively modifying the accepted individual R/S/T/U records.

## Intended interfaces

- One additive SQL RPC / forward-only migration; accepted existing R/S/T/U
  entry points, signatures, grants, authorization and error contracts remain
  unchanged.
- One application port method and one Supabase adapter method for the atomic
  command; no UI, browser binary, PWA or generic sync dependency.
- Parent PR #117 later switches `dispatchFactObservation` to the new method,
  removing its unsafe two-call sequence, **only after V is accepted**.
- Stable observation/operation IDs, idempotent conflicts, project isolation,
  `in_person_visit` proof, no last-write-wins, no synthetic cloud success.

## Sizing and cohesion — revalidated

| Complexity source | Points |
|---|---:|
| One forward-only migration family | 1 |
| One new transactional public RPC command | 2 |
| New privileged authorization boundary (authenticated SECURITY DEFINER, explicit membership/permission/grants) | 2 |
| New table/entity, new RLS policy or permission key | 0 |
| UI/provider/offline generic semantics | 0 |
| **Total** | **5** |

Cohesion: **PASS**. Everything implements one invariant: an
observation and its verified in-person source provenance must commit or
reconcile together.

Revalidation is **PASS for design and sizing**. Accepted replay core, checked
source-link RPC, text-timestamp public wrapper, multiselect normalization,
supersession and PT412 behavior were re-read from the exact current SQL
migration chain. The 5-point responsibility is independently reviewable.
**READY implementation permission is nevertheless gated on this activation
record's own five ordinary exact-head CI jobs**, including clean checkout.

## Required RED-first evidence

Only after a separate activation governance head is exact-head green, create
an isolated, unmerged RED PR covering:

1. source type or expected revision changes between the former append and
   link calls: no new orphan observation may commit;
2. project/member/permission denial on either operation: no data disclosure,
   no partial observation or link;
3. malformed/foreign observation ACK and malformed/foreign link ACK: no local
   settlement and no false proof of provenance;
4. lost successful response replay using the same observation ID:
   exactly one observation and exact matching link;
5. historical matching orphan from two-call replay: checked repair succeeds
   without writing a duplicate; mismatching orphan is never silently adopted;
6. concurrent source update and checked command: row-lock/revision check
   preserves the correct serialization and PT412 outcome;
7. required observation value validation, canonical multiselect ordering,
   supersession and conflict semantics retained;
8. explicit SQL privilege/RLS and direct RPC denial tests for foreign projects,
   revoked membership, invalid source ID and invalid payload.

A failing test due to formatting, compilation or a test-harness defect does
not count as RED contract evidence.

## GREEN / review / acceptance gates

- Pass A: minimal atomic RPC, provider adapter and direct SQL/TypeScript
  regressions; ordinary CI 5/5 including full verify clean checkout.
- Pass B: truly independent fresh adversarial review, with a dedicated
  remediation cycle for every P0/P1/P2 finding. Review quota refusal or
  reviewer silence is not a PASS.
- Pass C: separate EXPECTED ↔ IMPLEMENTED ↔ VERIFIED reconciliation, gap ∅,
  exact-head clean CI and accepted status seal.
- Only then parent WP-2.12 / PR #117 may adopt the atomic command and undergo
  its own full review and acceptance. The still-unimplemented visit-media and
  Lot-2 exit E2E remain later parent tranches.

## Explicitly excluded

- Rewriting existing R/S/T/U accepted commands or grants;
- changing generic project permissions, introducing a new server table or
  provider integration;
- application-wide sync, service-worker changes, maps, budget, Tasks/Decision;
- importing real wedding/private project data;
- media byte capture/upload, mobile visit UX and Lot-2 integration completion.

## Activation revalidation — 2026-10-09

- Accepted dependency chain: WP-2.12R/S/T/U are each terminal ACCEPTED;
  no accepted interface is changed by this governance packet.
- Canonical parent base: `a2161aa3c2271cd685c07d38d6456630c0a2fb38`
  / CI `37860304869` passed **5/5**, including clean checkout.
- Proposal-only PR #126 initial head
  `4311399c0b28a6110b485dfe0d1242d4d12acef6` / CI
  `37869893376` passed **5/5**, including clean checkout.
- SQL baseline verified: `20261005094000_harden_venue_fact_observation_replay_identity.sql`
  provides the caller-ID public observation wrapper; the current
  `20261008163000_postgrest_safe_replay_conflicts.sql` provides the
  internal replay core and the source-checked link operation with
  `PT412` on stale source type/revision. The latter already locks
  `public.sources` FOR UPDATE.
- The original public observation RPC accepts ten typed parameters, including
  `target_observed_at text`. The new additive atomic RPC will accept those
  same ten observation fields plus
  `target_source_id uuid` and `target_expected_source_revision bigint`.
  It fixes source type to `in_person_visit` and link primary to `true`
  rather than trusting caller-controlled booleans/types.
- It must check and lock the authorized source **before** invoking the
  accepted append/replay command. The subsequent checked link and append
  occur in the **same SQL statement transaction**; any failure rolls back
  both writes. Return JSON with independently verifiable
  `observation` and `link` records, without accepting a successful
  primitive or partial result in the client.
- If an observation with the same stable ID already exists, the accepted
  observation replay core must verify its immutable intent. A missing source
  link from the historical two-call path may be repaired only with the
  currently valid source lock/type/revision; a foreign or conflicting primary
  source link must be rejected, not silently reassigned. A lost success
  response followed by an identical retry must produce the same pair.
- Public RPC security: `SECURITY DEFINER` with fixed
  `search_path = pg_catalog`, explicit `auth.uid()`, active membership,
  `venues.write` and same-project authorization; REVOKE from
  `PUBLIC, anon`, GRANT only to `authenticated`. Existing entrypoint
  grants/signatures stay unchanged.
- All application precondition conflicts use **PT412**, never a custom
  `40001`; input/authorization/identity failures fail closed according
  to the existing codes. Direct pgTAP authenticated/anon/foreign-project
  cases are mandatory.
- Sized **5 points**, cohesion PASS: migration + RPC + privileged authorization boundary. No new table, RLS policy, permission
  key, provider campaign, UI route, local schema or generic sync semantics.
- The only permitted next action is to prove this activation-governance head
  by the five ordinary exact-head CI jobs, including full verify from a
  clean checkout. **After that**, an isolated unmerged RED-only PR may
  challenge atomic rollback, replay/recovery, source lock/revision,
  project isolation and receipt parsing.

## Current handoff

**READY candidate / PLAN; separate READY-governance exact-head CI pending.** PLANNED activation merge `a7e83bdccdc2d1d2330c7e2bbac5ef4da36a88d1` / CI `37916679074` passed **5/5**, clean checkout included. No RED/production change until the READY seal itself is **5/5 green**. Parent WP-2.12 / draft PR #117 remains
**BLOCKED** behind this separately accepted transaction. After V is
ACCEPTED, the parent must replace its unsafe two-RPC path and undergo fresh
review before merging. Local media bytes and Lot-2 exit E2E remain later
parent slices.

## READY state transition — 2026-10-09

- Verified canonical PLANNED activation head: `a7e83bdccdc2d1d2330c7e2bbac5ef4da36a88d1` / CI `37916679074` — **5/5 SUCCESS**, including clean checkout. All provider-only workflows SKIPPED.
- Revalidated that R/S/T/U remain terminal accepted; V's size is **5 points / cohesion PASS** with one additive atomic RPC, one forward-only migration and its privileged auth boundary.
- Transition: **PLANNED → READY candidate**, with a **separate exact-head READY-seal CI pending**. No claim of Pass A, review or acceptance.
- The only permitted next action is verifying the READY seal with 5 ordinary jobs including clean checkout. After green, produce an isolated RED-only PR before touching production.
- Parent WP-2.12, draft #117/#99 stay unmerged/blocked; no provider campaign, schema change or secret action is part of this governance commit.

## Pass-A and adversarial review handoff — 2026-10-09

- READY-seal `314ffd0e29d312d091b7adab05403b2cdec764d1` / CI `37935750162`: **5/5 SUCCESS**, full clean checkout included.
- RED-only PR #127 at `ef531d80e8ea6c34bcf2a6287c4db29f829e7db8`, CI `37941602719`: intentionally failing missing-contract evidence, **closed without merge**.
- GREEN PR #128 latest exact head `76f7a4e725023bda51376c594c759357808c9b03` / CI `37950938728`: **5/5 SUCCESS**, including DB/RLS and full verify from clean checkout.
- Independent review of historical head `d2d9c800d6e1b21915c0d2d9d8456187065362b0` opened `WP212V-AR-001` P1 (same observation/different source concurrency), `WP212V-AR-002` P1 (supersession receipt proof) and `WP212V-AR-003` P2 (revoked/viewer direct denial tests).
- Candidate code now has observation-scoped transaction advisory locking before source/append, database-backed predecessor receipt proof with strict parser verification, and direct revoked/viewer SQL denial and no-side-effect checks. These are **candidate remediations, not yet independently verified closures**.
- A complete fresh independent Pass B for the exact remediated head was requested in PR #128 comment `6084261630`. Current verdict: **REVIEW_FAILED / REMEDIATION pending new review**; all three findings remain OPEN until review evidence says otherwise.
- Parent WP-2.12 and draft PR #117/#99 remain BLOCKED/UNMERGED. No Pass C, support acceptance, parent code resumption, media tranche or later-lot development is authorized by this evidence.

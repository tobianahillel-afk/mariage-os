# WP-2.12V — Transactional visit observation and checked provenance (proposal)

## Identity / gate

- Work Packet ID: `WP-2.12V` (proposed support packet; not yet activated)
- Lot: 2 — Venues core
- Parent: `WP-2.12`, currently A-IMPLEMENT / PR #117 draft
- State: **PROPOSED / ACTIVATION_REVALIDATION_PENDING — NOT READY**
- Primary tracking issue: #125
- Primary Feature: #42 / FTR-028 (support only; no new product Feature)
- Proposed base: `a2161aa3c2271cd685c07d38d6456630c0a2fb38` — accepted R/S/T/U are present
- Production changes authorized: **NONE** until a separate activation-governance head is reviewed and five ordinary CI jobs, including clean checkout, pass
- Parent PR #117: **DO NOT MERGE** while its atomic observation-provenance MAJOR finding is open

## Why extraction is required

The current parent structured replay path calls `appendVenueFactObservation`
and then `checkedVenueVisitSourceLink`. Both accepted commands are safe and
idempotent *individually*, but separate PostgREST RPC calls do not share one
PostgreSQL transaction. The first operation can commit an observation while
the second encounters a changed source revision/type, authorization failure or
an invalid/lost acknowledgement. Local durable replay must not incorrectly
claim that such an observation is fully synced with provenance.

The original parent packet is sized **9 points**. The necessary new atomic
server RPC (+2) and forward-only migration family (+1) push the combined scope
to 12, exceeding the work-packet maximum. The change cannot be silently added
to WP-2.12 or retroactively reclassify accepted R/S/T/U implementations.

## Proposed bounded contract

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

The TypeScript application may consider a queued Fact observation synchronized
**only after both returned records independently match** the durable
observation intent, scope, provenance source, current user and expected
revision. An invalid or primitive success payload is never an ACK.

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

## Sizing and cohesion — activation candidate only

| Complexity source | Points |
|---|---:|
| One forward-only migration family | 1 |
| One new transactional public RPC command | 2 |
| New table/entity/RLS/permissions | 0 |
| UI/provider/offline generic semantics | 0 |
| **Total** | **3** |

Cohesion candidate: **PASS**. Everything implements one invariant: an
observation and its verified in-person source provenance must commit or
reconcile together.

These are **candidate** numbers, not an activation verdict. Before READY,
recheck the exact final RPC signature and prior accepted replay/multiselect/
supersession edge cases against the current schema and all existing tests.

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

## Current handoff

**PROPOSED / NOT READY.** Review this packet against the exact canonical
schema, accepted SQL interfaces, parent 9-point scope and #125. If coherent,
record activation revalidation and prove a separate exact-head READY gate
before *any* RED/production implementation. PR #117 remains draft/unmerged.

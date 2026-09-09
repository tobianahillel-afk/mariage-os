# WP-2.6D — Venue interaction history

## Identity

- Work Packet ID: `WP-2.6D`
- Lot: `2`
- Name: Venue interaction history
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE`
- Primary bounded context: Venue interaction and quote-follow-up history
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Parent responsibility: original matrix packet `WP-2.6`, split from former WP-2.6C at activation sizing review

## Scope

### Primary Feature IDs

- `FTR-026` — Lot-2 Venue interaction responsibility only

### Current-lot responsibilities covered

- Venue-owned append-oriented interaction history;
- strict `occurred_at` and optional `next_follow_up_at` instant boundaries;
- bounded non-empty interaction type and required plain-text summary;
- optional same-project source link;
- optional contact link that must belong to the same Venue parent;
- stable caller-generated UUID replay identity for ambiguous retries;
- same-ID/same-payload idempotent replay and same-ID/different-payload typed conflict;
- append immutability, project-scoped read/write authorization and fail-closed provider parsing;
- interaction list/read model for later WP-2.11 presentation without creating Tasks or provider messages.

### Requirements / Acceptance / Security IDs

- Lot-2 interaction slice of `FTR-026`;
- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`;
- applicable `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..006`, `SEC-VAL-008`, `SEC-VAL-010`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-LOG-002`, `SEC-LOG-004`, `SEC-ABUSE-004`, `SEC-VER-001`, `SEC-VER-005` controls;
- interaction/replay rules frozen by the two commercial workflow addenda.

### Explicitly out of scope for this packet

- contact create/update (`WP-2.6C`);
- offers/components (`WP-2.6A`);
- availability (`WP-2.6B`);
- Email/SMS/WhatsApp sending or delivery-provider semantics;
- automatic Tasks/reminders (Lot 3); `next_follow_up_at` remains metadata only;
- Vendor contacts/interactions (Lot 7);
- offline queue (WP-2.10/2.12);
- Venue UI presentation (WP-2.11).

## Dependency / sequencing

- Required prior packets/features: WP-2.1, WP-2.6A, WP-2.6B and WP-2.6C **ACCEPTED**. WP-2.6C final acceptance-governance verification is `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2 — **5/5 SUCCESS**; contact-parent integrity can therefore rely on stable accepted contact semantics.
- Downstream packet blocked by this packet: WP-2.7 until the decomposed WP-2.6 responsibility is fully accepted.
- Shared interfaces/contracts relied on: both Venue commercial workflow addenda, strict instant contract, contact contract from WP-2.6C, repository/service contracts, RLS matrix and runtime input validation.

## Specification gates

- Core commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755`; CI `34170253114`: **5/5 SUCCESS**.
- Stable interaction UUID replay and same-Venue contact boundaries frozen by `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`; CI `34171320200`: **5/5 SUCCESS**.
- WP-2.6C dependency gate is closed by `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2 — **5/5 SUCCESS**.
- Activation revalidation found one material pre-code ambiguity: append/replay history was frozen, but complete deterministic read order across PostgreSQL microsecond precision and TypeScript millisecond canonicalization was not.
- This freeze closes it normatively: interaction history is `occurred_at DESC`, then `created_at DESC`, then canonical UUID `id ASC`; the provider requests this complete order and application code preserves it after fail-closed validation instead of re-sorting parsed millisecond timestamps.
- `next_follow_up_at` remains independently validated optional metadata. No `next_follow_up_at > occurred_at` rule is invented, and follow-up never participates in history ordering.
- Accepted WP-2.6C exposes stable project + Venue + contact UUID semantics, so same-Venue `contact_id` integrity is implementable without reopening contact mutation scope.
- Specification-freeze gate `1bf2640e20aa7cf7cb7d3b3524aa069b37a09c4b` / `34289908898` is **5/5 SUCCESS**, including clean-checkout `npm run verify`; the activation stop-condition is CLOSED.
- READY-transition gate `3c51873c7503366950b4551d1c01be51202926f5` / `34290710472` is **5/5 SUCCESS**, including clean-checkout `npm run verify`.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded domain | 1 | 3 | 3 |
| new persistent entity/table | 1 | 1 | 1 |
| new migration family | 1 | 1 | 1 |
| new RPC/public endpoint/capability command | 1 | 2 | 2 |
| new/changed RLS or privileged authorization boundary | 1 | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **9** |

### 9-point cohesion rationale

The append-only interaction table, same-Venue contact/source integrity, stable UUID replay command, strict instant/text validation, immutability, RLS and provider boundary form one historical-event vertical slice. Splitting replay from persistence would weaken review.

## Expected vertical slice

- UI/route: none.
- application command/query/service: append/replay interaction and list/read history.
- domain rules/invariants: strict instants, bounded text, same-Venue contact/source integrity, immutable replay equality, and deterministic `occurred_at DESC, created_at DESC, id ASC` history ordering preserved across provider precision boundaries.
- ports/interfaces: Venue interaction command/query port.
- infrastructure adapters: project-scoped Supabase interaction adapter with fail-closed parsing.
- cloud persistence/RLS: staged `interactions` with `parent_type='venue'`, immutable historical rows, atomic replay and project isolation.
- local/offline behavior: none; later packets preserve stable UUID identity.
- import/export/backup/versioning impact: versioned schema only.
- UX/QIF/accessibility impact: none in this packet.

## Pass A — IMPLEMENT

**COMPLETE / VERIFIED.** The red-first interaction boundary `380a6f8fb5ee30a0ca39188d8018114b535bf8b6` / `34291932020` failed as expected before the `interactions` table and atomic `append_venue_interaction` command existed. Final Pass-A implementation head `24364e63ca3ef223b8610fd820fe3d2061582eef` / `34294280214` is **5/5 SUCCESS**. The vertical slice now contains the Venue interaction domain and replay equality rules, application append/list service with typed replay conflict mapping, fail-closed Supabase row parser/adapter preserving canonical provider order, migration `20260909002000_create_venue_interactions.sql` with immutable project-scoped persistence/RLS and the atomic security-definer append command, plus domain/application/provider/DB-RLS tests. Core quality/security, Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify from clean checkout all passed on the exact implementation HEAD. Scope remained interaction-only; WP-2.7 was not started.

## Pass B — ADVERSARIAL REVIEW

Entry transition head `3d08528593c98840389677b877a5a85fd9f4f594`, CI `34297669821` attempt 2: **5/5 SUCCESS** on the unchanged SHA. Attempt 1 failed only because the clean-checkout runner could not bind the local Supabase `54322` port; rerunning the same failed job succeeded without repository changes.

Fresh repository reconstruction found two MAJOR mismatches. Both were converted to dedicated red-first tests in `0d0714085b27f041da0048d18f0a4415d4302294`, CI `34299175470`:

- `WP2.6D-B-001` — **MAJOR / RESOLVED / VERIFIED**: same-project replay identity was misclassified when the caller reused an interaction UUID for another Venue. Red-first DB proof received `42501` where the frozen same-ID/different-payload rule requires typed conflict `23505`. Forward-only migration `20260909014000_harden_venue_interaction_replay_identity.sql` now preserves `42501` only for foreign-project UUID non-disclosure and returns `23505` for a differing same-project payload. Exact remediation head `b39670b1236d081d7e93ae9559bf66c459cd5a3e`, CI `34299796056`: **5/5 SUCCESS**.
- `WP2.6D-B-002` — **MAJOR / RESOLVED / VERIFIED**: the provider parser accepted a response omitting nullable `next_follow_up_at`, treating missing `undefined` as canonical `null`. The parser now requires the field to be present while still allowing explicit `null`. Red-first unit proof failed only this assertion before remediation; exact remediation head `b39670b1236d081d7e93ae9559bf66c459cd5a3e`, CI `34299796056`: **5/5 SUCCESS**.

Independent authorization hardening then added interaction-specific evidence only: `supabase/tests/venue_interactions_authorization_adversarial_review_test.sql` proves the interaction writer and membership downgrade/revocation commands serialize on the project lock before live permission evaluation; the same authenticated session loses write immediately after downgrade and after revocation, and helper execution is not exposed directly. Final fresh reviewed head `d416c6dce810fd05fc3610797f800d746876a631`, CI `34300303989`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify from clean checkout.

Fresh re-review retained deterministic provider ordering, PostgreSQL microsecond chronology, strict instant boundaries, same-Venue contact integrity, same-project source integrity, immutable history, stable UUID replay, foreign-project non-disclosure, direct-table mutation denial and fail-closed provider parsing. Open BLOCKING/MAJOR findings: **∅**.

Pass-B decision: **PASS — transition to ACCEPTANCE_PENDING / C-ACCEPTANCE**. No WP-2.7 work may start until Pass C accepts WP-2.6D.

## Pass C — ACCEPTANCE / RECONCILIATION

**IN PROGRESS.** Entry is permitted from `ACCEPTANCE_PENDING / C-ACCEPTANCE` because Pass B is green with no unresolved BLOCKING/MAJOR finding. Mechanical EXPECTED → IMPLEMENTED → VERIFIED reconciliation is the next action; acceptance has not yet been claimed.

## Handoff

- Current state: `ACCEPTANCE_PENDING`
- Current/next pass: `C-ACCEPTANCE`
- Dependency gate: WP-2.6C **ACCEPTED / acceptance-governance verified** on `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2
- Specification-freeze gate: `1bf2640e20aa7cf7cb7d3b3524aa069b37a09c4b` / `34289908898` — **5/5 SUCCESS**
- READY-transition gate: `3c51873c7503366950b4551d1c01be51202926f5` / `34290710472` — **5/5 SUCCESS**
- Red-first Pass-A boundary: `380a6f8fb5ee30a0ca39188d8018114b535bf8b6` / `34291932020` — expected FAILURE before persistence/command existed
- Pass-A final implementation head/run: `24364e63ca3ef223b8610fd820fe3d2061582eef` / `34294280214` — **5/5 SUCCESS**
- Pass-B entry transition: `3d08528593c98840389677b877a5a85fd9f4f594` / `34297669821` attempt 2 — **5/5 SUCCESS**
- Pass-B red-first findings: `WP2.6D-B-001`, `WP2.6D-B-002` on `0d0714085b27f041da0048d18f0a4415d4302294` / `34299175470` — expected semantic FAILURES confirmed independently
- Pass-B remediation head/run: `b39670b1236d081d7e93ae9559bf66c459cd5a3e` / `34299796056` — **5/5 SUCCESS**
- Final fresh Pass-B reviewed head/run: `d416c6dce810fd05fc3610797f800d746876a631` / `34300303989` — **5/5 SUCCESS**; open BLOCKING/MAJOR findings **∅**
- Pass A implementation status: **COMPLETE / VERIFIED, not accepted**
- Next permitted action: perform Pass C mechanical reconciliation for every WP-2.6D responsibility and applicable control. If any mismatch appears, return to `IN_PROGRESS`; otherwise accept WP-2.6D and only then permit WP-2.7 activation.

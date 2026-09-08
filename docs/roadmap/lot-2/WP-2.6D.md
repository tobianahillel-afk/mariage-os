# WP-2.6D — Venue interaction history

## Identity

- Work Packet ID: `WP-2.6D`
- Lot: `2`
- Name: Venue interaction history
- State: `READY`
- Current pass: `A-IMPLEMENT`
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
- Specification-freeze gate `1bf2640e20aa7cf7cb7d3b3524aa069b37a09c4b` / `34289908898` is **5/5 SUCCESS**, including clean-checkout `npm run verify`; the activation stop-condition is CLOSED and the packet may enter Pass A after this READY transition head is itself verified.

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

Not started.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `READY`
- Current/next pass: `A-IMPLEMENT`
- Dependency gate: WP-2.6C **ACCEPTED / acceptance-governance verified** on `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2
- Specification-freeze gate: `1bf2640e20aa7cf7cb7d3b3524aa069b37a09c4b` / `34289908898` — **5/5 SUCCESS**; deterministic history ordering/provider precision and accepted contact interface are frozen; no material specification ambiguity remains
- Pass A implementation status: **Not started**
- Next permitted action: verify this READY-transition HEAD 5/5. Only then begin WP-2.6D Pass A with red-first vertical-slice evidence. Do not start WP-2.7 concurrently.

# WP-2.6C — Venue contacts and interactions

## Identity

- Work Packet ID: `WP-2.6C`
- Lot: `2`
- Name: Venue contacts and interactions
- State: `PLANNED`
- Current pass: `PLAN`
- Primary bounded context: Venue contact and interaction history
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Parent responsibility: original matrix packet `WP-2.6`, decomposed for orchestration sizing only

## Scope

### Primary Feature IDs

- `FTR-026` — Lot-2 Venue contact/interactions responsibility

### Current-lot responsibilities covered

- Venue-owned contact identity/details with expected-revision collaborative updates;
- canonical phone/WhatsApp value grammar and contact text bounds;
- Venue-owned append-oriented interactions with occurred-at/summary/type/follow-up metadata;
- optional same-project source link and same-Venue contact relationship;
- stable caller-generated UUID replay identity for interaction retries;
- same-ID/same-payload interaction replay and same-ID/different-payload conflict;
- project-scoped read/write authorization and fail-closed provider parsing;
- contact/interaction read model for later WP-2.11 presentation without creating Tasks or provider messages.

### Requirements / Acceptance / Security IDs

- Lot-2 `FTR-026` responsibility;
- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`;
- applicable `SEC-VAL-*`, `SEC-VER-*`, `SEC-DATA-*` controls;
- Venue contact/interaction rules frozen by the two commercial workflow addenda.

### Explicitly out of scope for this packet

- offers/components (`WP-2.6A`);
- availability (`WP-2.6B`);
- Email/SMS/WhatsApp sending or delivery provider semantics;
- automatic Tasks/reminders (Lot 3);
- Vendor contacts/interactions (Lot 7);
- offline queue (WP-2.10/2.12);
- Venue UI presentation (WP-2.11).

## Dependency / sequencing

- Required prior packets/features: WP-2.1 **ACCEPTED**; `WP-2.6A` and `WP-2.6B` **ACCEPTED** under default sequential orchestration.
- Downstream packets blocked by this packet: WP-2.7 until the decomposed WP-2.6 responsibility is fully accepted; WP-2.11 consumes the read model later.
- Shared interfaces/contracts relied on: both Venue commercial workflow addenda, strict instant contract, repository/service contracts, RLS matrix and input validation.

## Specification gates

- Core commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755`; CI `34170253114`: **5/5 SUCCESS**.
- Canonical phone/WhatsApp and interaction replay boundaries frozen by `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`; CI `34171320200`: **5/5 SUCCESS**.
- No unresolved material specification blocker is known at planning time.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded domain | 1 | 3 | 3 |
| new persistent entity/table | 2 | 1 | 2 |
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
| **Total** |  |  | **10** |

### 9–10 point cohesion rationale

Venue interactions may reference a Venue contact and must prove that the contact belongs to the same Venue parent, so the two tables share one parent-integrity/read-model boundary. Contact create/update should reuse ordinary authorized RLS plus expected-revision mutation patterns where sufficient; the one counted capability command is the atomic append/replay interaction path. If implementation requires additional privileged/public command families that raise actual complexity above 10, stop and split `WP-2.6C` into contacts and interactions before production code.

## Expected vertical slice

- UI/route: none.
- application command/query/service: contact create/update/list; interaction append/replay/list/read.
- domain rules/invariants: contact normalization, exact phone grammar, interaction append-only semantics and same-Venue contact link.
- ports/interfaces: contact and interaction repository/service ports.
- infrastructure adapters: project-scoped Supabase adapters with fail-closed parsing.
- cloud persistence/RLS: `contacts`, `interactions`, staged `parent_type='venue'`, revision/immutability/replay/same-project constraints.
- local/offline behavior: none; later packets preserve stable interaction UUID.
- import/export/backup/versioning impact: versioned schema only.
- UX/QIF/accessibility impact: none in this packet.

## Pass A — IMPLEMENT

Not started.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `PLANNED`
- Current/next pass: `PLAN`
- Last green specification verification: `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50` / `34171320200` — **5/5 SUCCESS**
- Remaining blocker/finding: sequencing only; A/B acceptance first. Re-evaluate sizing before activation if shared implementation design changes.
- Next permitted action: none while earlier WP-2.6 subpackets are current.
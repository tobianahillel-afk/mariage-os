# WP-2.6A — Venue offers and offer components

## Identity

- Work Packet ID: `WP-2.6A`
- Lot: `2`
- Name: Venue offers and offer components
- State: `READY`
- Current pass: `PLAN`
- Primary bounded context: Venue commercial offers
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Parent responsibility: original matrix packet `WP-2.6`, decomposed for orchestration sizing only

## Scope

### Primary Feature IDs

- `FTR-025` — Lot-2 Venue offer/date-pricing responsibility

### Current-lot responsibilities covered

- Venue offer identity, project/Venue ownership and commercial lifecycle;
- draft/quoted/accepted/rejected/expired/superseded transition semantics;
- expected-revision draft mutation and historical immutability after quoted;
- integer-minor money/currency, tax, date-window, weekday/end-offset and quoted deposit/security-deposit term validation;
- Venue-owned `offer_components` with staged `owner_type='venue_offer'` only;
- draft-only component mutation and non-draft historical immutability;
- same-project source/offer/Venue integrity and project-scoped read/write authorization;
- fail-closed provider parsing and derived offer read models without Budget authority.

### Requirements / Acceptance / Security IDs

- `VEN-008`;
- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`;
- applicable `SEC-VAL-*`, `SEC-VER-*`, `SEC-DATA-*` controls;
- Lot-2 FTR-025 responsibility as frozen by `VENUE-COMMERCIAL-WORKFLOW-ADDENDUM.md`.

### Explicitly out of scope for this packet

- availability observations (`WP-2.6B`);
- contacts/interactions (`WP-2.6C`);
- Budget/scenario/payment calculation or installment/deposit schedules (Lot 5);
- Vendor offers/components (Lot 7);
- quote-document relationship (WP-2.9);
- offline/local queue (WP-2.10/2.12);
- Venue UI presentation (WP-2.11).

## Dependency / sequencing

- Required prior packets/features: WP-2.1 **ACCEPTED**; Lot-1 project/wedding-date foundation; WP-2.5 **ACCEPTED**.
- Downstream packets blocked by this packet: `WP-2.6B`, `WP-2.6C` by default sequential orchestration; WP-2.7 remains blocked until the full decomposed WP-2.6 responsibility is accepted.
- Shared interfaces/contracts relied on: `VENUE-COMMERCIAL-WORKFLOW-ADDENDUM.md`, `VENUE-COMMERCIAL-WORKFLOW-BOUNDARY-ADDENDUM.md`, `MONEY.md`, `REPOSITORY-SERVICE-CONTRACTS.md`, `RLS-MATRIX-V1.md`, `INPUT-VALIDATION.md`.

## Specification gates

- Core Venue-commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755`; exact CI `34170253114`: **5/5 SUCCESS**.
- Contact/retry boundary addendum `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`; exact CI `34171320200`: **5/5 SUCCESS**.
- The boundary addendum has no additional behavior owned by A except preserving application-owned UUID identity; its phone and append-replay rules are implemented by B/C where applicable.
- No unresolved material specification blocker remains for WP-2.6A.

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

Offers and components are one commercial-history aggregate. Component editability depends directly on the owning offer's draft/non-draft lifecycle; separating their schema/RLS/immutability review would duplicate the same transition boundary and make partial states easier to create. One narrow lifecycle transition capability may be needed for atomic status/revision checks; ordinary create/update paths should use existing authorized repository/RLS patterns when their invariants can be expressed atomically without an additional privileged surface. If implementation discovery requires additional public RPC families that push the actual packet above 10 points, stop and split before proceeding rather than using this estimate as an exception.

## Expected vertical slice

- UI/route: none; WP-2.11 owns presentation.
- application command/query/service: create draft/quoted offer, revise draft, transition status, add/update/remove draft components, list/read offer history.
- domain rules/invariants: exact lifecycle, immutable quoted terms, money/tax/date/component normalization.
- ports/interfaces: Venue commercial repository/service ports following accepted architecture.
- infrastructure adapters: Supabase project-scoped offer/component adapter with fail-closed row parsing.
- cloud persistence/RLS: `venue_offers`, `offer_components`, grants/RLS/same-project integrity, revision/lifecycle enforcement.
- local/offline behavior: none; later packet.
- import/export/backup/versioning impact: schema is versioned; no import/export behavior added.
- UX/QIF/accessibility impact: none in this packet.

## Pass A — IMPLEMENT

Not started. Production code must not begin until the governance/split HEAD carrying this READY state has exact full CI evidence.

### Implementation evidence

- code/modules: pending
- migrations/schema: pending
- tests added: pending
- FIRs updated: this packet record is the FIR-equivalent durable record
- docs/status updated: split/READY governance pending verification

### Pass A exit

- [ ] intended vertical slice exists
- [ ] applicable tests written
- [ ] no known untracked stub/TODO
- [ ] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [ ] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `READY`
- Current/next pass: `PLAN` → `A-IMPLEMENT`
- Last green specification verification: `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50` / `34171320200` — **5/5 SUCCESS**
- Remaining blocker/finding: none at pre-implementation entry
- Next permitted action: verify the split/governance HEAD, then transition only `WP-2.6A` to `IN_PROGRESS / A-IMPLEMENT`. Do not start WP-2.6B/C or WP-2.7 concurrently.
# WP-2.6A — Venue offers and offer components

## Identity

- Work Packet ID: `WP-2.6A`
- Lot: `2`
- Name: Venue offers and offer components
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW`
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
- Split/governance implementation-entry head `c99c4ac091bc21cb55a9b634710a3b7d694a7285`; exact CI `34171995654`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.
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

Started only after exact split/governance verification succeeded on `c99c4ac091bc21cb55a9b634710a3b7d694a7285` / run `34171995654` — **5/5 SUCCESS**. Production implementation was authorized for WP-2.6A only.

Pass A completed on implementation head `e027bbbba93d73546ed19fffac7c26471f45ecb5`; exact CI `34223226316`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.

### Implementation evidence

- domain/application:
  - `src/domain/venues/venue-commercial-values.ts` — strict UUID, civil-date, local-time, weekday/day-offset, integer-minor money, basis-point and quantity boundaries;
  - `src/domain/venues/venue-offer.ts` — canonical offer vocabulary, lifecycle and draft/create normalization;
  - `src/domain/venues/venue-offer-component.ts` — staged Venue-owned component vocabulary and normalization;
  - `src/application/venues/venue-offer-service.ts` — identity/revision validation and provider-neutral offer/component commands;
- infrastructure/provider boundary:
  - `src/infrastructure/supabase/parse-venue-offer-row.ts` — fail-closed offer/component provider response parsing;
  - `src/infrastructure/supabase/supabase-venue-offer-adapter.ts` — project/Venue-scoped Supabase reads and protected RPC mutations;
- migrations/schema:
  - `supabase/migrations/20260908120500_create_venue_offers.sql` — `venue_offers`, staged `offer_components`, same-project integrity, RLS/grants, lifecycle/revision/immutability triggers and protected mutation functions;
  - `supabase/migrations/20260908130000_harden_venue_offer_creation_status.sql` — forward-only fail-closed hardening for NULL creation status;
- dedicated DB/RLS proof:
  - `supabase/tests/venue_offer_commercial_test.sql` — grants/RLS, owner/editor/viewer/outsider/project-B/revoked isolation, draft edits, stale writes, lifecycle, quoted immutability, components, atomic quoted create and numeric fail-closed boundaries;
  - `supabase/tests/venue_offer_null_boundary_test.sql` — explicit NULL creation-status fail-closed regression proof;
- Pass-A hardening discovery:
  - red-first head/run `0149f0b1b77335228af9bf53379a47735c6ec9b6` / `34222772124` — expected DB FAILURE proving NULL `target_status` could otherwise be silently coerced into persisted `draft` state;
  - forward-only remediation head/run `e027bbbba93d73546ed19fffac7c26471f45ecb5` / `34223226316` — **5/5 SUCCESS**; NULL is rejected before insertion and all prior commercial/RLS proofs remain green;
- quality evidence on the verified implementation head:
  - TypeScript typecheck, formatting, lint, architecture, dead-code and marker gates PASS;
  - unit suite PASS at **100% statements/branches/functions/lines**;
  - local Supabase reset + all pgTAP/RLS tests PASS;
  - Playwright E2E and mutation harness PASS;
  - dependency/security gates and build PASS;
  - privacy-safe preview PASS;
  - clean-checkout `npm run verify` PASS;
- FIRs/docs: this packet record is the FIR-equivalent durable implementation record; status board transition queues an independent Pass B.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable tests written
- [x] no known untracked stub/TODO
- [x] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [x] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Queued after verified Pass A. Fresh independent review has not yet been executed against the post-transition governance head.

Required review emphasis:

- TypeScript/domain/provider/PostgreSQL parity for money, tax, civil dates, local time/day offset and lifecycle vocabulary;
- NULL/tri-valued SQL and malformed-provider fail-closed behavior;
- project/Venue/source/component identity confusion and duplicate/foreign provider rows;
- direct-grant/RLS bypass attempts for anon, viewer, outsider, project-B and revoked users;
- stale/concurrent offer and component writes, lock/revision behavior and same-state lifecycle semantics;
- draft-only component/term mutation and quoted/terminal history immutability;
- atomic quoted creation with its initial component set;
- staged `owner_type='venue_offer'` boundary without premature Vendor/Document/Budget authority.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `REVIEW_PENDING`
- Current/next pass: `B-ADVERSARIAL-REVIEW`
- Implementation-entry verification: `c99c4ac091bc21cb55a9b634710a3b7d694a7285` / `34171995654` — **5/5 SUCCESS**
- Verified Pass-A implementation head/run: `e027bbbba93d73546ed19fffac7c26471f45ecb5` / `34223226316` — **5/5 SUCCESS**
- Pass-A red-first hardening control: `0149f0b1b77335228af9bf53379a47735c6ec9b6` / `34222772124` — expected DB FAILURE, then resolved on verified implementation head
- Open BLOCKING/MAJOR findings at Pass-B entry: ∅
- Next permitted action: verify this governance transition on its exact HEAD, then execute a fresh independent WP-2.6A Pass B only. Do not start WP-2.6B/C or WP-2.7 concurrently.

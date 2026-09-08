# WP-2.6A — Venue offers and offer components

## Identity

- Work Packet ID: `WP-2.6A`
- Lot: `2`
- Name: Venue offers and offer components
- State: `ACCEPTED`
- Current pass: `COMPLETE`
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
- Downstream packets: `WP-2.6B` becomes eligible for activation after this packet's acceptance-governance head is verified; `WP-2.6C` remains dependent on A+B; WP-2.7 remains blocked until the full decomposed WP-2.6 responsibility is accepted.
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

**COMPLETE / PASS.** Fresh independent review was executed against the post-Pass-A implementation and governance state. Green CI was not treated as sufficient evidence; six MAJOR mismatches were exposed red-first, remediated, and re-reviewed.

### `WP2.6A-B-001` — MAJOR — RESOLVED / VERIFIED — same-state lifecycle transition bypassed the exact transition matrix

**Historical finding.** `transition_venue_offer_status` returned the current row when `current_row.status = target_status`, even though the frozen commercial transition matrix defines only explicit source→different-target transitions. A direct authenticated writer could therefore issue a same-state protected lifecycle command and receive success instead of a denied transition.

**Remediation.** Forward-only migration `20260908134500_reject_same_state_venue_offer_transitions.sql` removes the same-state success shortcut and requires every status mutation to satisfy `venue_offer_transition_allowed` after writer authorization, row lock and expected-revision validation.

**Evidence.** Red-first `509bc14309e7c911cf5acf1d56c42ea90801a56c` / `34225335069` — expected FAILURE. Remediation `177e8379807e9018f036693566667e40d3cc3d9b` / `34225597966` — **5/5 SUCCESS**.

### `WP2.6A-B-002` — MAJOR — RESOLVED / VERIFIED — duplicate provider identities were accepted in collections/atomic create receipts

**Historical finding.** Provider collections and atomic-create component receipts were parsed row-by-row but did not reject duplicate record IDs. A malformed/untrusted provider response could therefore project duplicate identities into an application read model that cannot exist canonically in PostgreSQL.

**Remediation.** The adapter now rejects duplicate IDs in Venue-offer and component collections and requires the atomic create receipt to contain the exact unique component identity set requested by the command.

**Evidence.** Red-first `e6397a441d1fa4810dfc8d6bae54c7cee35e813b` / `34226318216` — expected FAILURE. Code remediation landed on `6b2c5d39ead06f03a88da8ea1cfd800e358e37b7`; the first fully green verification containing that remediation is `d471b198a5a32919d58da6dbd3880f1c6d4f358b` / `34227416769` — **5/5 SUCCESS**.

### `WP2.6A-B-003` — MAJOR — RESOLVED / VERIFIED — mutation receipts were not bound to command lifecycle intent

**Historical finding.** A structurally valid provider response with the correct project/Venue/offer identity could return a lifecycle status contradicting the requested create/update/transition command and still be accepted by the adapter.

**Remediation.** Mutation receipts now verify the exact expected status: create must return the requested `draft|quoted`, draft update must return `draft`, and transition must return the requested target status.

**Evidence.** Red-first `ab5369ab6cd59746dc0a4b6339f75cbcb1e71935` / `34228042878` reached `npm run test:unit` and failed as expected before the workflow was cancelled by the superseding remediation push. The remediation is retained in the final reviewed head `c7339227126e0df6969809644b5d0eb2512d350c` / `34233201350` — **5/5 SUCCESS**.

### `WP2.6A-B-004` — MAJOR — RESOLVED / VERIFIED — create/update receipts were not bound to commanded source identity

**Historical finding.** A malformed provider response could substitute another valid same-shaped `source_id` in a create/update receipt. Project/Venue/offer parsing alone did not prove that the returned commercial provenance matched the command input.

**Remediation.** Create and draft-update receipts now require exact `source_id` equality with the normalized command terms; source substitution fails closed.

**Evidence.** Red-first `9ef4dc1fe42da5ec9b1e6876ab5f667e45b95d84` / `34228937549` reached `npm run test:unit` and failed as expected before cancellation by the superseding remediation push. The remediation is retained and fully verified in `61aa9bf52660e984fce2ff3d77982b4853c68976` / `34231035762` and in the final reviewed head.

### `WP2.6A-B-005` — MAJOR — RESOLVED / VERIFIED — TypeScript quantity precision accepted values PostgreSQL rejects

**Historical finding.** `isCommercialQuantity` used a tolerance-style rounded comparison that could accept sub-mill precision values outside the exact `numeric(12,3)` contract, while PostgreSQL correctly rejected values where `target_quantity <> trunc(target_quantity, 3)`.

**Remediation.** The TypeScript validator now requires exact equality to the three-decimal rounded representation, preserving the non-negative `999999999.999` ceiling and exact TypeScript↔PostgreSQL parity.

**Evidence.** Red-first `905bcd36fa9750430413d7cbc6729e91e3d0d2a9` / `34229413676` — expected unit FAILURE. Remediation `61aa9bf52660e984fce2ff3d77982b4853c68976` / `34231035762` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.

### `WP2.6A-B-006` — MAJOR — RESOLVED / VERIFIED — SQL lifecycle boundary allowed incomplete `quoted` state

**Historical finding.** The public authenticated mutation boundary could create an offer directly as `quoted`, or transition `draft → quoted`, without enforcing the quote-readiness preconditions exercised by the bounded commercial workflow. Six red-first DB cases proved the bypass: missing validity, missing price signal and missing initial component, both for direct quoted creation and draft transition.

**Remediation.** Forward-only migration `20260908140000_enforce_venue_offer_quote_readiness.sql` moves quote-readiness into the authoritative offer integrity trigger. Any transition into `quoted` now requires the frozen validity/price/component readiness conditions. Existing lifecycle fixtures that intentionally exercised later states were updated only to provide a valid synthetic initial component; production invariants were not weakened.

**Evidence.** Red-first `41db57cb8adff6e33c4edf346f50d2a67bc7323b` / `34232111029` — expected DB FAILURE on the six readiness assertions. Production remediation `4418629d0032d70f64490251d5e286b4496e4a8c`, fixture alignment `c7339227126e0df6969809644b5d0eb2512d350c`; final exact run `34233201350` — **5/5 SUCCESS**, including Local Supabase DB/RLS and clean-checkout `npm run verify`.

### Final fresh independent Pass B

- final reviewed head/run: `c7339227126e0df6969809644b5d0eb2512d350c` / `34233201350` — **5/5 SUCCESS**;
- Core quality/security, Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and Full verify from clean checkout all succeeded;
- B-001 through B-006 remained effective under re-review;
- direct table grants remain read-only for authenticated users; writes remain behind writer-authorized RPC boundaries;
- same-project Venue/source/offer/component integrity, expected-revision locks, draft-only edits, quoted/history immutability, staged `owner_type='venue_offer'`, exact money/tax/date/time/quantity boundaries and fail-closed provider identity/intent parsing were rechecked;
- fractional nested component minor-unit money and tax basis points are explicitly rejected by pgTAP rather than rounded;
- no Vendor, Document, Budget, availability, contacts, offline or UI authority leaked into WP-2.6A;
- open BLOCKING/MAJOR findings: **∅**;
- Pass B decision: **PASS**.

## Pass C — ACCEPTANCE / RECONCILIATION

Entry head/run `d348abdb42a2ca8319fb6711c08551cfb3bcfbae` / `34235598936`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify`.

### Entry gate

- [x] packet entered Pass C from `ACCEPTANCE_PENDING`
- [x] current pass was `C-ACCEPTANCE`
- [x] no unresolved BLOCKING/MAJOR Pass B finding exists

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| Venue offer identity/ownership/history | Multiple same-project Venue offers retain stable UUID identity and historical rows | `venue_offers`, service/port/adapter, same-project FKs and no ordinary hard delete | unit/provider tests + commercial pgTAP/RLS + `34235598936` | PASS |
| Lifecycle and concurrency | exact create/status matrix, draft-only term edits, expected-revision safety, immutable quoted/terminal history | offer domain/service + protected RPCs + lifecycle/immutability triggers + same-state hardening migration | lifecycle/stale-write/same-state red-first regression + final full verify | PASS |
| Quoted readiness | entering `quoted` requires valid commercial readiness rather than incomplete historical state | authoritative integrity trigger in `20260908140000_enforce_venue_offer_quote_readiness.sql` | six-case red-first DB proof then final DB/RLS + clean verify | PASS |
| Money/tax/date/time terms | integer minor units, explicit currency/tax, civil dates, weekday, local-time/day-offset and bounded quoted deposit/security-deposit terms | centralized TS normalizers + SQL constraints/RPC validation | unit boundary tests + pgTAP numeric/date/time/fractional-money/tax tests | PASS |
| Venue-owned offer components | staged `owner_type='venue_offer'`, exact enums/quantity, same-project owner, draft-only mutation | component domain/service/adapter + `offer_components` schema/triggers/RPCs | unit/provider/pgTAP component, immutability and exact `numeric(12,3)` parity tests | PASS |
| Authorization/isolation | `venues.read` for reads; `venues.write` for mutation; grants + RLS + active membership/project isolation | direct SELECT grants only plus writer-authorized RPCs and same-project relational constraints | owner/editor/viewer/anon/outsider/project-B/revoked direct DB/RLS matrix | PASS |
| Provider trust boundary | API/provider data cannot substitute project/Venue/offer/component/source/status identities or duplicate canonical rows | fail-closed parsers, duplicate rejection, exact receipt status/source/component identity checks | adversarial adapter/receipt tests including B-002..B-004 | PASS |
| Scope boundaries | no Budget calculation/payment schedule, Vendor offer, Document link, availability, contact, offline or UI authority | staged schema/addendum boundaries; only offer/component modules and migrations introduced | compare/review of packet changes + full architecture/static gates | PASS |

### Acceptance checks

- [x] all packet responsibilities reconciled
- [x] applicable FIR-equivalent fields complete in this packet record
- [x] required automated evidence green on exact Pass-C entry head
- [x] no BLOCKING/MAJOR finding open
- [x] architecture/complexity/static gates green
- [x] documentation/status/handoff synchronized for acceptance
- [x] downstream prerequisites clearly recorded

Requirements/control reconciliation for the WP-2.6A-owned slice of `FTR-025`, `VEN-008`, applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`, and applicable validation/verification/data-boundary controls: **PASS**.

Required WP-2.6A responsibilities minus accepted/evidenced WP-2.6A responsibilities: **∅**.

Deferred ownership remains explicit and is not claimed by this acceptance: `VEN-009` availability → WP-2.6B; contacts/interactions/FTR-026 → WP-2.6C; Budget/scenario/payment truth → Lot 5; Vendor offers → Lot 7; quote-document relationship → WP-2.9; local/offline integration → WP-2.10/2.12; presentation/UI → WP-2.11.

**Pass C decision: PASS — WP-2.6A ACCEPTED.**

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `COMPLETE`
- Implementation-entry verification: `c99c4ac091bc21cb55a9b634710a3b7d694a7285` / `34171995654` — **5/5 SUCCESS**
- Verified Pass-A implementation head/run: `e027bbbba93d73546ed19fffac7c26471f45ecb5` / `34223226316` — **5/5 SUCCESS**
- Pass-B findings `WP2.6A-B-001..006`: **RESOLVED / VERIFIED**
- Final fresh Pass-B reviewed head/run: `c7339227126e0df6969809644b5d0eb2512d350c` / `34233201350` — **5/5 SUCCESS**
- Pass-C entry head/run: `d348abdb42a2ca8319fb6711c08551cfb3bcfbae` / `34235598936` — **5/5 SUCCESS**
- Required responsibilities minus accepted/evidenced responsibilities: ∅
- Remaining blocker/finding: ∅ for WP-2.6A
- Next permitted action: verify the exact acceptance-governance HEAD containing this decision, then activate/revalidate WP-2.6B. Do not start WP-2.6C or WP-2.7 concurrently.

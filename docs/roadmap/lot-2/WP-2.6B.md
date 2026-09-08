# WP-2.6B — Venue availability observations

## Identity

- Work Packet ID: `WP-2.6B`
- Lot: `2`
- Name: Venue availability observations
- State: `ACCEPTED`
- Current pass: `COMPLETE`
- Primary bounded context: Venue availability evidence
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Parent responsibility: original matrix packet `WP-2.6`, decomposed for orchestration sizing only

## Scope

### Primary Feature IDs

- `FTR-025` — Lot-2 Venue availability responsibility

### Current-lot responsibilities covered

- append-oriented `venue_availabilities` history;
- exact availability statuses and event-date/date-option consistency;
- strict observed/expiry instant boundaries;
- same-project source/Venue/date-option integrity;
- option-held expiry semantics without historical rewrite;
- deterministic latest/relevant availability read model without deleting history;
- stable caller-generated UUID replay identity for ambiguous retries;
- same-ID/same-payload idempotent replay and same-ID/different-payload typed conflict;
- project-scoped RLS and fail-closed provider parsing.

### Requirements / Acceptance / Security IDs

- `VEN-009`;
- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- applicable `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..006`, `SEC-VAL-008`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-ABUSE-004`, `SEC-VER-001`, `SEC-VER-005` controls;
- Lot-2 FTR-025 availability responsibility.

### Explicitly out of scope for this packet

- offer/component lifecycle (`WP-2.6A`);
- contacts/interactions (`WP-2.6C`);
- Task automation, Budget truth, Vendor availability, Documents, offline queue and Venue UI.

## Dependency / sequencing

- Required prior packets/features: WP-2.1 **ACCEPTED**; Lot-1 wedding-date/date-option foundation; `WP-2.6A ACCEPTED` under default sequential execution.
- WP-2.6A final acceptance-governance head/run: `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Downstream packets blocked by this packet: `WP-2.6C`; WP-2.7 until all WP-2.6 subpackets are accepted.
- Shared interfaces/contracts relied on: both Venue commercial workflow addenda, strict Lot-2 instant contract, repository/service contracts, RLS matrix and input validation.

## Specification gates

- Core commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755`; CI `34170253114`: **5/5 SUCCESS**.
- Stable append replay semantics frozen by `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`; CI `34171320200`: **5/5 SUCCESS**.
- Deterministic availability selection/expiry semantics frozen by `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b`; CI `34239745903`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Canonical latest ordering is `observed_at DESC`, `created_at DESC`, `id ASC`; elapsed `option_held` derives effective `expired` without rewriting history; no observation remains distinct from explicit stored `unknown`.
- Revalidation after WP-2.6A found no shared-interface incompatibility and no unresolved material specification blocker.
- WP-2.6B READY/governance head/run: `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**, including clean-checkout `npm run verify`; 101 unit files / 996 tests, 40/40 Playwright tests and 40 DB files / 858 pgTAP tests passed on the clean-checkout baseline.

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

### 9–10 point cohesion rationale

The table, append command, same-ID replay semantics, strict timestamp validation, RLS and latest/relevant read model are one evidence-history vertical slice. Splitting the append command from its immutable persistence/retry/read boundary would make independent review weaker rather than easier.

Activation revalidation confirms the packet remains **9 points**. WP-2.6A introduced no additional B-owned command/schema boundary and no split is required.

## Expected vertical slice

- UI/route: none.
- application command/query/service: append/replay availability observation and list/read relevant history.
- domain rules/invariants: status/date/expiry/source semantics and replay equality; deterministic latest/effective read model.
- ports/interfaces: availability command/query port.
- infrastructure adapters: Supabase adapter with fail-closed provider parsing.
- cloud persistence/RLS: `venue_availabilities`, immutable rows, atomic replay command, project isolation.
- local/offline behavior: none; later packets preserve stable UUID identity.
- import/export/backup/versioning impact: versioned schema only.
- UX/QIF/accessibility impact: none here.

## Pass A — IMPLEMENT

**COMPLETE / VERIFIED.**

Entry gate was closed by the exact READY/governance head/run `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.

Verified implementation head/run: `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.

Pass-A evidence on that exact head includes:

- Core quality/security **SUCCESS**: format, lint, architecture, deadcode, negative quality/security controls, dependency policy and production build all pass;
- 105 unit test files / 1019 tests **PASS** at **100% statements / branches / functions / lines** measured coverage;
- Local Supabase DB/RLS **SUCCESS**;
- Browser E2E and mutation harnesses **SUCCESS**;
- privacy-safe preview artifact **SUCCESS**;
- `Full verify from clean checkout` **SUCCESS**.

Implementation remained restricted to WP-2.6B-owned domain/application/adapter/persistence/tests. WP-2.6C and WP-2.7 were not started concurrently.

## Pass B — ADVERSARIAL REVIEW

**COMPLETE / PASS.** Fresh independent review was executed against the Pass-A implementation and every remediation candidate. Green CI was not treated as sufficient evidence: five MAJOR mismatches were reproduced red-first, remediated, and re-reviewed.

- `WP2.6B-B-001` — provider `timestamptz` parsing required textual `.000Z` identity instead of accepting/canonicalizing the frozen strict instant grammar: **RESOLVED / VERIFIED**.
- `WP2.6B-B-002` — referenced candidate wedding dates could move after append and leave immutable availability history inconsistent: **RESOLVED / VERIFIED** with durable relational protection.
- `WP2.6B-B-003` — a foreign-project UUID collision could surface a typed replay conflict and violate cross-project non-disclosure: **RESOLVED / VERIFIED**.
- `WP2.6B-B-004` — append authorization was not serialized with the accepted project membership downgrade/revocation boundary: **RESOLVED / VERIFIED**.
- `WP2.6B-B-005` — PostgreSQL preserves microsecond `observed_at` precision while TypeScript canonicalizes instants to milliseconds; re-sorting parsed rows could therefore select an older observation by UUID when two observations fell inside the same millisecond: **RESOLVED / VERIFIED**. Red-first `f9150897084d9485e97bffe0b1d9b45dac9287a5` / `34262386054` failed exactly the adversarial ordering test. The adapter now requests the frozen full order `observed_at DESC`, `created_at DESC`, `id ASC` from Supabase and preserves that validated order; the service consumes the first same-date record rather than re-sorting timestamps after precision loss.
- Explicit Source-history evidence now proves that a linked Source may become `broken` and lose its URL without destroying the immutable availability observation, while physical Source deletion remains restricted while cited.
- Final fresh reviewed remediation head/run: `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Core quality/security: **107 test files / 1022 tests PASS** at **100% statements / branches / functions / lines**; format, lint, architecture, dead-code, negative controls, dependency policy and build PASS.
- Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify from clean checkout all **SUCCESS** on the same exact head.
- Fresh post-remediation rereview found no additional BLOCKING/MAJOR mismatch; provider rows remain fail-closed for shape/identity/domain validity and the remediation introduced no migration, RPC or cross-packet authority.
- Open BLOCKING/MAJOR findings: **∅**.
- Pass B decision: **PASS**.

## Pass C — ACCEPTANCE / RECONCILIATION

Entry head/run `6e091cc5088fece027f13c6764092453da18f418` / `34274455248`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify from clean checkout.

### Entry gate

- [x] packet entered Pass C from `ACCEPTANCE_PENDING`
- [x] current pass was `C-ACCEPTANCE`
- [x] no unresolved BLOCKING/MAJOR Pass B finding exists
- [x] exact corrected Pass-C governance head is 5/5 green

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| Availability identity and immutable history | Multiple observations may coexist for one Venue/date; caller UUID is stable retry identity; historical rows are not ordinarily rewritten/deleted | `venue_availabilities`, domain/service/ports/adapter, append RPC and immutability triggers | domain/service tests + direct DB append/history/update/delete tests + `34274455248` | PASS |
| Date/date-option and instant semantics | exact civil date; optional same-project date option must match `event_date`; strict observed/expiry instants; referenced candidate date cannot drift away from immutable history | TS normalizers, strict SQL instant/date parsing/checks, composite `(project_id,date_option_id,event_date)` FK | invalid date/instant/expiry tests, date-option mismatch/cross-project tests, adversarial referenced-date `23503` regression | PASS |
| Source provenance/history | optional source is same-project; source breakage/URL removal never erases the availability observation | same-project source FK and immutable cited `source_id` | source-history pgTAP + cross-project source denial | PASS |
| Replay/idempotency/non-disclosure | same ID + same payload is idempotent; same ID + different payload is typed conflict; foreign-project UUID collision discloses nothing | caller-owned UUID, canonical payload equality, append RPC conflict/non-disclosure branches | domain/service/adapter replay tests + pgTAP replay/conflict + cross-project collision `42501` adversarial proof | PASS |
| Latest/effective read model | latest uses `observed_at DESC, created_at DESC, id ASC`; no observation remains distinct from explicit `unknown`; elapsed hold derives `expired` without history mutation | ordered Supabase query, validated provider order, service first same-date selection, pure effective-status derivation | domain/service/adapter tests + microsecond-order adversarial regression | PASS |
| Authorization/isolation | reads require `venues.read`; writes require live `venues.write`; direct table mutation is denied; project/revocation isolation is preserved | SELECT-only authenticated grant + RLS + writer-authorized RPC + project lock before permission check | owner/editor/viewer/anon/outsider/project-B/revoked matrix + authorization-concurrency regression | PASS |
| Provider trust boundary | malformed, duplicated or identity/payload-substituted provider responses fail closed | strict row parser, expected project/Venue/id checks, duplicate-ID rejection and exact receipt payload verification | parser/adapter/provider-time adversarial unit tests | PASS |
| Scope boundaries | no contacts/interactions, Task, Budget, Vendor, Document, offline queue or Venue UI authority is introduced | WP-2.6B-only domain/application/adapter/migrations/tests | packet diff review + architecture/static/dead-code gates on exact Pass-C entry head | PASS |

### Acceptance checks

- [x] all packet responsibilities reconciled
- [x] FIR-equivalent durable packet fields and links are complete for the WP-2.6B-owned slice
- [x] required automated evidence is green on the exact Pass-C entry head
- [x] no BLOCKING/MAJOR finding remains
- [x] architecture/complexity/static gates are green
- [x] documentation/status/coverage are synchronized for acceptance
- [x] downstream prerequisites remain explicit

Requirements/control reconciliation for the WP-2.6B-owned slice of `FTR-025` / `VEN-009`, applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`, and the explicit applicable `SEC-*` controls listed above: **PASS**.

Global Feature scenarios `ACC-031` (candidate dates / atomic selection) and `ACC-049` (historical quote under scenario change) remain whole-feature/cross-lot evidence tied to date/Budget responsibilities; WP-2.6B does **not** falsely claim them as availability-packet acceptance evidence. The direct packet requirement is `VEN-009` plus the frozen availability/replay/security invariants and their dedicated evidence.

Whole `FTR-025` remains **IN_PROGRESS**, not ACCEPTED: WP-2.6A and WP-2.6B Lot-2 responsibilities are accepted, while Budget/scenario integration continues in Lot 5.

Required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**.

Deferred ownership remains explicit and is not claimed by this acceptance: contacts/interactions/FTR-026 → WP-2.6C; Budget/scenario truth → Lot 5; Vendor availability/commercial workflow → Lot 7; quote-document relationship → WP-2.9; local/offline integration → WP-2.10/2.12; Venue presentation/UI → WP-2.11.

**Pass C decision: PASS — WP-2.6B ACCEPTED.**

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `COMPLETE`
- WP-2.6A acceptance-governance verification: `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**
- Last green specification verification: `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903` — **5/5 SUCCESS**
- WP-2.6B READY/governance verification: `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**
- WP-2.6B Pass-A verification: `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**
- Pass-B findings `WP2.6B-B-001..005`: **RESOLVED / VERIFIED**
- Final fresh Pass-B reviewed head/run: `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**
- Corrected Pass-C entry head/run: `6e091cc5088fece027f13c6764092453da18f418` / `34274455248` — **5/5 SUCCESS**
- Required responsibilities minus accepted/evidenced responsibilities: **∅**
- Remaining blocker/finding: **∅** for WP-2.6B
- Next permitted action: verify the exact acceptance-governance HEAD containing this decision, then activate/revalidate WP-2.6C. Do not start WP-2.7 concurrently.

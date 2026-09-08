# WP-2.6B — Venue availability observations

## Identity

- Work Packet ID: `WP-2.6B`
- Lot: `2`
- Name: Venue availability observations
- State: `IN_PROGRESS`
- Current pass: `B-ADVERSARIAL REVIEW`
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
- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`;
- applicable `SEC-VAL-*`, `SEC-VER-*`, `SEC-DATA-*` controls;
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

**IN PROGRESS.**

Fresh independent review starts from exact Pass-A head `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / run `34253821826`. The review must challenge persistence/RLS, retry identity and cross-project non-disclosure, date-option/source integrity, timestamp parity, provider parsing, effective-expiry/latest ordering and negative-test completeness before any Pass-C transition.

Open BLOCKING/MAJOR findings at Pass-B entry: **∅**.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `B-ADVERSARIAL REVIEW`
- WP-2.6A acceptance-governance verification: `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**
- Last green specification verification: `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903` — **5/5 SUCCESS**
- WP-2.6B READY/governance verification: `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**
- WP-2.6B Pass-A verification: `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**
- Remaining blocker/finding at Pass-B entry: none
- Next permitted action: perform fresh WP-2.6B Pass B adversarial review only. Do not start WP-2.6C or WP-2.7 concurrently.

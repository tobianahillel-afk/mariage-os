# WP-2.1 — Venue identity, authorized persistence and lifecycle-history foundation

## Identity

- Work Packet ID: `WP-2.1`
- Lot: `2`
- Name: Venue identity, authorized persistence and lifecycle-history foundation
- State: `REVIEW_FAILED`
- Current pass: `REMEDIATION`
- Primary bounded context: `venues`
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Implementer/reviewer if relevant: Pass A implemented in the current AI development session; Pass B reconstructed expectations from repository contracts rather than trusting implementation intent

## Scope

### Primary Feature IDs

- `FTR-013` — current packet responsibility: canonical venue identity/persistence and quick-add command foundation.
- `FTR-014` — current packet responsibility: lifecycle transition, rejection/restore and durable status-history foundation.

### Current-lot responsibilities covered

- create project-scoped `venues` persistence with stable UUID, human code/name/location/contact core and revision/audit metadata;
- preserve natural human-code semantics for later gallery/table sorting;
- allow minimal canonical venue creation without requiring unrelated detail fields;
- prevent arbitrary hard delete as ordinary venue workflow;
- implement lifecycle status vocabulary from `STATE-MACHINES.md`;
- make reject reversible and preserve rejection/history evidence;
- use a narrow lifecycle transition command rather than permitting unrestricted client status mutation;
- record meaningful lifecycle changes in the frozen generic activity-history model rather than inventing a parallel audit architecture;
- declare explicit `venues.read` / `venues.write` grants/RLS behavior;
- directly prove anon/outsider/project-B/revoked denial and permitted member behavior;
- establish application/infrastructure port boundaries that later local-first/UI packets will reuse.

### Requirements / Acceptance / Security IDs

- `VEN-001`, `VEN-002`, `VEN-006`, `VEN-012`;
- `PRD-007`;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- `ACC-005`, `ACC-006` security/isolation behavior as applicable to the new venue resource;
- `ACC-032` venue rejection/history/restore packet responsibility;
- `ACC-021` only the minimal-creation side is prepared here; explicit unknown fact rendering is owned by WP-2.3/WP-2.11.

### Explicitly out of scope for this packet

- spaces/capacity rows;
- partner ratings/favorites;
- facts/criteria/observations/sources;
- offers/availability/access routes;
- media/documents/tags;
- venue local-cache/pending mutation semantics beyond defining reusable repository/command contracts;
- gallery/table/detail/compare/visit UI;
- duplicate fuzzy matching engine/import external identifiers; WP-2.1 preserves normalized duplicate-warning inputs only, while import/dedup semantics remain Lot 4;
- Tasks/Map/Budget/Vendor functionality.

## Dependency / sequencing

- Required prior packets/features: Lot 0 ACCEPTED; Lot 1 ACCEPTED and promoted to `main` through PR #7; permission catalog and project tenancy/RLS helpers already accepted.
- Downstream packets blocked by this packet: WP-2.2 through WP-2.12 all require canonical venue identity.
- Shared interfaces/contracts relied on: `has_project_permission`, permission catalog, protected project shell, repository layering, `LocalProjectStore` future integration, migration/RLS conventions.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 1 | 3 | 3 |
| persistent entity/table | 2 (`venues`, `activity_log`) | 1 | 2 |
| migration family | 1 | 1 | 1 |
| RPC/public endpoint/capability command | 1 lifecycle transition command | 2 | 2 |
| RLS/privileged authorization boundary | 1 family | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **10** |

- 9–10 point cohesion rationale: venue lifecycle history and the protected status transition must ship with the venue row/RLS boundary. Splitting history or transition authorization into another packet would temporarily expose an unrestricted lifecycle mutation path or make reject/restore unverifiable.
- >10 point atomicity/safety exception if applicable: not applicable.

## Expected vertical slice

- UI/route: no full Venue screen yet; later UI packets consume this application boundary. Protected route behavior remains inherited from Lot 1.
- application command/query/service: create/update ordinary venue data contract; lifecycle transition command/port; venue lookup/list contract sufficient for downstream packets.
- domain rules/invariants: venue status union/transitions, rejection/restore rules, natural code comparison/normalization and minimal input validation.
- ports/interfaces: project-scoped venue repository/command port without infrastructure leakage.
- infrastructure adapters: Supabase venue adapter using the accepted browser client/composition boundary.
- cloud persistence/RLS: `venues` + meaningful `activity_log` history, same-project permission policies, protected status mutation and direct deny tests.
- local/offline behavior: no new IndexedDB store; WP-2.10 will integrate these commands with existing `LocalProjectStore` before UI may claim durable offline success.
- import/export/backup/versioning impact: schema is additive; no import engine or real-data migration; later canonical import/backup must consume the documented schema.
- UX/QIF/accessibility impact: establishes semantics only; no user-facing route accepted in this packet.

## Pass A — IMPLEMENT

### Implementation evidence

- code/modules:
  - `src/domain/venues/venue-status.ts` + tests — frozen status vocabulary and rejection semantics;
  - `src/domain/venues/venue-code.ts` + tests — deterministic natural human-code ordering with 100% coverage;
  - `src/domain/venues/venue-quick-add.ts` + tests — centralized minimal input normalization/URL scheme validation/length bounds;
  - `src/application/venues/venue-command-port.ts`, `quick-add-venue.ts`, `change-venue-status.ts` + tests — provider-neutral create/lifecycle command boundary;
  - `src/application/venues/venue-repository-port.ts`, `update-venue-core.ts` + tests — project-scoped list/get/ordinary-edit boundary;
  - `src/infrastructure/supabase/supabase-venue-command-adapter.ts` + tests — safe-field insert and protected lifecycle RPC adapter with fail-closed provider response parsing;
  - `src/infrastructure/supabase/parse-venue-core-row.ts` + tests — runtime validation including expected-project check and rejection/status consistency;
  - `src/infrastructure/supabase/supabase-venue-repository-adapter.ts` + tests — project-scoped read/list and safe ordinary-field update payload.
- migrations/schema:
  - `supabase/migrations/20260906114000_create_venue_core.sql` — canonical `venues`, generic `activity_log`, grants/RLS/audit revision trigger and `transition_venue_status` command;
  - `supabase/migrations/20260906115400_harden_activity_log_event_time.sql` — event-time ordering hardened to use real event timestamps for lifecycle history.
- tests added:
  - `supabase/tests/venue_core_rls_test.sql` — 44 direct pgTAP assertions covering grants, RLS, anon/owner/editor/viewer/outsider/revoked/project-B behavior, protected lifecycle, no hard delete, direct status-update denial, revision increment, reject/restore/history/idempotent same-state retry;
  - domain/application/infrastructure unit/adversarial tests including malformed provider rows and cross-project repository response rejection;
  - exact-head CI run `34034349485` on `00144dfb70b901fb7c05f2d71ad032a68b2a16bd`: **5/5 SUCCESS**, including Core quality/security, local Supabase DB/RLS, browser+mutation, privacy-safe preview and clean-checkout `npm run verify`;
  - unit suite remains at mandatory **100% global statements/branches/functions/lines** on the Pass-A head.
- FIRs updated: Lot Coverage Matrix + this Work Packet record are the durable equivalent structure; Feature Ledger whole-capability status remains intentionally separate from packet responsibility status.
- docs/status updated: kickoff recorded before implementation; Pass-A evidence and review cursor recorded after the exact-head 5/5 green verification.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable tests written
- [x] no known untracked stub/TODO
- [x] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [x] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Review source of truth used:

- `FEATURE-LEDGER.md` FTR-013/FTR-014;
- `REQUIREMENTS-CATALOG.md` VEN/IAM/AUTHZ responsibilities;
- `features/VENUES.md`;
- `domain/VENUES.md`, `STATE-MACHINES.md`, `PHYSICAL-SCHEMA-V1.md`, `INVARIANTS.md`;
- `architecture/SYNC.md` and runtime-input validation contracts where current commands expose operation/retry or URL semantics;
- security RLS/permission mapping and testing contracts;
- Lot 2 acceptance contract.

Findings:

| Severity | Finding | Owning Feature/Control | Resolution |
|---|---|---|---|
| **MAJOR** `WP2.1-B-001` | Revisioned ordinary update and lifecycle command do not carry/enforce a base/expected server revision. A stale client can therefore overwrite a newer ordinary field or reapply an old lifecycle intent instead of failing closed for re-evaluation. | PHYSICAL-SCHEMA §1.3; SYNC mutation envelope/protected-command conflict; invariants 82/85; WP-2.1 reusable mutation boundary | **OPEN — remediation required**: add expected-revision preconditions at application/adapter/DB boundaries and direct stale-write tests before re-review. |
| **MAJOR** `WP2.1-B-002` | `operationId` is already exposed/persisted by the lifecycle command but no receipt/replay contract exists. A retry after an intervening lifecycle change can execute the old semantic operation again with the same operation ID. The frozen schema already defines generic `sync_mutation_receipts` for the later full sync layer. | SYNC server idempotence; invariant 84; PHYSICAL-SCHEMA `sync_mutation_receipts` | **OPEN — remediation required**: do not claim operation-ID semantics prematurely. Remove the incomplete WP-2.1 operation-ID surface or implement an in-scope receipt contract without duplicating Lot 10; combine with expected-revision protection so stale retries cannot mutate current truth. |
| **MAJOR** `WP2.1-B-003` | `website_url` is validated in the TypeScript quick-add path but direct authenticated INSERT/UPDATE grants can store unsupported schemes because the DB constraint checks length only. That makes form/direct-API bypass capable of persisting canonical URL data that violates the allowlist contract. | INPUT-VALIDATION §§2/3/8/12; PHYSICAL-SCHEMA §1.9; FRONTEND-SECURITY direct-API mutation control | **OPEN — remediation required**: enforce the security-relevant scheme allowlist at the database boundary and add direct pgTAP bypass tests; keep standards-aware URL parsing at the application boundary. |
| **MAJOR** `WP2.1-B-004` | Quick-add provider response parsing validates that returned `project_id` is a UUID but does not bind it to the requested project. A valid-but-different project ID is accepted, unlike the newer repository-row parser. Network/API responses are explicitly untrusted boundaries. | AUTHZ project isolation; INPUT-VALIDATION trust revalidation; architecture fail-closed provider boundary | **OPEN — remediation required**: parse creation response against expected project ID and add a valid cross-project response regression test. |
| **MODERATE** `WP2.1-B-005` | Natural-code numeric comparison converts numeric segments to JavaScript `Number`; long legal code segments can exceed integer precision and compare distinct numeric suffixes as equal. | VEN-002 deterministic natural numeric code ordering | **OPEN — remediate with arbitrary-precision/string-safe numeric comparison and regression tests.** |

Review checks:

- [x] missing requirement/acceptance behavior searched
- [x] auth/RLS/cross-project/capability abuse searched
- [x] edge/error/offline/conflict/race paths searched
- [x] import/export/backup/version impacts searched
- [x] mobile/accessibility/QIF searched; no user-facing UI is accepted in this packet and local durable success remains explicitly deferred
- [x] architecture/provider/layer drift searched
- [x] size/complexity/god-file drift searched
- [x] weak/mirroring tests searched
- [x] undocumented stubs/TODOs searched

### Pass B decision

- [ ] `PASS` — no unresolved BLOCKING/MAJOR finding; packet moved to `ACCEPTANCE_PENDING`; current/next pass is `C-ACCEPTANCE`.
- [x] `FAIL` — BLOCKING/MAJOR finding exists; packet moved to `REVIEW_FAILED`; current/next pass is `REMEDIATION`.

Pass B decision: **FAIL**. Four MAJOR findings are open. A fresh adversarial re-review is required after remediation; prior Pass-A CI success is not acceptance evidence for these semantic/security gaps.

## Pass C — ACCEPTANCE / RECONCILIATION

### Entry gate

- [ ] packet entered Pass C from `ACCEPTANCE_PENDING`
- [ ] current pass is `C-ACCEPTANCE`
- [ ] no unresolved BLOCKING/MAJOR Pass B finding exists

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| venue identity/persistence | project-scoped canonical venue row with safe minimal fields | pending remediation/reconciliation | pending | pending |
| lifecycle/reject/restore | protected valid transitions, reversible rejection | pending remediation/reconciliation | pending | pending |
| lifecycle history | meaningful retained status/rejection history | pending remediation/reconciliation | pending | pending |
| authorization | venues.read/write + direct cross-project/anon/revoked deny | pending remediation/reconciliation | pending | pending |
| architecture | domain/application/infra layering, no direct UI provider access | pending remediation/reconciliation | pending | pending |

Acceptance checks:

- [ ] all packet responsibilities reconciled
- [ ] applicable FIR/equivalent durable fields complete
- [ ] required automated/manual evidence green
- [ ] no BLOCKING/MAJOR finding open
- [ ] architecture/complexity/static gates green
- [ ] documentation/status/handoff updated
- [ ] downstream prerequisites clearly recorded

Final packet decision: `REVIEW_FAILED` until remediation, fresh re-review and Pass C complete.

## Handoff

- Current state: `REVIEW_FAILED`
- Current/next pass: `REMEDIATION`
- Last green verification before review: run `34034349485`, 5/5 SUCCESS on Pass-A head `00144dfb70b901fb7c05f2d71ad032a68b2a16bd`, including clean-checkout `npm run verify`
- Remaining blocker/finding: `WP2.1-B-001` through `WP2.1-B-004` MAJOR open; `WP2.1-B-005` MODERATE open
- Next permitted action: remediate WP-2.1 findings only, rerun exact-head evidence, then perform fresh Pass B re-review; do not begin WP-2.2 concurrently

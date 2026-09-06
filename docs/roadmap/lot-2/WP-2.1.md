# WP-2.1 — Venue identity, authorized persistence and lifecycle-history foundation

## Identity

- Work Packet ID: `WP-2.1`
- Lot: `2`
- Name: Venue identity, authorized persistence and lifecycle-history foundation
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: `venues`
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Implementer/reviewer if relevant: current AI implementation session; Pass B must reconstruct expectations from repository contracts

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

- code/modules: pending
- migrations/schema: pending
- tests added: pending
- FIRs updated: Lot Coverage Matrix + this Work Packet record are the durable equivalent structure; Feature Ledger status will be updated when whole Feature responsibility reaches the applicable state.
- docs/status updated: kickoff state recorded before implementation.

### Pass A exit

- [ ] intended vertical slice exists
- [ ] applicable tests written
- [ ] no known untracked stub/TODO
- [ ] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [ ] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Review source of truth used:

- `FEATURE-LEDGER.md` FTR-013/FTR-014;
- `REQUIREMENTS-CATALOG.md` VEN/IAM/AUTHZ responsibilities;
- `features/VENUES.md`;
- `domain/VENUES.md`, `STATE-MACHINES.md`, `PHYSICAL-SCHEMA-V1.md`, `INVARIANTS.md`;
- security RLS/permission mapping and testing contracts;
- Lot 2 acceptance contract.

Findings:

| Severity | Finding | Owning Feature/Control | Resolution |
|---|---|---|---|
| pending | Pass B has not started | WP-2.1 | complete Pass A first |

Review checks:

- [ ] missing requirement/acceptance behavior searched
- [ ] auth/RLS/cross-project/capability abuse searched
- [ ] edge/error/offline/conflict/race paths searched
- [ ] import/export/backup/version impacts searched
- [ ] mobile/accessibility/QIF searched
- [ ] architecture/provider/layer drift searched
- [ ] size/complexity/god-file drift searched
- [ ] weak/mirroring tests searched
- [ ] undocumented stubs/TODOs searched

### Pass B decision

- [ ] `PASS` — no unresolved BLOCKING/MAJOR finding; packet moved to `ACCEPTANCE_PENDING`; current/next pass is `C-ACCEPTANCE`.
- [ ] `FAIL` — BLOCKING/MAJOR finding exists; packet moved to `REVIEW_FAILED`; current/next pass is `REMEDIATION`.

## Pass C — ACCEPTANCE / RECONCILIATION

### Entry gate

- [ ] packet entered Pass C from `ACCEPTANCE_PENDING`
- [ ] current pass is `C-ACCEPTANCE`
- [ ] no unresolved BLOCKING/MAJOR Pass B finding exists

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| venue identity/persistence | project-scoped canonical venue row with safe minimal fields | pending | pending | pending |
| lifecycle/reject/restore | protected valid transitions, reversible rejection | pending | pending | pending |
| lifecycle history | meaningful retained status/rejection history | pending | pending | pending |
| authorization | venues.read/write + direct cross-project/anon/revoked deny | pending | pending | pending |
| architecture | domain/application/infra layering, no direct UI provider access | pending | pending | pending |

Acceptance checks:

- [ ] all packet responsibilities reconciled
- [ ] applicable FIR/equivalent durable fields complete
- [ ] required automated/manual evidence green
- [ ] no BLOCKING/MAJOR finding open
- [ ] architecture/complexity/static gates green
- [ ] documentation/status/handoff updated
- [ ] downstream prerequisites clearly recorded

Final packet decision: `IN_PROGRESS` until Pass C completes.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- Last green verification: inherited PR #7 run `34030211097`, 5/5 SUCCESS on the exact Lot 0+1 integration base
- Remaining blocker/finding: none for WP-2.1
- Next permitted action: implement WP-2.1 only; do not begin WP-2.2 concurrently

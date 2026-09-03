# Work Packet Record — WP-1.2

## Identity

- Work Packet ID: `WP-1.2`
- Lot: `1`
- Name: Core tenancy schema, membership and RLS baseline
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: project tenancy / membership authorization
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary Feature IDs

- FTR-002, FTR-003 and FTR-004 tenancy prerequisites.
- Cross-cutting authorization foundation for all project-scoped Lot 1+ Features.

### Current-lot responsibilities covered

- canonical `profiles`, `projects`, `project_members` tables;
- active/revoked membership semantics;
- membership role references the migration-controlled `app_roles` catalog;
- membership-aware `has_project_permission(target_project_id, requested_permission)` using `auth.uid()` and active membership;
- explicit grants + RLS for core tenancy reads and narrowly permitted self-profile behavior;
- candidate-key/same-project integrity foundation required by downstream composite relationships;
- deterministic synthetic projects A/B/C, multi-project user, outsider, revoked member and owner/editor/viewer direct authorization tests;
- direct cross-project allow/deny evidence.

### Requirements / Acceptance / Security IDs

- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-003`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-018`, `AUTHZ-020` as applicable to core tenancy.
- Lot 1 acceptance: `profiles`, `projects`, `project_members`, RLS/same-project integrity foundation and cross-project CRUD denial.

### Explicitly out of scope for this packet

- first-owner provisioning command or Auth UI/session adapter — WP-1.3;
- partner invitation token lifecycle or owner-count invariant — WP-1.4;
- project settings/date/origin/preferences tables — WP-1.5;
- route shell/local cache/Storage/Realtime — later packets;
- product-domain tables or real wedding data.

## Dependency / sequencing

- Required prior packet: WP-1.1 **ACCEPTED**.
- Downstream packets blocked by this packet: WP-1.3 through WP-1.9 require the canonical tenancy boundary.
- Shared contracts: `PHYSICAL-SCHEMA-V1.md`, `PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`, `AUTHORIZATION-REQUIREMENTS.md`, `ROLE-PERMISSION-MATRIX.md`, `AUTHENTICATION.md`.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 1 | 3 | 3 |
| persistent entity/table | 3 | 1 | 3 |
| migration family | 1 | 1 | 1 |
| RLS/authorization boundary | 1 | 2 | 2 |
| **Total** |  |  | **9** |

- 9–10 point cohesion rationale: project identity, canonical active membership and the helper/RLS boundary must land atomically. Splitting them would create either tenant rows without authoritative authorization or authorization helpers without the relationship they must evaluate.
- >10 point exception: not applicable.

## Expected vertical slice

- UI/route: none.
- application command/query/service: no browser adapter yet; SQL authorization API becomes usable by later application infrastructure.
- domain rules/invariants: membership is explicit and revocable; unknown/inactive membership fails closed; role grants never bypass project identity.
- ports/interfaces: stable project/membership identifiers and permission helper SQL contract.
- infrastructure adapters: PostgreSQL RLS + helper functions.
- cloud persistence/RLS: `profiles`, `projects`, `project_members`, grants, policies, direct deny tests.
- local/offline behavior: none yet.
- import/export/backup/versioning impact: schema and authorization semantics become migration-controlled foundations.
- UX/QIF/accessibility impact: none.

## Pass A — IMPLEMENT

### Implementation evidence

- code/modules: pending.
- migrations/schema: pending.
- tests added: pending.
- FIRs updated: not yet; user-facing FTR implementation remains in subsequent packets.

### Pass A exit

- [ ] intended vertical slice exists
- [ ] direct allow/deny and cross-project tests written
- [ ] no known untracked stub/TODO
- [ ] exact-head affected/full verification green
- [ ] packet moved to `REVIEW_PENDING`

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- Last accepted prerequisite: WP-1.1.
- Remaining blocker/finding: none.
- Next permitted action: implement the canonical tenancy migration/RLS/helper and deterministic direct authorization matrix; then verify before Pass B.

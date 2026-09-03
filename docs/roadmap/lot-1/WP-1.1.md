# Work Packet Record — WP-1.1

## Identity

- Work Packet ID: `WP-1.1`
- Lot: `1`
- Name: Permission catalog and authorization helper foundation
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: authorization metadata / permission evaluation foundation
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary Feature IDs

- Cross-cutting foundation for FTR-002..FTR-012 and FTR-119 Lot-1 responsibilities.

### Current-lot responsibilities covered

- migration-controlled `app_permissions`, `app_roles`, `app_role_permissions` catalogs;
- stable dotted permission keys matching the frozen role-permission contract;
- centralized role→permission mapping with owner/editor/viewer fixtures;
- fail-closed permission-evaluation helper scaffold that cannot grant from a client-supplied role;
- direct SQL evidence for catalog integrity and deny-by-default behavior;
- no project/member business RLS yet; that belongs to WP-1.2.

### Requirements / Acceptance / Security IDs

- `AUTHZ-002`, `AUTHZ-003`, `AUTHZ-004`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-018`, `AUTHZ-020` as applicable to authorization metadata.
- Lot 1 acceptance: permission/role model foundation and direct security evidence.

### Explicitly out of scope for this packet

- `profiles`, `projects`, `project_members` and project-scoped RLS;
- project provisioning/Auth UI;
- partner invitation token lifecycle;
- wedding domain tables;
- guest capability implementation;
- Storage/Realtime policies.

## Dependency / sequencing

- Required prior packets/features: Lot 0 accepted DB/RLS harness.
- Downstream packets blocked by this packet: WP-1.2 through WP-1.9 depend on stable permission keys/helper semantics.
- Shared interfaces/contracts relied on: `PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`, `AUTHORIZATION-REQUIREMENTS.md`, `ROLE-PERMISSION-MATRIX.md`.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 1 | 3 | 3 |
| persistent entity/table | 3 | 1 | 3 |
| migration family | 1 | 1 | 1 |
| RLS/privileged authorization boundary | 1 | 2 | 2 |
| **Total** |  |  | **9** |

- 9–10 point cohesion rationale: the permission catalog, role mapping and helper contract are one security API. Splitting them would create a migration state where authorization metadata exists without a usable, testable evaluation contract or vice versa.
- >10 point exception: not applicable.

## Expected vertical slice

- UI/route: none.
- application command/query/service: none yet; later packets consume stable permission keys.
- domain rules/invariants: permission keys fail closed; role mapping is centrally controlled; unknown role/permission never grants.
- ports/interfaces: stable permission-key contract only.
- infrastructure adapters: PostgreSQL authorization helper scaffold.
- cloud persistence/RLS: migration-owned catalogs; ordinary client mutation prohibited by grants/RLS posture.
- local/offline behavior: none.
- import/export/backup/versioning impact: permission keys become security/versioned API and must remain migration-controlled.
- UX/QIF/accessibility impact: none.

## Pass A — IMPLEMENT

### Implementation evidence

- code/modules: pending.
- migrations/schema: pending.
- tests added: pending.
- FIRs updated: not applicable as this packet is a cross-cutting foundation; affected Feature FIRs begin with their first user-facing implementation packet.
- docs/status updated: coverage matrix + status board + this record created.

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

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- Last green verification: inherited Lot 0 exact-head full verification.
- Remaining blocker/finding: none.
- Next permitted action: implement migration-controlled authorization catalog/helper plus direct SQL tests, then run affected/full verification and transition to `REVIEW_PENDING`.

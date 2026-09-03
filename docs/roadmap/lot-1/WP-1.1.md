# Work Packet Record — WP-1.1

## Identity

- Work Packet ID: `WP-1.1`
- Lot: `1`
- Name: Permission catalog and authorization helper foundation
- State: `REVIEW_FAILED`
- Current pass: `A-IMPLEMENT-REPAIR`
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

- migration/schema: `supabase/migrations/20260903213500_create_authorization_catalog.sql` creates the three migration-owned authorization catalogs, seeds all 51 frozen V1 permission keys, seeds owner/editor/viewer templates and provides the internal role-permission lookup scaffold;
- grants/security posture: ordinary `anon`/`authenticated` table access is revoked and direct client execution of the internal role lookup is revoked;
- tests: `supabase/tests/authorization_catalog_test.sql` provides 14 direct pgTAP assertions covering catalog existence/counts, representative allow/deny mappings, fail-closed unknown state, client privilege denial and key-format integrity;
- CI: exact-head run `33809158568` on `b76aa509d84c4aa73f80669faa2c9d6b494c15b8` completed all five jobs successfully, including local Supabase start/reset/test/stop and clean-checkout `npm run verify`;
- scope: compare against accepted Lot 0 base shows only Lot 1 orchestration docs, the authorization migration/test and CI branch activation; no project/member/product-domain implementation leaked into WP-1.1;
- FIRs updated: not applicable as this packet is a cross-cutting foundation; affected Feature FIRs begin with their first user-facing implementation packet.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable tests written
- [x] no known untracked stub/TODO
- [x] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [x] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

### Review result

**FAIL — 2 MAJOR findings.** Green CI is not sufficient for acceptance until both findings are repaired and independently re-reviewed.

### Findings

#### WP1-AR-001 — MAJOR — role matrix is not proven exactly

Normative expectation: `PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md` requires authorization tests to validate the built-in matrix in `security/ROLE-PERMISSION-MATRIX.md`.

Observed implementation: the migration contains a full mapping, but the direct test only samples a handful of editor/viewer allows and denies. An accidental extra privileged grant, such as `backup.restore` to editor, could pass every current assertion.

Required repair: add exact set-equality evidence for owner, editor and viewer against the complete normative allowed permission sets, proving both missing and extra mappings fail the test.

#### WP1-AR-002 — MAJOR — SECURITY DEFINER search path is wider than necessary

Normative expectation: the authorization addendum requires a safe search path when a `SECURITY DEFINER` helper is required.

Observed implementation: `public.role_has_permission` uses `set search_path = public, pg_temp`. The referenced application tables are already fully qualified, so writable/non-system schemas do not need to be resolvable through the function search path.

Required repair: restrict the helper search path to trusted system scope (for example `pg_catalog`) while preserving fully qualified application object references; verify the function still fails closed and remains non-executable by ordinary client roles.

### Additional hardening required during repair

- explicitly revoke catalog privileges from `PUBLIC` as well as `anon` and `authenticated`, so the migration records the intended default-deny posture rather than relying only on PostgreSQL table defaults;
- retain exact direct evidence that ordinary client roles cannot invoke the internal role lookup.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Forbidden while any Pass B MAJOR finding is open.

## Handoff

- Current state: `REVIEW_FAILED`
- Current/next pass: `A-IMPLEMENT-REPAIR`
- Last green verification before adversarial findings: run `33809158568`, all five jobs SUCCESS.
- Remaining blockers/findings: `WP1-AR-001` MAJOR open; `WP1-AR-002` MAJOR open.
- Next permitted action: repair both findings, rerun affected/full verification, then return WP-1.1 to `REVIEW_PENDING` for a fresh independent Pass B.
- WP-1.2 remains forbidden.

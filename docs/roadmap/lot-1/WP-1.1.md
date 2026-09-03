# Work Packet Record — WP-1.1

## Identity

- Work Packet ID: `WP-1.1`
- Lot: `1`
- Name: Permission catalog and authorization helper foundation
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE`
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
- grants/security posture: ordinary `PUBLIC`, `anon` and `authenticated` table access is explicitly revoked; direct client execution of the internal role lookup is explicitly revoked;
- tests: `supabase/tests/authorization_catalog_test.sql` now provides 13 direct pgTAP assertions including exact owner/editor/viewer set equality, fail-closed unknown state, client privilege denial, exact `SECURITY DEFINER` search-path posture and key-format integrity;
- initial CI before review: run `33809158568` on `b76aa509d84c4aa73f80669faa2c9d6b494c15b8`, all five jobs SUCCESS;
- repair CI: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS including local DB/RLS verification and clean-checkout `npm run verify`;
- scope: only Lot 1 orchestration docs, authorization migration/test and CI branch activation exist beyond the accepted Lot 0 base; no project/member/product-domain implementation leaked into WP-1.1;
- FIRs updated: not applicable as this packet is a cross-cutting foundation; affected Feature FIRs begin with their first user-facing implementation packet.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable tests written
- [x] no known untracked stub/TODO
- [x] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [x] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

### First review result

**FAIL — 2 MAJOR findings.**

#### WP1-AR-001 — MAJOR — role matrix was not proven exactly

- Repair: representative mapping assertions were replaced by exact set equality for owner, editor and viewer.
- Independent re-review: compared the repaired editor/viewer sets directly with `security/ROLE-PERMISSION-MATRIX.md`; editor has exactly 40 normative grants, viewer exactly 12 conservative grants, owner exactly all 51 catalog permissions.
- Verification: direct DB tests and full verify are green in run `33809855993`.
- Status: **CLOSED**.

#### WP1-AR-002 — MAJOR — SECURITY DEFINER search path was wider than necessary

- Repair: `public.role_has_permission` now uses `set search_path = pg_catalog`; all application relations remain explicitly schema-qualified.
- Additional hardening: table/function privileges explicitly revoke `PUBLIC`, `anon` and `authenticated` where applicable.
- Independent re-review: function still fails closed for unknown role/permission, client roles cannot execute it, and the pgTAP suite directly checks `proconfig = ARRAY['search_path=pg_catalog']`.
- Verification: direct DB tests and full verify are green in run `33809855993`.
- Status: **CLOSED**.

### Second review result

**PASS — 0 open BLOCKING/MAJOR findings.**

The re-review independently checked the normative role matrix, helper privilege surface, default-deny catalog posture, fail-closed behavior, migration boundaries and exact-head verification. No new BLOCKING/MAJOR finding was identified.

## Pass C — ACCEPTANCE / RECONCILIATION

In progress.

Acceptance must compare normative expectation, actual implementation and runtime/CI evidence for each WP-1.1 responsibility. No downstream packet may begin until this reconciliation is complete.

## Handoff

- Current state: `ACCEPTANCE_PENDING`
- Current/next pass: `C-ACCEPTANCE`
- Last green verification: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS including clean-checkout `npm run verify`.
- Remaining blockers/findings: none.
- Next permitted action: perform Pass C responsibility-by-responsibility reconciliation; if complete, mark WP-1.1 accepted and only then open WP-1.2.

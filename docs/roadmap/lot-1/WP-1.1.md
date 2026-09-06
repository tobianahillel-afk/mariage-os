# Work Packet Record — WP-1.1

## Identity

- Work Packet ID: `WP-1.1`
- Lot: `1`
- Name: Permission catalog and authorization helper foundation
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
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
- Downstream packets unblocked by acceptance: WP-1.2 may now start; later packets still depend on their own prerequisites.
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
- import/export/backup/versioning impact: permission keys are now a migration-controlled security/versioned API.
- UX/QIF/accessibility impact: none.

## Pass A — IMPLEMENT

### Implementation evidence

- migration/schema: `supabase/migrations/20260903213500_create_authorization_catalog.sql` creates the three migration-owned authorization catalogs, seeds all 51 frozen V1 permission keys, seeds owner/editor/viewer templates and provides the internal role-permission lookup scaffold;
- grants/security posture: ordinary `PUBLIC`, `anon` and `authenticated` table access is explicitly revoked; direct client execution of the internal role lookup is explicitly revoked;
- tests: `supabase/tests/authorization_catalog_test.sql` provides 13 direct pgTAP assertions including exact owner/editor/viewer set equality, fail-closed unknown state, client privilege denial, exact `SECURITY DEFINER` search-path posture and key-format integrity;
- initial CI before review: run `33809158568` on `b76aa509d84c4aa73f80669faa2c9d6b494c15b8`, all five jobs SUCCESS;
- repair CI: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS including local DB/RLS verification and clean-checkout `npm run verify`;
- scope: no project/member/product-domain implementation leaked into WP-1.1;
- FIRs updated: not applicable as this packet is a cross-cutting foundation; affected Feature FIRs begin with their first user-facing implementation packet.

## Pass B — ADVERSARIAL REVIEW

### First review result

**FAIL — 2 MAJOR findings.**

#### WP1-AR-001 — MAJOR — role matrix was not proven exactly

- Repair: representative mapping assertions were replaced by exact set equality for owner, editor and viewer.
- Independent re-review: compared repaired editor/viewer sets directly with `security/ROLE-PERMISSION-MATRIX.md`; editor has exactly 40 normative grants, viewer exactly 12 conservative grants, owner exactly all 51 catalog permissions.
- Verification: direct DB tests and full verify green in run `33809855993`.
- Status: **CLOSED**.

#### WP1-AR-002 — MAJOR — SECURITY DEFINER search path was wider than necessary

- Repair: `public.role_has_permission` now uses `set search_path = pg_catalog`; all application relations remain explicitly schema-qualified.
- Additional hardening: table/function privileges explicitly revoke `PUBLIC`, `anon` and `authenticated` where applicable.
- Independent re-review: function still fails closed for unknown role/permission, client roles cannot execute it, and pgTAP directly checks `proconfig = ARRAY['search_path=pg_catalog']`.
- Verification: direct DB tests and full verify green in run `33809855993`.
- Status: **CLOSED**.

### Second review result

**PASS — 0 open BLOCKING/MAJOR findings.**

The re-review independently checked the normative role matrix, helper privilege surface, default-deny catalog posture, fail-closed behavior, migration boundaries and exact-head verification. No new BLOCKING/MAJOR finding was identified.

## Pass C — ACCEPTANCE / RECONCILIATION

### Responsibility-by-responsibility decision

| Responsibility | Normative expectation | Implemented | Verified |
|---|---|---|---|
| permission catalog | stable migration-controlled V1 permission keys | 51 dotted keys in `app_permissions` | exact count + clean migration/DB test |
| built-in roles | owner/editor/viewer centrally controlled | `app_roles` seeds exactly three assignable built-ins | direct pgTAP role count |
| role mapping | exact frozen built-in matrix, no ad-hoc feature branching | `app_role_permissions` migration seed | exact set equality for owner/editor/viewer against normative matrix |
| fail-closed lookup | unknown role/permission never grants | `role_has_permission` uses existence over migration-owned mapping | direct unknown-role/permission deny assertion |
| client trust boundary | client cannot authorize itself by supplying a role | helper/table execution/read surface revoked from ordinary client roles | direct privilege assertions |
| privileged helper hardening | safe search path for SECURITY DEFINER | `search_path = pg_catalog`, application objects schema-qualified | direct `pg_proc.proconfig` assertion |
| scope boundary | no project/member RLS before WP-1.2 | only authorization metadata/helper introduced | compare against accepted Lot 0 base + full CI |
| regression safety | all inherited Lot 0 gates remain green | CI workflow generalized without weakening gates | run `33809855993`, five jobs SUCCESS including full verify |

### Acceptance decision

**ACCEPTED.**

- Contract expectation present: yes.
- Actual implementation present: yes.
- Runtime/CI evidence present: yes.
- Open BLOCKING/MAJOR findings: **0**.
- Known scope leakage: **none**.

WP-1.1 may be reopened later only if a downstream integration objectively invalidates one of these guarantees.

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `C-ACCEPTANCE-COMPLETE`
- Acceptance evidence: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS.
- Remaining blockers/findings: none.
- Next permitted action: open and implement WP-1.2 only.

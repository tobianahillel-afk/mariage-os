# Work Packet Record — WP-1.2

## Identity

- Work Packet ID: `WP-1.2`
- Lot: `1`
- Name: Core tenancy schema, membership and RLS baseline
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE`
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

- migration/schema: `supabase/migrations/20260903221000_create_core_tenancy.sql` creates canonical `profiles`, `projects` and `project_members`, role-catalog FK, active/revoked consistency, active-member index, membership-aware `has_project_permission`, self-profile timestamp trigger, explicit grants and RLS;
- authorization semantics: `has_project_permission` derives identity from `auth.uid()`, requires a live active membership and delegates the role grant to the accepted migration-controlled permission catalog; it uses `SECURITY DEFINER` with `search_path = pg_catalog` and fully-qualified application relations;
- generic browser mutation posture: `projects` and `project_members` receive no client insert/update/delete grants; profiles expose only self read plus column-scoped update of `display_name`/`avatar_url` while audit identity/timestamps remain protected;
- original direct tests: 31 pgTAP assertions established tenancy/RLS semantics and cross-project fixtures;
- original Pass A verification: run `33810828047` on `dc7bde6ffba627ffb8fb095e2b16ef7cddd83c7b`, all five jobs SUCCESS;
- scope evidence: no first-owner provisioning, invitation lifecycle, route shell, local cache, Storage/Realtime or Lot 2+ domain code was introduced.

## Pass B — ADVERSARIAL REVIEW

### First review

**FAIL — `WP12-AR-001` MAJOR.** The direct evidence did not exhaustively prove the grant/operation-denial surface required by `AUTHZ-006/007`.

### Repair

`supabase/tests/core_tenancy_rls_test.sql` was strengthened from 31 to 41 direct assertions without broadening production privileges. The repair now proves:

- no anonymous SELECT on any core tenancy table;
- anonymous execute denial and authenticated execute allow for `has_project_permission`;
- `projects` grant surface is SELECT-only for authenticated;
- `project_members` grant surface is SELECT-only for authenticated;
- `profiles` has SELECT plus only column-scoped UPDATE on `display_name` and `avatar_url`;
- no profile INSERT/DELETE or protected-column update;
- runtime generic project UPDATE/DELETE denial;
- runtime membership INSERT/UPDATE/DELETE denial;
- existing A/B/C, owner/editor/viewer, outsider, multi-project and revoked-member behavior remains intact.

Repair verification: exact-head run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc` completed all five jobs successfully, including the repaired `db:verify`, dependency/security gates, browser/mutation harnesses, preview build and clean-checkout `npm run verify`.

### Fresh independent review

**PASS.** `WP12-AR-001` is closed. Re-review against `AUTHORIZATION-REQUIREMENTS.md`, the authorization addendum and physical schema found no remaining BLOCKING/MAJOR issue:

- identity derives from `auth.uid()` and current server-side membership;
- inactive/revoked membership fails closed immediately without a fresh login;
- known project UUIDs do not bypass membership or permission checks;
- ordinary browser roles cannot create, update or delete project/membership security state through generic CRUD;
- table, column and RPC grants are now directly evidenced alongside RLS behavior;
- the permission helper keeps a trusted `pg_catalog` search path and fully-qualified relation access;
- no project/member security responsibility belonging to WP-1.3/WP-1.4 was smuggled into this packet.

## Pass C — ACCEPTANCE / RECONCILIATION

### Contract → implementation → evidence

| Responsibility | Normative expectation | Implementation | Objective evidence | Result |
|---|---|---|---|---|
| Core identity/tenancy schema | physical schema defines `profiles`, `projects`, `project_members` | ordered migration creates canonical tables/constraints | clean reset + DB tests in run `33811568440` | PASS |
| Active membership authorization | `AUTHZ-001/004/012`; live active membership required | `has_project_permission` reads current membership via `auth.uid()` | owner/editor/viewer/revoked/outsider assertions | PASS |
| Permission-based evaluation | `AUTHZ-002/003` | accepted WP-1.1 catalog + membership role FK/helper composition | exact role matrix + WP-1.2 direct tests | PASS |
| Cross-project isolation | `AUTHZ-005/018` | project-scoped RLS driven by row project ID + helper | A/B/C + multi-project + outsider tests | PASS |
| Explicit grants and RLS | `AUTHZ-006/007` | revoked defaults, narrow authenticated grants, RLS policies | repaired exact privilege matrix + runtime denies | PASS |
| Sensitive-column protection | `AUTHZ-008` | membership generic mutation absent; profile ordinary-column UPDATE only | column privilege assertions + denied audit mutation | PASS |
| Fail-closed client identity | authorization addendum | client does not supply membership role; helper derives `auth.uid()` | wrong/absent membership and revoked tests | PASS |
| Regression / clean checkout | engineering acceptance | no gate weakening | all five jobs in `33811568440` SUCCESS | PASS |

Acceptance reconciliation: every WP-1.2 responsibility has normative contract, implementation and objective evidence; no open BLOCKING/MAJOR finding remains.

## Handoff

- Current state: `ACCEPTANCE_PENDING`
- Current/next pass: `C-ACCEPTANCE`
- Last green verification: run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS.
- Remaining blocker/finding: none.
- Next permitted action: record WP-1.2 acceptance and then open WP-1.3; no WP-1.3 implementation before that durable transition.

# Work Packet Record — WP-1.2

## Identity

- Work Packet ID: `WP-1.2`
- Lot: `1`
- Name: Core tenancy schema, membership and RLS baseline
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW`
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
- direct tests: `supabase/tests/core_tenancy_rls_test.sql` provides 31 pgTAP assertions covering anonymous denial, owner/editor/viewer behavior, projects A/B/C isolation, multi-project membership, outsider denial, revoked-member immediate denial, generic project/member mutation denial, self-profile constraints and DB integrity constraints;
- regression evidence: run `33810828047` on exact HEAD `dc7bde6ffba627ffb8fb095e2b16ef7cddd83c7b` completed all five jobs successfully: Core quality/security, Local Supabase DB/RLS, Browser+mutation, privacy-safe preview and clean-checkout `npm run verify`;
- scope evidence: implementation remains limited to core tenancy/RLS plus packet/status documentation; no first-owner provisioning, invitation lifecycle, route shell, local cache, Storage/Realtime or Lot 2+ domain code was introduced;
- FIRs updated: not yet; user-facing Feature acceptance remains in subsequent packets.

### Pass A exit

- [x] intended vertical slice exists
- [x] direct allow/deny and cross-project tests written
- [x] no known untracked stub/TODO
- [x] exact-head affected/full verification green
- [x] packet moved to `REVIEW_PENDING`

## Pass B — ADVERSARIAL REVIEW

In progress. Review must independently challenge grants, every exposed read/write surface, RLS recursion/bypass, live revocation, cross-project UUID knowledge, client-controllable identity/role state and schema-contract alignment. Green CI alone is not acceptance.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Forbidden until Pass B closes without open BLOCKING/MAJOR findings.

## Handoff

- Current state: `REVIEW_PENDING`
- Current/next pass: `B-ADVERSARIAL-REVIEW`
- Last green verification: run `33810828047` on `dc7bde6ffba627ffb8fb095e2b16ef7cddd83c7b`, all five jobs SUCCESS.
- Remaining blocker/finding: none recorded before Pass B; adversarial review is active.
- Next permitted action: complete independent Pass B; repair any BLOCKING/MAJOR finding before Pass C.
- WP-1.3 remains forbidden until WP-1.2 acceptance.

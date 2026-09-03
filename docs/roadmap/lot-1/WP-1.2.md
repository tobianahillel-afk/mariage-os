# Work Packet Record — WP-1.2

## Identity

- Work Packet ID: `WP-1.2`
- Lot: `1`
- Name: Core tenancy schema, membership and RLS baseline
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
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
- Shared contracts: `PHYSICAL-SCHEMA-V1.md`, `PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`, `AUTHORIZATION-REQUIREMENTS.md`, `ROLE-PERMISSION-MATRIX.md`, `AUTHENTICATION.md`.

## Sizing review

Planning complexity: **9/10**, accepted cohesion rationale: project identity, canonical membership and its RLS/helper boundary must land atomically.

## Pass A — IMPLEMENT

Implemented `supabase/migrations/20260903221000_create_core_tenancy.sql` with canonical tenancy schema, active/revoked membership semantics, live membership-aware permission evaluation, narrow grants and RLS. Initial direct matrix contained 31 pgTAP assertions. Initial exact-head run `33810828047` on `dc7bde6ffba627ffb8fb095e2b16ef7cddd83c7b` passed all five CI jobs.

## Pass B — ADVERSARIAL REVIEW

First review failed with `WP12-AR-001` MAJOR because grant/operation-denial evidence was incomplete. The test suite was strengthened from 31 to 41 direct assertions without widening production privileges. It now proves anonymous/table/RPC denial, exact authenticated table and column grant surfaces, denied generic project/member/profile mutations, plus A/B/C, role, outsider, multi-project and revoked-member behavior.

Fresh review result: **PASS**. `WP12-AR-001` closed; no remaining BLOCKING/MAJOR finding.

Repair verification: exact-head run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc` passed all five jobs, including repaired `db:verify` and clean-checkout `npm run verify`.

## Pass C — ACCEPTANCE / RECONCILIATION

| Responsibility | Contract | Implementation | Evidence | Result |
|---|---|---|---|---|
| Core identity/tenancy schema | physical schema | ordered migration | clean reset + DB tests | PASS |
| Active membership authorization | AUTHZ-001/004/012 | live `auth.uid()` + membership helper | role/revoked/outsider tests | PASS |
| Permission-based evaluation | AUTHZ-002/003 | WP-1.1 catalog + role FK/helper | exact role + tenancy tests | PASS |
| Cross-project isolation | AUTHZ-005/018 | RLS by row project + live permission | A/B/C/multi-project tests | PASS |
| Grants + RLS | AUTHZ-006/007 | explicit revoke/narrow grants/policies | 41-assertion privilege/runtime matrix | PASS |
| Sensitive-column protection | AUTHZ-008 | no generic member mutation; profile column grant | privilege + denied mutation tests | PASS |
| Fail-closed identity | authorization addendum | identity from `auth.uid()` | absent/revoked/outsider tests | PASS |
| Regression | engineering acceptance | no gate weakening | five CI jobs SUCCESS | PASS |

**Acceptance result: PASS. WP-1.2 ACCEPTED.**

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `C-ACCEPTANCE-COMPLETE`
- Acceptance evidence: run `33811568440`, exact tested head `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS.
- Closed finding: `WP12-AR-001` MAJOR.
- Remaining blocker/finding: none.
- Next packet permitted: WP-1.3 — Supabase Auth/session and controlled first-owner provisioning.

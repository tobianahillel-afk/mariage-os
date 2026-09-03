# Authorization and Row Level Security

Status: **Normative V1 + public-readiness security contract**

Read first:

- `AUTHORIZATION-MODEL.md`
- `ROLE-PERMISSION-MATRIX.md`
- `PRIVILEGED-OPERATIONS.md`
- `RLS-MATRIX-V1.md`

## Principle

Authentication answers “who are you?”. Authorization answers “may this identity perform this action on this project/resource now?”.

Mariage OS authorization is enforced in PostgreSQL/Storage/RPC policy boundaries, never merely by client UI.

## Canonical model

`project_members(project_id, user_id, role, membership_status, ...)` is the canonical project relationship.

Feature/domain code requests an explicit permission such as `venues.write` or `backup.full_export`; it does **not** authorize with scattered `role === owner` checks.

Conceptual DB primitive:

```sql
has_project_permission(target_project_id, requested_permission)
```

Permission evaluation combines:

1. authenticated identity;
2. active project membership;
3. centralized role→permission mapping;
4. resource project ownership;
5. relationship/attribute constraints;
6. domain state/invariants;
7. authentication assurance where required.

Project roles are not trusted as stale long-lived client claims. Current DB membership remains authoritative.

## Roles

Built-in templates:

- `owner`;
- `editor`;
- `viewer`.

V1 production uses two owners, but the permission system and isolation tests exist from the start. Exact grants are normative in `ROLE-PERMISSION-MATRIX.md`.

## RLS baseline

For every exposed project-scoped table:

- RLS enabled;
- unnecessary `anon` / `authenticated` table grants revoked;
- explicit operation grants;
- explicit SELECT policy;
- explicit INSERT policy;
- explicit UPDATE policy;
- explicit DELETE policy or deliberate denial;
- `WITH CHECK` prevents writing rows into unauthorized projects;
- policy evaluates current membership/permission;
- allow and deny tests exist.

A missing policy is not interpreted as future work if the table is exposed; it is a release blocker.

## Deny by default

- anonymous private access denied;
- unknown role/permission denied;
- inactive/revoked membership denied;
- project mismatch denied;
- authorization configuration failure fails closed;
- known UUID/path does not grant access.

## Cross-project integrity

RLS is necessary but not sufficient.

Foreign keys/link tables must also prevent relationships from project A to project B through composite constraints, validated polymorphic links, narrow commands or equivalent DB-enforced mechanisms.

## Relationship constraints

Even with broad project permission:

- a member writes only their own ratings/preferences;
- a member casts only their own approval;
- referenced assignee/member must belong to project;
- linked entities must share project;
- finance/seating/decision/fact state transitions obey domain invariants.

## Ownership/member administration

Member invite/revoke/role changes use protected commands from `PRIVILEGED-OPERATIONS.md`.

The last active owner cannot be removed by ordinary flow.

No generic client update to `project_members.role` is permitted.

## Protected columns

RLS is row-level. System/security-sensitive columns require additional protection as appropriate:

- `project_id`;
- audit identities/timestamps;
- server revision;
- membership role/status;
- invitation hashes;
- protected finance/system state.

Use column grants, immutable semantics, triggers and/or narrow commands; never rely on UI omission.

## Functions/views

Any exposed view/function is part of the authorization surface.

- views must not accidentally bypass RLS;
- security-definer functions use fixed safe `search_path`;
- every privileged function explicitly checks `auth.uid()`, target project and permission;
- functions expose minimal results;
- service-role/secret credentials never enter browser code.

## Realtime

Receiving an event is data access. Realtime subscriptions remain project-scoped/authorized and never bypass DB boundaries.

## Storage

Storage policies are independent authorization checks.

Object path is not authority. Access must verify membership + appropriate permission (document/media/sensitive-document class). Signed access is short-lived and cannot expand permissions.

## Public-ready multi-tenancy

Tests must contain multiple projects/users even though the private deployment has one real project. Cross-tenant isolation is a V1 invariant, not deferred SaaS work.

## Tests

At minimum for each project-scoped resource/operation:

1. permitted owner action succeeds;
2. anonymous denied;
3. outsider denied;
4. other-project member denied;
5. revoked member denied;
6. viewer/editor forbidden operations denied;
7. own-project insert/write succeeds only when permission allows;
8. cross-project `project_id` injection denied;
9. changing project ownership field denied;
10. protected-column escalation denied;
11. relationship-owned row impersonation denied;
12. direct REST/RPC/Storage requests fail the same way as hidden UI;
13. role downgrade/revocation takes server-side effect during active session;
14. stale cached permission cannot authorize cloud mutation.

RLS tests are mandatory release gates. UI E2E is not a substitute for direct policy tests.